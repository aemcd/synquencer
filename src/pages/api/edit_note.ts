import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "lib/mongodb";

const edit_note = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const client = await clientPromise;
		const db = client.db("sequences");
		const editID = req.query;
		const { location, pitch, note } = req.body;

		const post = await db.collection("sequences").updateOne(
			{ ...editID, notes: { $elemMatch: { location, pitch } } },
			{
				$set: {
					"notes.$": note,
				},
			}
		);

		if (post.matchedCount === 0) {
			res.status(500).json({
				error: "Failed to edit note: Sequence or note not found",
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

export default edit_note;
