import { SequenceMetadata, Note, Instrument } from "@/server/types";
import {
	IFluidContainer,
	LoadableObjectRecord,
	SharedMap,
} from "fluid-framework";
import { SharedCounter } from "@fluidframework/counter";
import {
	TinyliciousClient,
	TinyliciousContainerServices,
} from "@fluidframework/tinylicious-client";
import { UndoRedoStack } from "@/client/undo_redo";

type InitialObjects = LoadableObjectRecord | undefined;

export default function Home() {
	return null;
}

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
		({ container, services } = await client.getContainer(
			containerId,
			schema
		));
	}

	return { container, services };
};

export function addNoteCallback(
	note: Note,
	fluidInitialObjects: InitialObjects,
	undoRedoHandler: UndoRedoStack
) {
	const flNotes = fluidInitialObjects?.sequence as SharedMap;
	const key = note.getNoteKey().serialize();
	const prevValue = flNotes.get(key);
	flNotes.set(key, note);
	undoRedoHandler.push({
		key: key,
		currentValue: note,
		previousValue: prevValue,
	});
	undoRedoHandler.finish();
}

export function removeNoteCallback(
	note: Note,
	fluidInitialObjects: InitialObjects,
	undoRedoHandler: UndoRedoStack
) {
	const flNotes = fluidInitialObjects?.sequence as SharedMap;
	const key = note.getNoteKey().serialize();
	const prevValue = flNotes.get(key);
	if (flNotes.delete(key)) {
		undoRedoHandler.push({
			key: key,
			currentValue: undefined,
			previousValue: prevValue,
		});
	}
	undoRedoHandler.finish();
}

export function removeAndAddNoteCallback(
	rmNote: Note,
	addNote: Note,
	fluidInitialObjects: InitialObjects,
	undoRedoHandler: UndoRedoStack
) {
	const flNotes = fluidInitialObjects?.sequence as SharedMap;
	const rmKey = rmNote.getNoteKey().serialize();
	const addKey = addNote.getNoteKey().serialize();
	const rmPrevValue = flNotes.get(rmKey);
	if (flNotes.delete(rmKey)) {
		undoRedoHandler.push({
			key: rmKey,
			currentValue: undefined,
			previousValue: rmPrevValue,
		});
	}
	const addPrevValue = flNotes.get(addKey);
	flNotes.set(addKey, addNote);
	undoRedoHandler.push({
		key: addKey,
		currentValue: addNote,
		previousValue: addPrevValue,
	});
	undoRedoHandler.finish();
}

export function removeAddMultipleCallback(
	rmNotes: Note[],
	addNotes: Note[],
	fluidInitialObjects: InitialObjects,
	undoRedoHandler: UndoRedoStack
) {
	const flNotes = fluidInitialObjects?.sequence as SharedMap;
	for (const rmNote of rmNotes) {
		const rmKey = rmNote.getNoteKey().serialize();
		const rmPrevValue = flNotes.get(rmKey);
		if (flNotes.delete(rmKey)) {
			undoRedoHandler.push({
				key: rmKey,
				currentValue: undefined,
				previousValue: rmPrevValue,
			});
		}
	}

	for (const addNote of addNotes) {
		const addKey = addNote.getNoteKey().serialize();

		const addPrevValue = flNotes.get(addKey);
		flNotes.set(addKey, addNote);
		undoRedoHandler.push({
			key: addKey,
			currentValue: addNote,
			previousValue: addPrevValue,
		});
	}
	undoRedoHandler.finish();
}
