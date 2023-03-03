import Head from "next/head";
import {
	Instrument,
	Note,
	PitchLocation,
	SequenceMetadata,
} from "@/server/types";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { GetNotes, GetSequence } from "@/database/calls";
import PianoRoll from "@/components/PianoRoll";
import TopBar from "@/components/TopBar";
import Shortcuts from "@/components/Shortcuts";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/router";

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

	notes.push(
		new Note({
			location: 0,
			pitch: 12 * 4,
			velocity: 50,
			duration: 4,
			instrument: new Instrument({
				channel: 0,
				name: "",
			}),
		})
	);

	const maxPitch = 12 * 5;
	const minPitch = 12 * 3;

	const cursorNote = new Note({
		location: 0,
		pitch: 12 * 4,
		velocity: 50,
		duration: 4,
		instrument: new Instrument({
			channel: 0,
			name: "",
		}),
	});

	let mod = 0;

	useHotkeys("a, b, c, d, e, f, g", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		const newNote = new Note(cursorNote);
		let noteChange = -3;
		switch (event.key) {
			case "a":
				break;
			case "b":
				noteChange = -1;
				break;
			case "c":
				noteChange = 0;
				break;
			case "d":
				noteChange = 2;
				break;
			case "e":
				noteChange = 4;
				break;
			case "f":
				noteChange = 5;
				break;
			case "g":
				noteChange = 7;
				break;
		}
		newNote.pitch += mod + noteChange;
		notes.push(newNote);
		console.log(notes);
		alert(newNote.pitchName() + " created");
	});
	useHotkeys("up, down", function (event, handler) {
		event.preventDefault();
		switch (event.key) {
			case "ArrowUp":
				if (mod < 1) {
					mod++;
				}
				break;
			case "ArrowDown":
				if (mod > -1) {
					mod--;
				}
				break;
		}
		// alert("Move note" + event.key + "a semitone");
	});
	useHotkeys("ctrl + ArrowUp, ctrl + ArrowDown", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		switch (event.key) {
			case "ArrowUp":
				if (cursorNote.pitch + 12 <= maxPitch) {
					cursorNote.pitch += 12;
				}
				break;
			case "ArrowDown":
				if (cursorNote.pitch - 12 >= minPitch) {
					cursorNote.pitch -= 12;
				}
				break;
		}

		//alert("Move note" + event.key + "an octave");
	});
	useHotkeys("1, 2, 3, 4, 5", function (event, handler) {
		switch (event.key) {
			case "1":
				alert("Note duration set to 1/16.");
				break;
			case "2":
				alert("Note duration set to 1/8.");
				break;
			case "3":
				alert("Note duration set to 1/4.");
				break;
			case "4":
				alert("Note duration set to 1/2.");
				break;
			case "5":
				alert("Note duration set to 1/1.");
				break;
			default:
				alert(event);
		}
	});
	useHotkeys(
		"ArrowLeft, ArrowRight, ctrl+ArrowLeft, ctrl+ArrowRight",
		function (event, handler) {
			switch (event.key) {
				case "ArrowLeft":
					if (handler.ctrl == true) {
						alert("Move note left.");
						break;
					}
					if (cursorNote.location - cursorNote.duration >= 0) {
						cursorNote.location -= cursorNote.duration;
					}
					break;
				case "ArrowRight":
					if (handler.ctrl == true) {
						alert("Moved note right.");
						break;
					}
					if (
						cursorNote.location + cursorNote.duration * 2 <=
						sequence.length
					) {
						cursorNote.location += cursorNote.duration;
					}
					break;
				default:
					alert(event);
			}
		}
	);
	useHotkeys("ctrl+n, command+n", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("Create a new sequence:");
	});
	useHotkeys("shift + up, shift + down", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("changed velocity" + event.key);
	});
	useHotkeys("del", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("Note deleted" + event.key);
	});
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
			<TopBar />
			<PianoRoll sequence={sequence} notes={notes} />
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
		console.error(e);
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
