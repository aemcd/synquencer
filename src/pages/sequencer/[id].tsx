import Head from "next/head";
import { Note, SequenceMetadata } from "@/server/types";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { GetNotes, GetSequence } from "@/database/calls";
import PianoRoll from "@/components/PianoRoll";
import TopBar from "@/components/TopBar";
import Shortcuts from "@/components/Shortcuts";
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
	if (typeof window !== "undefined") {
		Shortcuts();
		console.log("here");
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
			<TopBar />
			<PianoRoll />
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
