import { Sequence, Note } from "@/server/types";

const catchFunction = (e: unknown) => {
	console.error(e);
	if (e instanceof Error) {
		throw new Error(e.message);
	} else {
		throw new Error(String(e));
	}
};

export const AddSequence = async (newSequence: Sequence) => {
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
export const GetSequence = async (id: String) => {
	try {
		let resp = await (
			await fetch("/api/get_sequence?id=" + id, {
				method: "GET",
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
		).json();
		return resp.id === id ? new Sequence(resp) : resp;
	} catch (e) {
		catchFunction(e);
	}
};

/**
 *
 * @param id ID of the sequence
 * @param updateSequence updated sequence
 * @returns A promise of a response message. If no such sequence, an object in the form: {error: "message"} is returned.
 */
export const EditSequence = async (id: String, updateSequence: Sequence) => {
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
