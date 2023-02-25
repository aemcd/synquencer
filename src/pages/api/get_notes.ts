import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Sequence, Note } from "@/server/types";

const get_notes = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const getID = req.query;

		const post = await db.collection("sequences").findOne(getID, {
			projection: {
				_id: 0,
				notes: 1,
			},
		});

		if (!post) {
			res.status(500).json({
				error: "Failed to get: Sequence not found",
			});
			return;
		}

		res.status(200).json(post.notes as unknown as Array<Note>);
	} catch (e) {
		console.error(e);
		if (e instanceof Error) {
			res.status(500).json({ error: e.message });
		} else {
			res.status(500).json({ error: String(e) });
		}
	}
};

export default get_notes;
