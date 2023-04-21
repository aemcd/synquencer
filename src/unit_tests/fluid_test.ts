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

function checkContainers() {
    for (let i = 1; i < allContainers.length; i++) {
        const notes1 = allContainers[i].container.initialObjects.sequence as SharedMap;
        const notes2 = allContainers[i-1].container.initialObjects.sequence as SharedMap;
        if (notes1.entries() != notes2.entries()) {
            console.log('Containers %d and %d do not match!', i-1, i);
        }
    }
}

type ContainerServices = {container: IFluidContainer, services: TinyliciousContainerServices};

const n = 10;

let undoRedoHandler = new UndoRedoStack();
let allContainers = new Array<ContainerServices>(n);

for (let i = 0; i < n; i++) {
    fluid.getFluidData().then((data) => {allContainers[i] = data});
}

for (let i = 0; i < n; i++) {
    let container = allContainers[i].container;
    let note = new Note({location: 0, velocity: 0, duration: 0, pitch: 0, instrument: instrumentList.Piano});
    fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
    checkContainers();
    undoRedoHandler.undo();
    checkContainers();
    undoRedoHandler.redo();
    checkContainers();

    fluid.removeNoteCallback(note, container.initialObjects, undoRedoHandler);
    checkContainers();
    undoRedoHandler.undo();
    checkContainers();
    undoRedoHandler.redo();
    checkContainers();

    fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
    let newNote = new Note({location: 1, velocity: 1, duration: 1, pitch: 1, instrument: instrumentList.Bass});
    fluid.removeAndAddNoteCallback(note, newNote, container.initialObjects, undoRedoHandler);
    checkContainers();
    undoRedoHandler.undo();
    checkContainers();
    undoRedoHandler.redo();
    checkContainers();

    let otherNote = new Note({location: 2, velocity: 2, duration: 2, pitch: 2, instrument: instrumentList.Guitar});
    let rmNotes = [note, newNote];
    let addNotes = [otherNote];
    fluid.removeAddMultipleCallback(rmNotes, addNotes, container.initialObjects, undoRedoHandler);
    checkContainers();
    undoRedoHandler.undo();
    checkContainers();
    undoRedoHandler.redo();
    checkContainers();
}

export {};