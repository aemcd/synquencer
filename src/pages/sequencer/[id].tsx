import Head from "next/head";
import { Note, SequenceMetadata } from "@/server/types";
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
	useHotkeys("a, b, c, d, e, f, g", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert(event.key + " created");
	});
	useHotkeys("up, down", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("Move note" + event.key + "a semitone");
	});
	useHotkeys("ctrl + up, ctrl + down", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("Move note" + event.key + "an octave");
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
	useHotkeys("left, right, ctrl+left, ctrl+right", function (event, handler) {
		switch (event.key) {
			case "left":
				alert("Moved cursor left.");
				break;
			case "right":
				alert("moved right.");
				break;
			case "ctrl+left":
				alert("Moved note left.");
				break;
			case "ctrl+right":
				alert("moved note right.");
				break;
			default:
				alert(event);
		}
	});
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

	sequence = new SequenceMetadata(sequence);
	notes = notes.map((note) => {
		return new Note(note);
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
