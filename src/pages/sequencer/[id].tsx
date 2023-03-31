import Head from "next/head";
import {
	Instrument,
	Note,
	PitchLocation,
	SequenceMetadata,
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
import { loadSequence } from "../_app";

type PageParams = {
	id: string;
};
type ContentPageProps = {
	sequence: SequenceMetadata;
	notes: Array<Note>;
};

export default function Home({ sequence, notes }: ContentPageProps) {
	sequence = new SequenceMetadata(sequence);
	notes = notes.map((note) => {
		return new Note(note);
	});

	const [sequenceMap, setNotes] = useState<Map<string, Note>>(
		new Map<string, Note>(
			notes.map((note) => {
				return [note.getPitchLocation().serialize(), note];
			})
		)
	);
	const [seqData, setSeq] = useState(sequence);

	function getArray() {
		const noteArr = new Array<Note>();
		sequenceMap.forEach((value) => {
			noteArr.push(value);
		});
		return noteArr;
	}

	const [stepLength, setStepLength] = useState(1);

	useEffect(() => {
		notes.forEach((note) => {
			sequenceMap.set(note.getPitchLocation().serialize(), note);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [notes]);

	useEffect(() => {
		// Render Instruments
		getInstruments();
	}, []);

	function addNote(note: Note) {
		sequenceMap.set(note.getPitchLocation().serialize(), note);
	}

	function removeNote(note: Note) {
		sequenceMap.delete(note.getPitchLocation().serialize());
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
			/>
			<PianoRoll
				sequence={seqData}
				stepLength={stepLength}
				sequenceMap={sequenceMap}
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
		const loadedData = await loadSequence((params as PageParams).id);
		const databaseSequence = loadedData.promisedSequence;
		const databaseNotes = loadedData.promisedNotes;
		if (
			!(
				databaseNotes instanceof Array<Note> &&
				databaseSequence instanceof SequenceMetadata
			)
		) {
			throw new Error("Notes or Sequence not found");
		}

		return {
			// Passed to the page component as props
			props: {
				sequence: JSON.parse(JSON.stringify(databaseSequence)),
				notes: JSON.parse(JSON.stringify(databaseNotes)),
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
