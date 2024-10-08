import Head from "next/head";
import {
	getConnectionConfig,
	instrumentList,
	Note,
	schema,
	SequenceMetadata,
	user,
} from "@/server/types";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
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
	setCurNoteMap,
	setCurSeq,
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
import {
	AzureClient,
	AzureContainerServices,
	AzureMember,
} from "@fluidframework/azure-client";
import { UndoRedoStack } from "@/client/undo_redo";
import { useRouter } from "next/router";
import {
	removeNoteCallback,
	addNoteCallback,
	removeAndAddNoteCallback,
	removeAddMultipleCallback,
} from "./fluid";

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
	const tickUpdater = useRef<(tick: number) => void>((tick: number) => {});
	const [stepLength, setStepLength] = useState(1);
	const [fluidInitialObjects, setFluidInitialObjects] =
		useState<LoadableObjectRecord>();
	const [fluidContainer, setFluidContainer] = useState<IFluidContainer>();
	const [fluidServices, setFluidServices] =
		useState<AzureContainerServices>();
	const [renderState, setRenderState] = useState<number>(RenderState.wait);
	const [voteCount, setVoteCount] = useState(0);
	const [undoRedoHandler] = useState(new UndoRedoStack());
	const alertTimeout = useRef(false);
	const [currentUsers, setCurrentUsers] = useState(0);

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

	const cursorSelectedNote = useRef<Note | null>(null);

	const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);

	useEffect(() => {
		const client: AzureClient = new AzureClient(getConnectionConfig());
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
			flVotes.on("incremented", fluidUpdateVoteCount);
			undoRedoHandler.setNoteMap(flNotes);
			setRenderState(RenderState.ready);

			return () => {
				flSeq.off("valueChanged", fluidUpdateSeq);
				flNotes.off("valueChanged", fluidUpdateNotes);
				flVotes.off("incremented", fluidUpdateVoteCount);
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fluidInitialObjects]);

	useEffect(() => {
		if (fluidServices != null) {
			const flAudience = fluidServices.audience;

			const fluidUpdateCurrentUsers = () => {
				if (flAudience.getMembers().size != undefined) {
					setCurrentUsers(flAudience.getMembers().size);
				}
			};
			const alertMemberAdded = (
				clientID: string,
				member: AzureMember<any>
			) => {
				if (
					!alertTimeout.current &&
					member.userId !== user.id &&
					member.userName != null
				) {
					alert(`${member.userName} has joined!`);
					alertTimeout.current = true;
					const wait = async () => {
						await new Promise((f) => setTimeout(f, 500));
						alertTimeout.current = false;
					};
					wait();
				}
			};
			const alertMemberRemoved = (
				clientID: string,
				member: AzureMember<any>
			) => {
				if (
					!alertTimeout.current &&
					member.userId !== user.id &&
					member.userName != null
				) {
					alert(`${member.userName} has left!`);
					alertTimeout.current = true;
					const wait = async () => {
						await new Promise((f) => setTimeout(f, 500));
						alertTimeout.current = false;
					};
					wait();
				}
			};
			fluidUpdateCurrentUsers();
			flAudience.on("membersChanged", fluidUpdateCurrentUsers);
			flAudience.on("memberAdded", alertMemberAdded);
			flAudience.on("memberRemoved", alertMemberRemoved);
			return () => {
				flAudience.off("membersChanged", fluidUpdateCurrentUsers);
				flAudience.off("memberAdded", alertMemberAdded);
				flAudience.off("memberRemoved", alertMemberRemoved);
			};
		}
	}, [fluidServices]);

	const changeSeq = useCallback(
		(newSequence: SequenceMetadata) => {
			const flSeq = fluidInitialObjects?.metadata as SharedMap;
			if (flSeq != null) {
				for (let key of Object.keys(newSequence)) {
					flSeq.set(key, newSequence[key as keyof SequenceMetadata]);
				}
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
	}, [fluidInitialObjects]);

	const unvoteForSyncPlayback = useCallback(() => {
		const flVotes = fluidInitialObjects?.syncPlaybackVotes as SharedCounter;
		flVotes.increment(-1);
	}, [fluidInitialObjects]);

	useEffect(() => {
		if (voteCount === currentUsers && currentUsers > 0) {
			PlaySequence();
			setTickFunction(() => {
				tickUpdater.current(getTick());
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [voteCount]);

	const addNote = useCallback(
		(note: Note) => {
			addNoteCallback(note, fluidInitialObjects, undoRedoHandler);
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const removeNote = useCallback(
		(note: Note) => {
			removeNoteCallback(note, fluidInitialObjects, undoRedoHandler);
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const removeAndAddNote = useCallback(
		(rmNote: Note, addNote: Note) => {
			removeAndAddNoteCallback(
				rmNote,
				addNote,
				fluidInitialObjects,
				undoRedoHandler
			);
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const removeAddMultiple = useCallback(
		(rmNotes: Note[], addNotes: Note[]) => {
			removeAddMultipleCallback(
				rmNotes,
				addNotes,
				fluidInitialObjects,
				undoRedoHandler
			);
		},
		[fluidInitialObjects, undoRedoHandler]
	);

	const undo = useCallback(() => {
		return undoRedoHandler.undo();
	}, [undoRedoHandler]);

	const redo = useCallback(() => {
		return undoRedoHandler.redo();
	}, [undoRedoHandler]);

	useEffect(() => {
		setCurNoteMap(notes);
		setCurSeq(seqData);
	}, [notes, seqData]);

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
					changeSeq(newSeqData);
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
					PlaySequence();
					setTickFunction(() => {
						tickUpdater.current(getTick());
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
				currentUsers={currentUsers}
				voteCount={voteCount}
				voteForSyncPlayback={voteForSyncPlayback}
				unvoteForSyncPlayback={unvoteForSyncPlayback}
				selectedNotes={selectedNotes}
				setSelectedNotes={setSelectedNotes}
				addNote={addNote}
			/>
			<PianoRoll
				sequence={seqData}
				stepLength={stepLength}
				sequenceMap={notes}
				currentInstrument={currentInstrument}
				addNote={addNote}
				removeNote={removeNote}
				removeAndAddNote={removeAndAddNote}
				tickUpdateCall={(newFunc: (tick: number) => void) =>
					(tickUpdater.current = newFunc)
				}
				removeAddMultiple={removeAddMultiple}
				setLoop={setLoop}
				clearLoop={clearLoop}
				selectedNotes={selectedNotes}
				setSelectedNotes={setSelectedNotes}
			/>
			<Cursor
				selectedNote={cursorSelectedNote}
				currentInstrument={currentInstrument.instrument}
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
