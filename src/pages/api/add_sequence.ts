import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { SequenceMetadata, Note } from "@/server/types";

const add_sequence = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const newSequence = req.body as SequenceMetadata;

		const post = await db
			.collection("sequences")
			.insertOne({ ...newSequence, notes: new Array<Note>() });

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

export default add_sequence;
