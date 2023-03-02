import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Note } from "@/server/types";

const add_note = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const addID = req.query;
		const newNote = req.body as Note;

		const post = await db
			.collection("sequences")
			.updateOne(addID, { $push: { notes: newNote } });

		if (post.matchedCount === 0) {
			res.status(500).json({
				error: "Failed to add note: Sequence not found",
			});
			return;
		}

		res.status(200).json(post);
	} catch (e) {
		console.error(e);
		if (e instanceof Error) {
			res.status(500).json({ error: e.message });
		} else {
			res.status(500).json({ error: String(e) });
		}
	}
};

export default add_note;
