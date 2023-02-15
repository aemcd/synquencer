import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

const catchFunction = (e: unknown) => {
	console.error(e);
	if (e instanceof Error) {
		throw new Error(e.message);
	} else {
		throw new Error(String(e));
	}
};

const addPost = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("posts");
		const { title, content } = req.body;

		const post = await db.collection("posts").insertOne({
			title,
			content,
		});

		res.json(post);
	} catch (e) {
		catchFunction(e);
	}
};

export default addPost;
