import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import { Note, Sequence } from "@/server/types";
import {
	AddNote,
	AddNotes,
	AddSequence,
	ClearNotes,
	DeleteNote,
	DeleteSequence,
	EditNote,
	EditSequence,
	GetNote,
	GetNotes,
	GetSequence,
} from "@/database/calls";

const inter = Inter({ subsets: ["latin"] });
let noteLoc = -1;

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
	const defaultNote2 = new Note({
		location: 999,
		velocity: 0,
		duration: 0,
		pitch: 0,
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
							defaultNote.setLocation(++noteLoc);
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
								AddNotes(
									defaultSequence.id,
									new Array<Note>(10).fill(defaultNote2)
								).then((value) => console.log(value))
							);
						}}
					>
						Add Notes
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								DeleteNote(
									defaultSequence.id,
									defaultNote
								).then((value) => console.log(value))
							);
							defaultNote.setLocation(--noteLoc);
						}}
					>
						Delete Note
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								ClearNotes(defaultSequence.id).then((value) =>
									console.log(value)
								)
							);
						}}
					>
						Clear Notes
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								GetNote(defaultSequence.id, defaultNote).then(
									(value) => console.log(value)
								)
							);
						}}
					>
						Get Note
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								GetNotes(defaultSequence.id).then((value) => {
									console.log(value);
									console.log(value[0] instanceof Note);
								})
							);
						}}
					>
						Get Notes
					</button>
					<button
						onClick={(e: any) => {
							console.log(
								EditNote(
									defaultSequence.id,
									defaultNote,
									defaultNote2
								).then((value) => console.log(value))
							);
						}}
					>
						Edit Note
					</button>
				</div>
			</main>
		</>
	);
}
