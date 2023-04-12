import Head from "next/head";
import {
	Instrument,
	instrumentList,
	Note,
	PitchLocation,
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
	//getContainer,
	sequenceSharedMapToDatabase,
	//sequenceDatabaseToSharedMap,
	getFluidData,
} from "../_app";
import { SharedMap, IFluidContainer, SharedString } from "fluid-framework";
import TinyliciousClient, {
	TinyliciousContainerServices,
} from "@fluidframework/tinylicious-client";

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
	const [fluidSequence, setFluidSequence] = useState<SharedMap>();
	const [fluidNotes, setFluidNotes] = useState<SharedMap>();
	const [container, setContainer] = useState<IFluidContainer>();
	const [renderSate, setRenderState] = useState<number>(RenderState.wait);

	const getMetadata = useCallback((flSeq?: SharedMap) => {
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
	}, []);

	const getNoteMap = useCallback((flNotes?: SharedMap) => {
		if (flNotes != null) {
			return new Map<string, Note>(flNotes as Map<string, Note>);
		} else {
			return new Map<string, Note>();
		}
	}, []);

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
		const client: TinyliciousClient = new TinyliciousClient();
		client
			.getContainer(id, schema)
			.then(({ container, services }) => {
				setContainer(container);
			})
			.catch((reason) => {
				setRenderState(RenderState.fail);
			});

		// Render Instruments
		getInstruments();
	}, [id]);

	/**
	 * Runs on fluid update (Do not call)
	 */
	const fluidUpdateSeq = useCallback(
		(flSeq: SharedMap) => {
			if (flSeq != null) {
				setSeq(getMetadata(flSeq));
			}
		},
		[getMetadata]
	);

	/**
	 * Runs on fluid update (Do not call)
	 */
	const fluidUpdateNotes = useCallback(
		(flNotes: SharedMap) => {
			if (flNotes != null) {
				setNotes(getNoteMap(flNotes));
			}
		},
		[getNoteMap]
	);

	// Run when container updates
	useEffect(() => {
		if (container != null) {
			container.once("connected", () => {
				const newMap = container.initialObjects.metadata as SharedMap;
				const newNotes = container.initialObjects.sequence as SharedMap;
				setFluidSequence(newMap);
				setFluidNotes(newNotes);
				newMap.on("valueChanged", fluidUpdateSeq);
				newNotes.on("valueChanged", fluidUpdateNotes);
				setSeq(getMetadata(newMap));
				setNotes(getNoteMap(newNotes));
				setRenderState(RenderState.ready);
			});
			return () => {
				fluidSequence?.off("valueChanged", fluidUpdateSeq);
				fluidNotes?.off("valueChanged", fluidUpdateNotes);
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [container]);

	const changeSeq = useCallback(
		(newSequence: SequenceMetadata) => {
			if (fluidSequence != null) {
				Object.keys(newSequence).forEach((key) => {
					fluidSequence.set(
						key,
						newSequence[key as keyof SequenceMetadata]
					);
				});
				setSeq(new SequenceMetadata(newSequence));
			}
		},
		[fluidSequence]
	);

	const changeNotes = useCallback(
		(newSequence: SequenceMetadata) => {
			if (fluidSequence != null) {
				Object.keys(newSequence).forEach((key) => {
					fluidSequence.set(
						key,
						newSequence[key as keyof SequenceMetadata]
					);
				});
				setSeq(new SequenceMetadata(newSequence));
			}
		},
		[fluidSequence]
	);

	const getArray = useCallback(() => {
		return Array.from(notes.values());
	}, [notes]);

	function addNote(note: Note) {
		// let submap: SharedMap = (fluidSequence as SharedMap).get(
		// 	note.instrument.serialize()
		// ) as SharedMap;
		// while (fluidSequence == undefined) {}
		// if (submap == undefined) {
		// 	(container as IFluidContainer).create(SharedMap).then((data) => {
		// 		while (data == undefined) {}
		// 		submap = data;
		// 	});
		// }
		// submap.set(note.getPitchLocation().serialize(), note);
	}

	function removeNote(note: Note) {
		// const submap: SharedMap = (fluidSequence as SharedMap).get(
		// 	note.instrument.serialize()
		// ) as SharedMap;
		// submap.delete(note.getPitchLocation().serialize());
	}

	useEffect(() => {
		console.log(fluidSequence);
		console.log(fluidNotes);
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
