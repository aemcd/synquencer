import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import { Sequence } from "@/server/types";
import {
	AddSequence,
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

	return (
		<>
			<main className={styles.main}>
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
							DeleteSequence(defaultSequence.id).then((value) =>
								console.log(value)
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
			</main>
		</>
	);
}
