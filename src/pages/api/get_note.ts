import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Note } from "@/server/types";

const get_note = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const getID = req.query;
		const { location, pitch } = req.body;

		const post = await db.collection("sequences").findOne(
			{ ...getID, notes: { $elemMatch: { location, pitch } } },
			{
				projection: {
					_id: 0,
					notes: { $elemMatch: { location, pitch } },
				},
			}
		);

		if (!post) {
			res.status(500).json({
				error: "Failed to get: Sequence or note not found",
			});
			return;
		}

		res.status(200).json(post.notes[0] as unknown as Note);
	} catch (e) {
		console.error(e);
		if (e instanceof Error) {
			res.status(500).json({ error: e.message });
		} else {
			res.status(500).json({ error: String(e) });
		}
	}
};

export default get_note;
