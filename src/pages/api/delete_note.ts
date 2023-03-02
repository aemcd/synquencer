import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";

const delete_note = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const delID = req.query;
		const { location, pitch } = req.body;

		const post = await db.collection("sequences").updateOne(delID, {
			$pull: {
				notes: { location, pitch },
			},
		});

		if (post.matchedCount === 0) {
			res.status(500).json({
				error: "Failed to delete note: Sequence not found",
			});
			return;
		}

		if (post.modifiedCount === 0) {
			res.status(500).json({
				error: "Failed to delete note: Note not found",
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

export default delete_note;
