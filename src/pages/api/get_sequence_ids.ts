import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Sequence } from "@/server/types";

const get_sequence_ids = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const getID = req.query;

		const post = await db
			.collection("sequences")
			.find({}, { projection: { _id: 0, id: 1 } })
			.toArray();

		if (!post) {
			res.status(500).json({
				error: "Failed to get: No sequences found",
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

export default get_sequence_ids;
