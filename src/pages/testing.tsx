import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import { Note, Sequence } from "@/server/types";
import {
	AddNote,
	AddSequence,
	DeleteNote,
	DeleteSequence,
	EditSequence,
	GetSequence,
} from "@/database/calls";

const inter = Inter({ subsets: ["latin"] });

export default function Test() {
	const defaultSequence = new Sequence({
		id: "default",
		length: 100,
		bpm: 100,
		timeSignature: {
			numerator: 4,
			denominator: 4,
		},
	});

	const defaultSequence2 = new Sequence(defaultSequence);
	defaultSequence2.setBPM(23232);
	defaultSequence2.setLength(33);

	const defaultNote = new Note({
		location: 0,
		velocity: 1,
		duration: 2,
		pitch: 3,
	});
	return (
		<>
			<main className={styles.main}>
				<div>
					<button
						onClick={(e: any) =>
							console.log(
								AddSequence(defaultSequence).then((value) =>
									console.log(value)
								)
							)
						}
					>
						Add Sequence
					</button>
					<button
						onClick={(e: any) =>
							console.log(
								DeleteSequence(defaultSequence.id).then(
									(value) => console.log(value)
								)
							)
						}
					>
						Delete Sequence
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								GetSequence(defaultSequence.id).then((value) =>
									console.log(value)
								)
							);
						}}
					>
						Get Sequence
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								EditSequence(
									defaultSequence.id,
									defaultSequence2
								).then((value) => console.log(value))
							);
						}}
					>
						Edit Sequence
					</button>
				</div>
				<div>
					<button
						onClick={(e: any) => {
							console.log(
								AddNote(defaultSequence.id, defaultNote).then(
									(value) => console.log(value)
								)
							);
						}}
					>
						Add Note
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								DeleteNote(
									defaultSequence.id,
									defaultNote
								).then((value) => console.log(value))
							);
						}}
					>
						Delete Note
					</button>
				</div>
			</main>
		</>
	);
}
