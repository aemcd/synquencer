import { SequenceMetadata, Note } from "@/server/types";

const catchFunction = (e: unknown) => {
	console.error(e);
	if (e instanceof Error) {
		throw new Error(e.message);
	} else {
		throw new Error(String(e));
	}
};

export const AddSequence = async (newSequence: SequenceMetadata) => {
	try {
		let resp = await (
			await fetch("/api/add_sequence", {
				method: "POST",
				body: JSON.stringify(newSequence),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

export const DeleteSequence = async (id: String) => {
	try {
		let resp = await (
			await fetch("/api/delete_sequence?id=" + id, {
				method: "DELETE",
				body: JSON.stringify(id),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 *
 * @param id ID of the sequence
 * @returns A promise for sequence from the database with the same ID. If error or no such sequence,
 * an object in the form: {error: "message"} is returned.
 */
export const GetSequence = async (
	id: String
): Promise<SequenceMetadata | undefined> => {
	try {
		let resp = await (
			await fetch("http://localhost:3000/api/get_sequence?id=" + id, {
				method: "GET",
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp.id === id ? new SequenceMetadata(resp) : resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Edits the values in a sequence (not notes)
 *
 * @param id ID of the sequence
 * @param updateSequence updated sequence
 * @returns A promise of a response message. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const EditSequence = async (
	id: String,
	updateSequence: SequenceMetadata
) => {
	try {
		let resp = await (
			await fetch("/api/edit_sequence?id=" + id, {
				method: "POST",
				body: JSON.stringify(updateSequence),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Add a single note to a sequence
 *
 * @param id ID of the sequence
 * @param newNote new note
 * @returns A promise of a response message. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const AddNote = async (id: String, newNote: Note) => {
	try {
		let resp = await (
			await fetch("/api/add_note/?id=" + id, {
				method: "POST",
				body: JSON.stringify(newNote),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Add multiple notes to a sequence
 *
 * @param id ID of the sequence
 * @param newNotes new notes
 * @returns A promise of a response message. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const AddNotes = async (id: String, newNotes: Array<Note>) => {
	try {
		let resp = await (
			await fetch("/api/add_notes/?id=" + id, {
				method: "POST",
				body: JSON.stringify(newNotes),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Deletes a note from a sequence
 *
 * @param id ID of the sequence
 * @param delNote note to delete
 * @returns A promise of a response message. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const DeleteNote = async (
	id: String,
	delNote: { location: number; pitch: number }
) => {
	try {
		let resp = await (
			await fetch("/api/delete_note/?id=" + id, {
				method: "DELETE",
				body: JSON.stringify(delNote),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Clears all notes from a sequence
 *
 * @param id ID of the sequence
 * @param delNote note to delete
 * @returns A promise of a response message. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const ClearNotes = async (id: String) => {
	try {
		let resp = await (
			await fetch("/api/clear_notes/?id=" + id, {
				method: "DELETE",
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Gets a note from a sequence
 *
 * @param id ID of the sequence
 * @param getNote location and pitch of note
 * @returns A promise for a Note. If no such sequence or note, an object in the form: {error: "message"} is returned.
 */
export const GetNote = async (
	id: String,
	getNote: { location: number; pitch: number }
) => {
	try {
		let resp = await (
			await fetch("/api/get_note?id=" + id, {
				method: "POST",
				body: JSON.stringify(getNote),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp.location !== undefined ? new Note(resp) : resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Gets all notes from a sequence
 *
 * @param id ID of the sequence
 * @returns A promise for an array of notes. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const GetNotes = async (id: String): Promise<Note[] | undefined> => {
	try {
		let resp = await (
			await fetch("http://localhost:3000/api/get_notes?id=" + id, {
				method: "GET",
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();

		if (resp.error !== undefined) {
			return resp;
		}

		const notes = (resp as Array<Note>).map((x) => new Note(x));
		return notes;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 * Edits a note from a sequence
 *
 * @param id ID of the sequence
 * @param getNote location and pitch of note
 * @param newNote new note
 * @returns A promise for a Note. If no such sequence or note, an object in the form: {error: "message"} is returned.
 */
export const EditNote = async (
	id: String,
	getNote: { location: number; pitch: number },
	newNote: Note
) => {
	try {
		let resp = await (
			await fetch("/api/edit_note?id=" + id, {
				method: "POST",
				body: JSON.stringify({ ...getNote, note: newNote }),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp;
	} catch (e) {
		catchFunction(e);
	}
};
