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
	console.log(newSequence);
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
		// console.log(response);
	} catch (e) {
		catchFunction(e);
	}
};
