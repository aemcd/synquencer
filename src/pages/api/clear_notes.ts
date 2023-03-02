import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Note } from "@/server/types";

const clear_notes = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const clearID = req.query;

		const post = await db.collection("sequences").updateOne(clearID, {
			$set: {
				notes: new Array<Note>(),
			},
		});

		if (post.matchedCount === 0) {
			res.status(500).json({
				error: "Failed to clear notes: Sequence not found",
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

export default clear_notes;
