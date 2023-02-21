import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";
import { Sequence } from "@/server/types";

const catchFunction = (e: unknown) => {
	console.error(e);
	if (e instanceof Error) {
		throw new Error(e.message);
	} else {
		throw new Error(String(e));
	}
};

const add_sequence = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const newSequence = req.body as Sequence;

		const post = await db.collection("sequences").insertOne(newSequence);

		res.status(200).json(post);
	} catch (e) {
		catchFunction(e);
		res.status(500).json({ error: e });
	}
};

export default add_sequence;
