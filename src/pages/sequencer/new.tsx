import Head from "next/head";
import TopBar from "@/components/TopBar";
import PianoRoll from "@/components/PianoRoll";
import { AddSequence } from "@/database/calls";
import {
	Note,
	SequenceMetadata,
	connectionConfig,
	instrumentList,
	schema,
} from "@/server/types";
import * as randomstring from "randomstring";
import { useRouter } from "next/router";
import {
	GetServerSideProps,
	GetServerSidePropsContext,
	GetServerSidePropsResult,
} from "next";
import { InsertOneResult } from "mongodb";
import TinyliciousClient from "@fluidframework/tinylicious-client";
import { IFluidContainer, SharedMap } from "fluid-framework";
import { AzureClient } from "@fluidframework/azure-client";

type route = {
	route: string;
};

export default function Home() {
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
			<div>Creating Sequence...</div>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const client: AzureClient = new AzureClient(connectionConfig);
	const { container, services } = await client.createContainer(schema);
	const id = await container.attach();
	const newSeq = new SequenceMetadata({
		id: id,
		length: 32,
		bpm: 120,
		numerator: 4,
		denominator: 4,
	});
	const metadata = container.initialObjects.metadata as SharedMap;
	metadata.set("id", id);
	metadata.set("length", newSeq.length);
	metadata.set("bpm", newSeq.bpm);
	metadata.set("numerator", newSeq.numerator);
	metadata.set("denominator", newSeq.denominator);
	container.dispose();

	if (container != null) {
		return {
			redirect: {
				permanent: false,
				destination: `/sequencer/${id}`,
			},
		};
	}
	return {
		redirect: {
			permanent: false,
			destination: "..",
		},
	};
}
