import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import { Sequence } from "@/server/types";

const inter = Inter({ subsets: ["latin"] });

export default function Test() {
	const handleAddSequence = async (newSequence: Sequence) => {
		try {
			let response = await fetch("/api/addSequence/", {
				method: "POST",
				body: JSON.stringify(newSequence),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			});
			response = await response.json();
			console.log(response);
		} catch (e) {
			throw new Error(String(e));
		}
	};

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
					onClick={(e: any) => handleAddSequence(defaultSequence)}
				>
					Add Sequence
				</button>
			</main>
		</>
	);
}
