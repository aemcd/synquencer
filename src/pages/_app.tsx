//Code referenced:
//https://fluidframework.com/docs/recipes/react/

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import {
	SequenceMetadata,
	Note,
	Instrument,
} from "@/server/types";
import { IFluidContainer, SharedMap } from "fluid-framework";
import { SharedCounter } from "@fluidframework/counter";
import { TinyliciousClient, TinyliciousContainerServices } from "@fluidframework/tinylicious-client";
import {
	AddNotes,
	AddSequence,
	GetNotes,
	GetSequence,
} from "../database/calls";
import * as React from "react";
import { type } from "os";
import randomstring from "randomstring";
import { ThemeProvider } from "next-themes";

export const getFluidData = async () => {
	const client: TinyliciousClient = new TinyliciousClient();

	const schema = {
		initialObjects: {
			metadata: SharedMap,
			sequence: SharedMap,
			syncPlaybackVotes: SharedCounter,
		},
		dynamicObjectTypes: [],
	};
	let container: IFluidContainer;
	let services: TinyliciousContainerServices;
	const containerId = location.hash.substring(1);
	if (!containerId) {
		({ container, services } = await client.createContainer(schema));
		const id = await container.attach();
		location.hash = id;
		if (!(container != null)) {
			console.log("null container");
		}
	} else {
		({ container, services } = await client.getContainer(containerId, schema));
	}

	return {container, services};
};

//METADATA CODE HERE ----------------------------------

let localMetadata: SequenceMetadata; //local copy of properties for clients
let localSequence: SharedMap;

export const loadSequence = async (id: string) => {
	//loads existing sequences and also initializes new ones
	const databaseSequence = await GetSequence(id);
	const databaseNotes = await GetNotes(id);
	let promisedSequence: SequenceMetadata;
	let promisedNotes: Note[];
	if (
		typeof databaseSequence === "undefined" ||
		typeof databaseNotes === "undefined"
	) {
		//case where we are creating new sequence
		promisedSequence = new SequenceMetadata({
			id: id,
			length: 32,
			bpm: 120,
			numerator: 4,
			denominator: 4,
		});
		promisedNotes = [];
		AddSequence(promisedSequence);
		AddNotes(id, promisedNotes);
	} else {
		//case where there is an existing sequence for the id
		promisedSequence = databaseSequence;
		promisedNotes = databaseNotes as Note[];
	}
	return { promisedSequence, promisedNotes };
};

const saveSequence = (arg: {
	metadata: SequenceMetadata;
	sequence: Note[];
}) => {
	//might be a more efficient way to do this
	AddSequence(arg.metadata);
	AddNotes(arg.metadata.id, arg.sequence);
};

export const sequenceSharedMapToDatabase = (sequence: SharedMap) => {
	let list: Note[] = [];
	//let sequence = container.initialObjects.sequence as SharedMap; //i think this works with passing by reference?? needs to be tested
	for (let value of Array.from(sequence.values())) {
		const submap = value as SharedMap;
		for (let note of Array.from(submap.values())) {
			list.push(note as Note);
		}
	}
	return list;
};

export default function App({ Component, pageProps }: AppProps) {
	//TODO: fully implement fluid framework structures with React

	return (
		<ThemeProvider>
			<Component {...pageProps} />
		</ThemeProvider>
	) 
}
