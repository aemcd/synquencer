//Code referenced:
//https://fluidframework.com/docs/recipes/react/

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import {
	SequenceMetadata,
	Note,
	Instrument,
	PitchLocation,
} from "@/server/types";
import { SharedString } from "@fluidframework/sequence";
import { IFluidContainer, IValueChanged, SharedMap } from "fluid-framework";
import { TinyliciousClient } from "@fluidframework/tinylicious-client";
import { AddNotes, AddSequence, GetNotes, GetSequence } from "../database/calls";
import * as React from "react";
import { type } from "os";

const getFluidData = async () => {
	const client: TinyliciousClient = new TinyliciousClient();
	const schema = {
		initialObjects: {
			metadata: SharedMap,
			sequence: SharedMap,
		},
		dynamicObjectTypes: [SharedString, SharedMap],
	};
	let container;
	const containerId = location.hash.substring(1);
	if (!containerId) {
		({ container } = await client.createContainer(schema));
		const id = await container.attach();
		location.hash = id;
	} else {
		({ container } = await client.getContainer(containerId, schema));
	}

	return container;
};

let container: IFluidContainer;

//METADATA CODE HERE ----------------------------------

let localMetadata: SequenceMetadata; //local copy of properties for clients
let localSequence: SharedMap;

const loadSequence = async (id: string) => {//loads existing sequences and also initializes new ones
	const databaseMetadata = await(GetSequence(id));
	const databaseSequence = await(GetNotes(id));
	let promisedMetadata: SequenceMetadata;
	let promisedSequence: Note[];
    if ((typeof databaseMetadata === 'undefined') || (typeof databaseMetadata === 'undefined')) {//case where we are creating new sequence
        promisedMetadata = new SequenceMetadata();
		promisedMetadata.id = id;
		promisedSequence = [];
		AddSequence(promisedMetadata);
    }
    else {//case where there is an existing sequence for the id
		promisedMetadata = databaseMetadata;
		promisedSequence = databaseSequence as Note[];
    }
	return {promisedMetadata, promisedSequence};
}

const saveSequence = (arg: {metadata: SequenceMetadata, sequence: Note[]}) => {//might be a more efficient way to do this
	AddSequence(arg.metadata);
	AddNotes(arg.metadata.id, arg.sequence);
}

const sequenceDatabaseToSharedMap = async (list: Note[]) => {
	let sequence = container.initialObjects.sequence as SharedMap; //i think this works with passing by reference?? needs to be tested
	for (let note of list) {
		const instrument = note.instrument.serialize();
		if (!(Array.from(sequence.keys()).includes(instrument))) {//add new instrument submap to sequence map
			const newNoteList = await container.create(SharedMap);
			sequence.set(instrument, newNoteList);	
		}
		(sequence.get(instrument) as SharedMap).set(note.serialize(), note);
	}
	return sequence;
}

const sequenceSharedMapToDatabase = () => {
	let list: Note[] = [];
	let sequence = container.initialObjects.sequence as SharedMap; //i think this works with passing by reference?? needs to be tested
	for (let value of Array.from(sequence.values())) {
		const submap = value as SharedMap;
		for (let note of Array.from(submap.values())) {
			list.push(note as Note);
		}
	}
	return list;
}

export default function App({ Component, pageProps }: AppProps) {
	//TODO: fully implement fluid framework structures with React
	const [fluidMetadata, setMetadata] = React.useState<any | null>(null);
	const [fluidSequence, setSequence] = React.useState<any | null>(null);

	React.useEffect(() => {
		if (fluidMetadata) {
			const { metadataContainer } = fluidMetadata;
			const updateLocalMetadata = () => {
				const args = Object.fromEntries(metadataContainer.entries());
				const clazz = SequenceMetadata as new (arg: any) => any;
				localMetadata = new clazz(args);
			};
			updateLocalMetadata();
			metadataContainer.on("valueChanged", updateLocalMetadata);
			return () => {
				metadataContainer.off("valueChanged", updateLocalMetadata);
			};
		} else {
			return;
		}
	}, [fluidMetadata]);

	React.useEffect(() => {
		if (fluidSequence) {
			const sequenceContainer = fluidSequence as SharedMap;
			const updateLocalSequence = () => {
				localSequence = sequenceContainer;
			};
			updateLocalSequence();
			sequenceContainer.on("valueChanged", updateLocalSequence);
			return () => {
				sequenceContainer.off("valueChanged", updateLocalSequence);
			};
		} else {
			return;
		}
	}, [fluidSequence]);

	React.useEffect(() => {
		getFluidData().then((data) => {
			setMetadata(data);
			setSequence(data);
		});
	}, []);

	return <Component {...pageProps} />;
}
