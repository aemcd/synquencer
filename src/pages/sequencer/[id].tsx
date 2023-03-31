import Head from "next/head";
import {
	Instrument,
	Note,
	PitchLocation,
	SequenceMetadata,
	instrumentList,
	instrumentColors
} from "@/server/types";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import {
	AddNotes,
	ClearNotes,
	EditSequence,
	GetNotes,
	GetSequence,
} from "@/database/calls";
import PianoRoll from "@/components/PianoRoll";
import TopBar from "@/components/TopBar";
import { useEffect, useMemo, useState } from "react";
import {
	getInstruments,
	PlaySequence,
	StopSequence,
	WriteMidi,
} from "@/client/write_midi";
import Cursor from "@/components/Cursor";
import {
	loadSequence,
	getFluidData,
	sequenceSharedMapToDatabase,
	sequenceDatabaseToSharedMap,
} from "../_app";
import { SharedMap, IFluidContainer } from "fluid-framework";

type PageParams = {
	id: string;
};
type ContentPageProps = {
	sequence: SharedMap;
	notes: SharedMap;
};

export default function Home({ sequence, notes }: ContentPageProps) {
	//sequence = new SequenceMetadata(sequence);
	/*notes = notes.map((note) => {
		return new Note(note);
	});
*/
	let map = new Map<string, Note>();
	let data = new SequenceMetadata();

	const [sequenceMap, setNotes] = useState(map);
	const [seqData, setSeq] = useState(data);
	const [sequenceSharedMap, setSharedNotes] = useState(notes);
	const [seqSharedData, setSharedSeq] = useState(sequence);

	const [currentInstrument, setCurrentInstrument] = useState({
		instrument: instrumentList.Piano,
		primary: "--yellow",
		accent: "--yellow-accent"
	});

	// const sequenceMap = useMemo(() => {
	// 	return getContainer().initialObjects.sequence as SharedMap;
	// }, []);

	function getArray() {
		//return Array.from(sequenceMap.values());
		return sequenceSharedMapToDatabase(sequenceSharedMap);
	}

	const [stepLength, setStepLength] = useState(1);

	/*
	useEffect(() => {
		/*notes.forEach((note) => {
			sequenceMap.set(note.getPitchLocation().serialize(), note);
		});
		sequenceDatabaseToSharedMap(Array.from(sequenceMap.values()));
	}, [sequenceMap]);
	*/

	useEffect(() => {
		// Render Instruments
		getInstruments();
		//(getFluidData().then((v) => {setNotes(v.initialObjects.sequence as SharedMap)}));

	}, []);

	function addNote(note: Note) {
		const submap: SharedMap = sequenceSharedMap.get(note.instrument.serialize()) as SharedMap;
		submap.set(note.getPitchLocation().serialize(), note);
	}

	function removeNote(note: Note) {
		const submap: SharedMap = sequenceSharedMap.get(note.instrument.serialize()) as SharedMap;
		submap.delete(note.getPitchLocation().serialize());
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
					PlaySequence(seqData, sequenceMap);
				}}
				stopSequence={() => {
					StopSequence();
				}}
				setInstrument={(instrument) => {
					switch(instrument) {
						case "Piano":
							setCurrentInstrument({
								instrument: instrumentList.Piano,
								primary: "--yellow",
								accent: "--yellow-accent"
							});
							break;
						case "Guitar":
							setCurrentInstrument({
								instrument: instrumentList.Guitar,
								primary: "--green",
								accent: "--green-accent"
							});
							break;
						case "Bass":
							setCurrentInstrument({
								instrument: instrumentList.Bass,
								primary: "--blue",
								accent: "--blue-accent"
							});
							break;
						case "Trumpet":
							setCurrentInstrument({
								instrument: instrumentList.Trumpet,
								primary: "--red",
								accent: "--red-accent"
							});
							break;
						case "Synth Drum":
							setCurrentInstrument({
								instrument: instrumentList.Synth_Drum,
								primary: "--purple",
								accent: "--purple-accent"
							});
							break;
					}
				}}
			/>
			<PianoRoll
				sequence={seqData}
				stepLength={stepLength}
				sequenceMap={sequenceMap}
				currentInstrument={currentInstrument}
			/>
			<Cursor
				addNote={addNote}
				removeNote={removeNote}
				noteMap={sequenceMap}
				sequence={seqData}
			/>
		</>
	);
}

export async function getServerSideProps({
	params,
}: GetServerSidePropsContext<PageParams>): Promise<
	GetServerSidePropsResult<ContentPageProps>
> {
	try {
		//const databaseSequence = await GetSequence((params as PageParams).id);
		//const databaseNotes = await GetNotes((params as PageParams).id);
		const container = await getFluidData();
		const fluidSequence: SharedMap = container.initialObjects.sequence as SharedMap;
		const fluidNotes: SharedMap = container.initialObjects.metadata as SharedMap;
		if (
			!(
				fluidNotes instanceof SharedMap &&
				fluidSequence instanceof SharedMap
			)
		) {
			throw new Error("Notes or Sequence not found");
		}

		return {
			// Passed to the page component as props
			props: {
				sequence: fluidSequence,
				notes: fluidNotes,
			},
		};
	} catch (e) {
		return {
			notFound: true,
		};
	}
}

function getOctave(note: Note) {
	const pitchNumber: number = note.pitch % 12;
	const octaveNumber: number = (note.pitch - pitchNumber) / 12;
	return octaveNumber;
}

const mapToSeqData = (map: SharedMap) => {
	const seqData = new SequenceMetadata();
	/*seqData.id = map.get("id");
	seqData.bpm = map.get("bpm");*/

}