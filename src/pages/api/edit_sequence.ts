import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Sequence } from "@/server/types";

const edit_sequence = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const editID = req.query;
		const updateSequence = req.body as Sequence;

		const post = await db
			.collection("sequences")
			.updateOne(editID, { $set: updateSequence });

		if (post.matchedCount === 0) {
			res.status(500).json({
				error: "Failed to edit: Sequence not found",
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

export default edit_sequence;
