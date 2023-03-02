import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";

const delete_sequence = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const delID = req.query;

		const post = await db.collection("sequences").deleteOne(delID);

		if (post.deletedCount == 0) {
			res.status(500).json({
				error: "Failed to delete: Sequence not found",
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

export default delete_sequence;
