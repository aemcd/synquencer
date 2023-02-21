import { Sequence, Note } from "@/server/types";

const handleAddSequence = async (newSequence: Sequence) => {
	try {
		let response = await fetch("/api/addSequence/", {
			method: "POST",
			body: JSON.stringify(newSequence),
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
			},
		});
		response = await response.json();
		console.log(response);
	} catch (e) {
		throw new Error(String(e));
	}
};
