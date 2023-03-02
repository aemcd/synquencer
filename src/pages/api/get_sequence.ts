import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { SequenceMetadata } from "@/server/types";

const get_sequence = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const getID = req.query;

		const post = await db
			.collection("sequences")
			.findOne(getID, { projection: { _id: 0, notes: 0 } });

		if (!post) {
			res.status(500).json({
				error: "Failed to get: Sequence not found",
			});
			return;
		}

		res.status(200).json(post as unknown as SequenceMetadata);
	} catch (e) {
		console.error(e);
		if (e instanceof Error) {
			res.status(500).json({ error: e.message });
		} else {
			res.status(500).json({ error: String(e) });
		}
	}
};

export default get_sequence;
