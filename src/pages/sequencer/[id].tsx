import Head from "next/head";
import {
	connectionConfig,
	Instrument,
	instrumentList,
	Note,
	NoteKey,
	schema,
	SequenceMetadata,
} from "@/server/types";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { AddNotes, ClearNotes, EditSequence } from "@/database/calls";
import PianoRoll from "@/components/PianoRoll";
import TopBar from "@/components/TopBar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	getInstruments,
	getTick,
	PlaySequence,
	setTickFunction,
	StopSequence,
	WriteMidi,
	setLoop,
	clearLoop,
	playNote,
	playNoteDefault,
} from "@/client/write_midi";
import { SharedCounter } from "@fluidframework/counter";
import Cursor from "@/components/Cursor";
import {
	SharedMap,
	LoadableObjectRecord,
	AttachState,
	ConnectionState,
	IValueChanged,
	IFluidContainer,
} from "fluid-framework";
import { AzureClient } from "@fluidframework/azure-client";
import { UndoRedoStack } from "@/client/undo_redo";
import { useRouter } from "next/router";
import { TinyliciousContainerServices } from "@fluidframework/tinylicious-client";

type PageParams = {
	id: string;
};

const RenderState = {
	wait: 0,
	ready: 1,
	fail: -1,
} as const;

export default function Home({ id }: PageParams) {
	const router = useRouter();
	const [tick, setTick] = useState(-1);
	const [stepLength, setStepLength] = useState(1);
	const [fluidInitialObjects, setFluidInitialObjects] =
		useState<LoadableObjectRecord>();
	const [fluidContainer, setFluidContainer] = useState<IFluidContainer>();
	const [fluidServices, setFluidServices] =
		useState<TinyliciousContainerServices>();
	const [renderState, setRenderState] = useState<number>(RenderState.wait);
	const [voteCount, setVoteCount] = useState(0);
	const [undoRedoHandler] = useState(new UndoRedoStack());

	const [notes, setNotes] = useState<Map<string, Note>>(
		new Map<string, Note>()
	);
	const [seqData, setSeq] = useState<SequenceMetadata>(
		new SequenceMetadata()
	);
	const [currentInstrument, setCurrentInstrument] = useState({
		instrument: instrumentList.Piano,
		primary: "--yellow",
		accent: "--yellow-accent",
	});

	useEffect(() => {
		const client: AzureClient = new AzureClient(connectionConfig);
		client
			.getContainer(id, schema)
			.then(({ container, services }) => {
				if (container == null || services == null) {
					setRenderState(RenderState.fail);
					return;
				}

				container.once("disposed", (error?) => {
					if (error != null) {
						console.error(error);
					}
					router.push("/");
					setRenderState(RenderState.wait);
				});

				if (
					container.attachState === AttachState.Attached ||
					container.attachState === AttachState.Attaching
				) {
					if (
						container.connectionState ===
							ConnectionState.Connected ||
						container.connectionState ==
							ConnectionState.CatchingUp ||
						container.connectionState ==
							ConnectionState.EstablishingConnection
					) {
						setFluidContainer(container);
						setFluidInitialObjects(container.initialObjects);
						setFluidServices(services);
					} else {
						container.connect();
						setRenderState(RenderState.fail);
						container.once("connected", () => {
							setFluidContainer(container);
							setFluidInitialObjects(container.initialObjects);
							setFluidServices(services);
						});
						throw new Error("Could not connect");
					}
				} else {
					setRenderState(RenderState.fail);
					throw new Error("Not attached to service");
				}
			})
			.catch((reason) => {
				setRenderState(RenderState.wait);
			});

		// Render Instruments
		getInstruments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	// Run when container updates
	useEffect(() => {
		if (fluidInitialObjects != null) {
			const flSeq = fluidInitialObjects.metadata as SharedMap;
			const flNotes = fluidInitialObjects.sequence as SharedMap;
			const flVotes =
				fluidInitialObjects.syncPlaybackVotes as SharedCounter;

			const fluidUpdateSeq = (changed: IValueChanged, local: boolean) => {
				setSeq(getMetadata(flSeq));
			};
			const fluidUpdateNotes = (
				changed: IValueChanged,
				local: boolean
			) => {
				setNotes(getNoteMap(flNotes));
			};
			const fluidUpdateVoteCount = (
				changed: IValueChanged,
				local: boolean
			) => {
				setVoteCount(flVotes.value);
			};

			setSeq(getMetadata(flSeq));
			setNotes(getNoteMap(flNotes));
			setVoteCount(flVotes.value);
			flSeq.on("valueChanged", fluidUpdateSeq);
			flNotes.on("valueChanged", fluidUpdateNotes);
			flVotes.on("valueChanged", fluidUpdateVoteCount);
			undoRedoHandler.setNoteMap(flNotes);
			setRenderState(RenderState.ready);

			return () => {
				flSeq.off("valueChanged", fluidUpdateSeq);
				flNotes.off("valueChanged", fluidUpdateNotes);
				flVotes.off("valueChanged", fluidUpdateVoteCount);
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fluidInitialObjects]);

	const changeSeq = useCallback(
		(newSequence: SequenceMetadata) => {
			const flSeq = fluidInitialObjects?.metadata as SharedMap;
			if (flSeq != null) {
				Object.keys(newSequence).forEach((key) => {
					flSeq.set(key, newSequence[key as keyof SequenceMetadata]);
				});
				setSeq(new SequenceMetadata(newSequence));
			}
		},
		[fluidInitialObjects]
	);

	const getArray = useCallback(() => {
		return Array.from(notes.values());
	}, [notes]);

	const voteForSyncPlayback = useCallback(() => {
		const flVotes = fluidInitialObjects?.syncPlaybackVotes as SharedCounter;
		flVotes.increment(1);
		if (flVotes.value == fluidServices?.audience.getMembers().size) {
			//TODO: synchronized playback
		}
	}, [fluidInitialObjects, fluidServices]);

	const unvoteForSyncPlayback = useCallback(() => {
		const flVotes = fluidInitialObjects?.syncPlaybackVotes as SharedCounter;
		flVotes.increment(-1);
	}, [fluidInitialObjects]);

	const addNote = useCallback(
		(note: Note) => {
			const flNotes = fluidInitialObjects?.sequence as SharedMap;
			const key = note.getNoteKey().serialize();
			const prevValue = flNotes.get(key);
			flNotes.set(key, note);
			undoRedoHandler.push({
				key: key,
				currentValue: note,
				previousValue: prevValue,
			});
			undoRedoHandler.finish();
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const removeNote = useCallback(
		(note: Note) => {
			const flNotes = fluidInitialObjects?.sequence as SharedMap;
			const key = note.getNoteKey().serialize();
			const prevValue = flNotes.get(key);
			if (flNotes.delete(key)) {
				undoRedoHandler.push({
					key: key,
					currentValue: undefined,
					previousValue: prevValue,
				});
			}
			undoRedoHandler.finish();
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const removeAndAddNote = useCallback(
		(rmNote: Note, addNote: Note) => {
			const flNotes = fluidInitialObjects?.sequence as SharedMap;
			const rmKey = rmNote.getNoteKey().serialize();
			const addKey = addNote.getNoteKey().serialize();
			const rmPrevValue = flNotes.get(rmKey);
			if (flNotes.delete(rmKey)) {
				undoRedoHandler.push({
					key: rmKey,
					currentValue: undefined,
					previousValue: rmPrevValue,
				});
			}
			const addPrevValue = flNotes.get(addKey);
			flNotes.set(addKey, addNote);
			undoRedoHandler.push({
				key: addKey,
				currentValue: addNote,
				previousValue: addPrevValue,
			});
			undoRedoHandler.finish();
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const removeAddMultiple = useCallback(
		(rmNotes: Note[], addNotes: Note[]) => {
			const flNotes = fluidInitialObjects?.sequence as SharedMap;
			for (const rmNote of rmNotes) {
				const rmKey = rmNote.getNoteKey().serialize();
				const rmPrevValue = flNotes.get(rmKey);
				if (flNotes.delete(rmKey)) {
					undoRedoHandler.push({
						key: rmKey,
						currentValue: undefined,
						previousValue: rmPrevValue,
					});
				}
			}

			for (const addNote of addNotes) {
				const addKey = addNote.getNoteKey().serialize();

				const addPrevValue = flNotes.get(addKey);
				flNotes.set(addKey, addNote);
				undoRedoHandler.push({
					key: addKey,
					currentValue: addNote,
					previousValue: addPrevValue,
				});
			}
			undoRedoHandler.finish();
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const undo = useCallback(() => {
		return undoRedoHandler.undo();
	}, [undoRedoHandler]);

	const redo = useCallback(() => {
		return undoRedoHandler.redo();
	}, [undoRedoHandler]);

	if (renderState === RenderState.wait) {
		return (
			<>
				<Head>
					<title>Sequencer</title>
					<meta
						name="description"
						content="Generated by create next app"
					/>
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1"
					/>
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<div>Loading...</div>
			</>
		);
	}

	if (renderState === RenderState.fail) {
		return (
			<>
				<Head>
					<title>Sequencer</title>
					<meta
						name="description"
						content="Generated by create next app"
					/>
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1"
					/>
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<div>Failed To Load</div>
			</>
		);
	}

	return (
		<>
			<Head>
				<title>Sequencer</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<TopBar
				currentInstrument={currentInstrument}
				sequence={seqData}
				setStepLength={(newStepLength) => {
					setStepLength(newStepLength);
				}}
				setBPM={(newBPM) => {
					let newSeqData = new SequenceMetadata(seqData);
					newSeqData.bpm = newBPM;
					setSeq(newSeqData);
				}}
				goHome={() => {
					fluidContainer?.dispose();
					setRenderState(RenderState.wait);
				}}
				downloadSequence={() => {
					const noteArr = getArray();
					WriteMidi(seqData, noteArr);
				}}
				playSequence={() => {
					PlaySequence(seqData, notes);
					setTickFunction(() => {
						setTick(getTick());
					});
				}}
				stopSequence={() => {
					StopSequence();
				}}
				setInstrument={(instrument) => {
					switch (instrument) {
						case "Piano":
							setCurrentInstrument({
								instrument: instrumentList.Piano,
								primary: "--yellow",
								accent: "--yellow-accent",
							});
							break;
						case "Guitar":
							setCurrentInstrument({
								instrument: instrumentList.Guitar,
								primary: "--green",
								accent: "--green-accent",
							});
							break;
						case "Bass":
							setCurrentInstrument({
								instrument: instrumentList.Bass,
								primary: "--blue",
								accent: "--blue-accent",
							});
							break;
						case "Trumpet":
							setCurrentInstrument({
								instrument: instrumentList.Trumpet,
								primary: "--red",
								accent: "--red-accent",
							});
							break;
						case "Synth Drum":
							setCurrentInstrument({
								instrument: instrumentList.Synth_Drum,
								primary: "--purple",
								accent: "--purple-accent",
							});
							break;
					}
				}}
				setTimeSig={(timeSig) => {
					let [num, den] = timeSig.split("/");
					parseInt(num);
					parseInt(den);
					let newSeqData = new SequenceMetadata(seqData);
					newSeqData.numerator = parseInt(num);
					newSeqData.denominator = parseInt(den);
					changeSeq(newSeqData);
				}}
				setLength={(length) => {
					let newSeqData = new SequenceMetadata(seqData);
					newSeqData.length = parseInt(length);
					changeSeq(newSeqData);
				}}
			/>
			<PianoRoll
				sequence={seqData}
				stepLength={stepLength}
				sequenceMap={notes}
				currentInstrument={currentInstrument}
				addNote={addNote}
				removeNote={removeNote}
				removeAndAddNote={removeAndAddNote}
				tick={tick}
			/>
			<Cursor
				PlayNote={playNoteDefault}
				addNote={addNote}
				removeNote={removeNote}
				removeAndAddNote={removeAndAddNote}
				noteMap={notes}
				sequence={seqData}
				undo={undo}
				redo={redo}
			/>
		</>
	);
}

export async function getServerSideProps({
	params,
}: GetServerSidePropsContext<PageParams>): Promise<
	GetServerSidePropsResult<PageParams>
> {
	return {
		// Passed to the page component as props
		props: {
			id: (params as PageParams).id,
		},
	};
}

function getOctave(note: Note) {
	const pitchNumber: number = note.pitch % 12;
	const octaveNumber: number = (note.pitch - pitchNumber) / 12;
	return octaveNumber;
}

function getMetadata(flSeq: SharedMap) {
	if (flSeq != null) {
		return new SequenceMetadata({
			id: flSeq.get("id") as string,
			length: flSeq.get("length") as number,
			bpm: flSeq.get("bpm") as number,
			numerator: flSeq.get("numerator") as number,
			denominator: flSeq.get("denominator") as number,
		});
	} else {
		return new SequenceMetadata();
	}
}

function getNoteMap(flNotes: SharedMap) {
	if (flNotes != null) {
		const newMap = new Map<string, Note>();
		flNotes.forEach((note, pitchLoc) => {
			if (note != null) {
				newMap.set(pitchLoc, new Note(note));
			}
		});
		return newMap;
	} else {
		return new Map<string, Note>();
	}
}
