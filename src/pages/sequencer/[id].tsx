import Head from "next/head";
import {
	Instrument,
	instrumentList,
	Note,
	PitchLocation,
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
import { useEffect, useMemo, useRef, useState } from "react";
import {
	getInstruments,
	PlaySequence,
	StopSequence,
	WriteMidi,
} from "@/client/write_midi";
import Cursor from "@/components/Cursor";
import {
	loadSequence,
	getContainer,
	sequenceSharedMapToDatabase,
	sequenceDatabaseToSharedMap,
} from "../_app";
import { SharedMap } from "fluid-framework";

type PageParams = {
	id: string;
};
type ContentPageProps = {
	sequence: SequenceMetadata;
	notes: Array<Note>;
};

export default function Home({ sequence, notes }: ContentPageProps) {
	const thisInterval = useRef<NodeJS.Timer>();
	const doReload = useRef<boolean>(true);
	const [update, setUpdate] = useState<number>(0);

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
	const [currentInstrument, setCurrentInstrument] = useState({
		instrument: instrumentList.Piano,
		primary: "--yellow",
		accent: "--yellow-accent",
	});

	// const sequenceMap = useMemo(() => {
	// 	return getContainer().initialObjects.sequence as SharedMap;
	// }, []);

	function getArray() {
		return Array.from(sequenceMap.values());
		//return sequenceSharedMapToDatabase(sequenceMap);
	}

	const [stepLength, setStepLength] = useState(1);

	function clearUpdate() {
		clearInterval(thisInterval.current);
		thisInterval.current = undefined;
		new Promise((resolve) =>
			setTimeout(() => {
				if (thisInterval.current != null) {
					clearInterval(thisInterval.current);
					thisInterval.current = setInterval(reload, 5000);
				}
			}, 13000)
		);
	}

	useEffect(() => {
		doReload.current = false;
		clearUpdate();
		const noteArr = getArray();
		Promise.all([EditSequence(seqData.id, seqData)]).then((value) => {
			doReload.current = true;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [update]);

	useEffect(() => {
		// Render Instruments
		getInstruments();
		reload();
	}, []);

	function addNote(note: Note) {
		doReload.current = false;
		clearUpdate();
		setUpdate(update + 1);
		if (sequenceMap.has(note.getPitchLocation().serialize())) {
			EditNote(
				seqData.id,
				sequenceMap.get(note.getPitchLocation().serialize()) as Note,
				note
			).then((value) => {
				doReload.current = true;
			});
		} else {
			AddNote(seqData.id, note).then((value) => {
				doReload.current = true;
			});
		}
		sequenceMap.set(note.getPitchLocation().serialize(), note);
	}

	function removeNote(note: Note) {
		doReload.current = false;
		sequenceMap.delete(note.getPitchLocation().serialize());
		DeleteNote(seqData.id, note).then((value) => {
			doReload.current = true;
		});
		setUpdate(update - 1);
	}

	function reload() {
		if (doReload) {
			clearInterval(thisInterval.current);
			Promise.all([GetSequence(seqData.id), GetNotes(seqData.id)]).then(
				(value) => {
					setSeq(value[0] as SequenceMetadata);
					// (value[1] as Array<Note>).forEach((note) => {
					// 	if (
					// 		!sequenceMap.has(
					// 			note.getPitchLocation().serialize()
					// 		)
					// 	) {
					// 		sequenceMap.set(
					// 			note.getPitchLocation().serialize(),
					// 			note
					// 		);
					// 	}
					// });
					// const value2 = new Map<string, Note>(
					// 	(value[1] as Array<Note>).map((note) => {
					// 		return [note.getPitchLocation().serialize(), note];
					// 	})
					// );
					// sequenceMap.forEach((note) => {
					// 	if (!value2.has(note.getPitchLocation().serialize())) {
					// 		sequenceMap.delete(
					// 			note.getPitchLocation().serialize()
					// 		);
					// 	}
					// });
					setNotes(
						new Map<string, Note>(
							(value[1] as Array<Note>).map((note) => {
								return [
									note.getPitchLocation().serialize(),
									note,
								];
							})
						)
					);
					thisInterval.current = setInterval(reload, 5000);
				}
			);
		}
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
					setUpdate(update + 1);
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
					setSeq(newSeqData);
					setUpdate(update + 1);
				}}
				setLength={(length) => {
					let newSeqData = new SequenceMetadata(seqData);
					newSeqData.length = parseInt(length);
					setSeq(newSeqData);
					setUpdate(update + 1);
				}}
			/>
			<PianoRoll
				sequence={seqData}
				stepLength={stepLength}
				sequenceMap={sequenceMap}
				currentInstrument={currentInstrument}
				addNote={addNote}
				removeNote={removeNote}
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
		const databaseSequence = await GetSequence((params as PageParams).id);
		const databaseNotes = await GetNotes((params as PageParams).id);
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
