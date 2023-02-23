import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import { Sequence } from "@/server/types";
import { AddSequence, DeleteSequence, GetSequence } from "@/database/calls";

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

	return (
		<>
			<main className={styles.main}>
				<button
					onClick={(e: any) =>
						console.log(AddSequence(defaultSequence))
					}
				>
					Add Sequence
				</button>
				<button
					onClick={(e: any) =>
						console.log(DeleteSequence(defaultSequence.id))
					}
				>
					Delete Sequence
				</button>
				<button
					onClick={(e: any) => {
						let seq: Sequence;
						console.log(
							GetSequence(defaultSequence.id).then((value) =>
								console.log(value instanceof Sequence)
							)
						);
					}}
				>
					Get Sequence
				</button>
			</main>
		</>
	);
}
