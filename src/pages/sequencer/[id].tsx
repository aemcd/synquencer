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
import {
	AddNote,
	AddNotes,
	ClearNotes,
	DeleteNote,
	EditNote,
	EditSequence,
	GetNotes,
	GetSequence,
} from "@/database/calls";
import PianoRoll from "@/components/PianoRoll";
import TopBar from "@/components/TopBar";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	getInstruments,
	getTick,
	PlaySequence,
	setTickFunction,
	StopSequence,
	WriteMidi,
	setLoop,
	clearLoop,
} from "@/client/write_midi";
import Cursor from "@/components/Cursor";
import {
	loadSequence,
	sequenceSharedMapToDatabase,
	getFluidData,
} from "../_app";
import {
	SharedMap,
	IFluidContainer,
	SharedString,
	LoadableObjectRecord,
	AttachState,
	ConnectionState,
} from "fluid-framework";
import TinyliciousClient, {
	TinyliciousContainerServices,
} from "@fluidframework/tinylicious-client";
import { AzureClient } from "@fluidframework/azure-client";

type PageParams = {
	id: string;
};

const RenderState = {
	wait: 0,
	ready: 1,
	fail: -1,
} as const;

export default function Home({ id }: PageParams) {
	const [tick, setTick] = useState(-1);
	const [stepLength, setStepLength] = useState(1);
	const [fluidInitialObjects, setFluidInitialObjects] =
		useState<LoadableObjectRecord>();
	const [renderSate, setRenderState] = useState<number>(RenderState.wait);

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
				console.log(container.connectionState);
				console.log(services);

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
						setFluidInitialObjects(container.initialObjects);
					} else {
						container.connect();
						setFluidInitialObjects(container.initialObjects);
					}
				} else {
					setRenderState(RenderState.fail);
					throw Error("Not attached to service");
				}
			})
			.catch((reason) => {
				setRenderState(RenderState.fail);
			});

		// Render Instruments
		getInstruments();
	}, [id]);

	// Run when container updates
	useEffect(() => {
		if (fluidInitialObjects != null) {
			const flSeq = fluidInitialObjects.metadata as SharedMap;
			const flNotes = fluidInitialObjects.sequence as SharedMap;
			const fluidUpdateSeq = () => {
				setSeq(getMetadata(flSeq));
			};
			const fluidUpdateNotes = () => {
				console.log(`flun: ${flNotes}`);
				setNotes(getNoteMap(flNotes));
				console.log("Update Notes");
			};
			fluidUpdateSeq();
			fluidUpdateNotes();
			flSeq.on("valueChanged", fluidUpdateSeq);
			flNotes.on("valueChanged", fluidUpdateNotes);
			setSeq(getMetadata(flSeq));
			setNotes(getNoteMap(flNotes));
			setRenderState(RenderState.ready);

			return () => {
				flSeq.off("valueChanged", fluidUpdateSeq);
				flNotes.off("valueChanged", fluidUpdateNotes);
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

	const addNote = useCallback(
		(note: Note) => {
			const flNotes = fluidInitialObjects?.sequence as SharedMap;

			flNotes?.set(note.getNoteKey().serialize(), note);
		},
		[fluidInitialObjects]
	);

	const removeNote = useCallback(
		(note: Note) => {
			const flNotes = fluidInitialObjects?.sequence as SharedMap;

			flNotes?.delete(note.getNoteKey().serialize());
		},
		[fluidInitialObjects]
	);

	useEffect(() => {
		console.log(fluidInitialObjects?.metadata as SharedMap);
		console.log(fluidInitialObjects?.sequence as SharedMap);
		console.log(seqData);
		console.log(notes);
	});

	if (renderSate === RenderState.wait) {
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

	if (renderSate === RenderState.fail) {
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
				saveSequence={() => {
					const noteArr = getArray();
					Promise.all([
						EditSequence(seqData.id, seqData),
						ClearNotes(seqData.id),
					]).then((value) => {
						AddNotes(seqData.id, noteArr).then((value) =>
							alert("Saved Successfully")
						);
					});
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
				tick={tick}
			/>
			<Cursor
				addNote={addNote}
				removeNote={removeNote}
				noteMap={notes}
				sequence={seqData}
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
			newMap.set(pitchLoc, new Note(note));
		});
		return newMap;
	} else {
		return new Map<string, Note>();
	}
}
