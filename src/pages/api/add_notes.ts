import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Sequence, Note } from "@/server/types";

const add_notes = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const addID = req.query;
		const newNotes = req.body as Array<Note>;

		const post = await db
			.collection("sequences")
			.updateOne(addID, { $push: { notes: { $each: newNotes } } });

		if (post.matchedCount === 0) {
			res.status(500).json({
				error: "Failed to add notes: Sequence not found",
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

export default add_notes;
