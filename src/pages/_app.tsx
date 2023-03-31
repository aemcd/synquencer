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
import {
	AddNotes,
	AddSequence,
	GetNotes,
	GetSequence,
} from "../database/calls";
import * as React from "react";
import { type } from "os";

export const getFluidData = async () => {
	const client: TinyliciousClient = new TinyliciousClient();
	const schema = {
		initialObjects: {
			metadata: SharedMap,
			sequence: SharedMap,
		},
		dynamicObjectTypes: [SharedString, SharedMap],
	};
	//let container;
	const containerId = location.hash.substring(1);
	if (!containerId) {
		({ container } = await client.createContainer(schema));
		const id = await container.attach();
		location.hash = id;
		if (!(container != null)) {
			console.log("null container");
			
		}
	} else {
		({ container } = await client.getContainer(containerId, schema));
	}

	return container;
};

let container: IFluidContainer;

export const getContainer = () => {
	return container;
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
		promisedSequence = new SequenceMetadata();
		promisedSequence.id = id;
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

export const sequenceDatabaseToSharedMap = async (list: Note[]) => {
	let sequence = container.initialObjects.sequence as SharedMap; //i think this works with passing by reference?? needs to be tested
	for (let note of list) {
		const instrument = note.instrument.serialize();
		if (!Array.from(sequence.keys()).includes(instrument)) {
			//add new instrument submap to sequence map
			const newNoteList = await container.create(SharedMap);
			sequence.set(instrument, newNoteList);
		}
		(sequence.get(instrument) as SharedMap).set(
			note.getPitchLocation().serialize(),
			note
		);
	}
	container.initialObjects.sequence = sequence;
	return sequence;
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
	const [fluidMetadata, setMetadata] = React.useState<SharedMap | null>(null);
	const [fluidSequence, setSequence] = React.useState<SharedMap | null>(null);

	React.useEffect(() => {
		getFluidData().then((data) => {
			setMetadata(data.initialObjects.metadata as SharedMap);
			setSequence(data.initialObjects.sequence as SharedMap);
		});
	}, []);

	React.useEffect(() => {
		if (fluidMetadata !== null) {
			const updateLocalMetadata = () => {
				if (fluidMetadata != null) {
					const args = Object.fromEntries(fluidMetadata.entries());
					const clazz = SequenceMetadata as new (arg: any) => any;
					localMetadata = new clazz(args);
				}
			};
			updateLocalMetadata();
			fluidMetadata.on("valueChanged", updateLocalMetadata);
			return () => {
//				metadataContainer.off("valueChanged", updateLocalMetadata);
			};
		} else {
			return;
		}
	}, [fluidMetadata]);

	React.useEffect(() => {
		if (fluidSequence !== null) {
			const updateLocalSequence = () => {
				localSequence = fluidSequence;
			};
			updateLocalSequence();
			fluidSequence.on("valueChanged", updateLocalSequence);
			return () => {
				fluidSequence.off("valueChanged", updateLocalSequence);
			};
		} else {
			return;
		}
	}, [fluidSequence]);

	

	return <Component {...pageProps} />;
}
