import Head from "next/head";
//import Link from "next/link";

import * as fluid from "@/pages/sequencer/fluid";
import {
	SequenceMetadata,
	Note,
	Instrument,
    instrumentList
} from "@/server/types";
import { IFluidContainer, LoadableObjectRecord, SharedMap } from "fluid-framework";
import { TinyliciousClient, TinyliciousContainerServices } from "@fluidframework/tinylicious-client";
import { UndoRedoStack } from "@/client/undo_redo";
import { Console } from "console";

type ContainerServices = {container: IFluidContainer, services: TinyliciousContainerServices};

function checkContainers(allContainers: Array<ContainerServices>, message: string) {
    for (let i = 1; i < allContainers.length; i++) {
        const notes1 = Array.from((allContainers[i].container.initialObjects.sequence as SharedMap).values());
        const notes2 = Array.from((allContainers[i-1].container.initialObjects.sequence as SharedMap).values());
		//console.log(notes1);
		//console.log(notes2);
        if (notes1.toString() != notes2.toString()) {
            console.log('Containers %d and %d do not match! Failed test: %s', i-1, i, message);
        }
    }
}

async function runCode() {
	const n = 10;

	let undoRedoHandler = new UndoRedoStack();
	let allContainers = new Array<ContainerServices>(n);	

	let initialContainer = await fluid.getFluidData();
	const id = initialContainer.id;
	allContainers[0] = {container: initialContainer.container, services: initialContainer.services};
	for (let i = 1; i < allContainers.length; i++) {
		allContainers[i] = await fluid.getAttachedContainer(id);
	}

	//console.log(allContainers);

	for (let j = 0; j < allContainers.length; j++) {
		console.log('Now testing iteration %d', j);
		let container = allContainers[j].container;
		let note = new Note({location: 0, velocity: 0, duration: 0, pitch: 0, instrument: instrumentList.Piano});
		fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers, "add");
		undoRedoHandler.undo();
		checkContainers(allContainers, "add undo");
		undoRedoHandler.redo();
		checkContainers(allContainers, "add redo");

		fluid.removeNoteCallback(note, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers, "remove");
		undoRedoHandler.undo();
		checkContainers(allContainers, "remove undo");
		undoRedoHandler.redo();
		checkContainers(allContainers, "remove redo");

		fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
		let newNote = new Note({location: 1, velocity: 1, duration: 1, pitch: 1, instrument: instrumentList.Bass});
		fluid.removeAndAddNoteCallback(note, newNote, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers, "removeandadd");
		undoRedoHandler.undo();
		checkContainers(allContainers, "removeandadd undo");
		undoRedoHandler.redo();
		checkContainers(allContainers, "removeandadd redo");

		let otherNote = new Note({location: 2, velocity: 2, duration: 2, pitch: 2, instrument: instrumentList.Guitar});
		let rmNotes = [note, newNote];
		let addNotes = [otherNote];
		fluid.removeAddMultipleCallback(rmNotes, addNotes, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers, "removeaddmultiple");
		undoRedoHandler.undo();
		checkContainers(allContainers, "removeaddmultiple undo");
		undoRedoHandler.redo();
		checkContainers(allContainers, "removeaddmultiple redo");
	}
	console.log('Done with testing');
}

export default function Home() {
	return (
		<>
			<Head>
				<title>Synquencer</title>
				<meta name="description" content="Synquencer" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div
				style={{
					display: "flex",
					flexFlow: "row nowrap",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
				}}
			>
				<div
					style={{
						textAlign: "center",
					}}
				>
					<h1 style={{ margin: "0 0 24px 0" }}>Testing</h1>
					<button onClick={runCode}></button>
				</div>
			</div>
		</>
	);
}
