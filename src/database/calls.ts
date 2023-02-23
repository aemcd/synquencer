import { Sequence, Note } from "@/server/types";
import exp from "constants";

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
		let response = await fetch("/api/add_sequence/", {
			method: "POST",
			body: JSON.stringify(newSequence),
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
			},
		});
		response = await response.json();
	} catch (e) {
		catchFunction(e);
	}
};

export const DeleteSequence = async (id: String) => {
	try {
		let response = await fetch("/api/delete_sequence?id=" + id, {
			method: "DELETE",
			body: JSON.stringify(id),
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
			},
		});
		response = await response.json();
	} catch (e) {
		catchFunction(e);
	}
};

/**
 *
 * @param id ID of the sequence
 * @returns A sequence from the database with the same ID. If no such sequence, an object in the form: {error: "message"} is returned.
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
