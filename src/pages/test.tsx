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

type ContainerServices = {container: IFluidContainer, services: TinyliciousContainerServices};



function checkContainers(allContainers: Array<ContainerServices>) {
    for (let i = 1; i < allContainers.length; i++) {
        const notes1 = allContainers[i].container.initialObjects.sequence as SharedMap;
        const notes2 = allContainers[i-1].container.initialObjects.sequence as SharedMap;
        if (notes1.entries() != notes2.entries()) {
            console.log('Containers %d and %d do not match!', i-1, i);
        }
    }
}

async function runCode() {
	const n = 10;

	let undoRedoHandler = new UndoRedoStack();
	let allContainers = new Array<ContainerServices>(n);	

	for (let i = 0; i < allContainers.length; i++) {
		allContainers[i] = await fluid.getFluidData();
	}

	console.log(allContainers);

	for (let j = 0; j < allContainers.length; j++) {
		let container = allContainers[j].container;
		let note = new Note({location: 0, velocity: 0, duration: 0, pitch: 0, instrument: instrumentList.Piano});
		fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers);
		undoRedoHandler.undo();
		checkContainers(allContainers);
		undoRedoHandler.redo();
		checkContainers(allContainers);

		fluid.removeNoteCallback(note, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers);
		undoRedoHandler.undo();
		checkContainers(allContainers);
		undoRedoHandler.redo();
		checkContainers(allContainers);

		fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
		let newNote = new Note({location: 1, velocity: 1, duration: 1, pitch: 1, instrument: instrumentList.Bass});
		fluid.removeAndAddNoteCallback(note, newNote, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers);
		undoRedoHandler.undo();
		checkContainers(allContainers);
		undoRedoHandler.redo();
		checkContainers(allContainers);

		let otherNote = new Note({location: 2, velocity: 2, duration: 2, pitch: 2, instrument: instrumentList.Guitar});
		let rmNotes = [note, newNote];
		let addNotes = [otherNote];
		fluid.removeAddMultipleCallback(rmNotes, addNotes, container.initialObjects, undoRedoHandler);
		checkContainers(allContainers);
		undoRedoHandler.undo();
		checkContainers(allContainers);
		undoRedoHandler.redo();
		checkContainers(allContainers);
}

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
