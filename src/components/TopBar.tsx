import { WriteMidi } from "@/client/write_midi";
import { AddNotes, ClearNotes, EditSequence } from "@/database/calls";
import { Note, SequenceMetadata } from "@/server/types";
import Link from "next/link";

type ContentPageProps = {
	sequence: SequenceMetadata;
	notes: Array<Note>;
    setStepLength: (stepLength: number) => void;
    setBPM: (stepLength: number) => void;
};

export default function TopBar({ sequence, notes, setStepLength, setBPM }: ContentPageProps) {
	function saveSequence() {
		EditSequence(sequence.id, sequence);
		ClearNotes(sequence.id);
		AddNotes(sequence.id, notes);
	}

	function downloadSequence() {
		WriteMidi(sequence, notes);
	}

	return (
		<div className="top-bar">
			<button className="top-button">▶</button>
			<button className="top-button">◼</button>
			<div className="settings">
				<input
					className="settings-input"
					defaultValue="120"
					style={{ width: "36px" }}
					maxLength={3} /> BPM |
				<input
					className="settings-input"
					defaultValue="4/4"
					style={{ width: "56px" }} />|
				<select
					className="settings-input"
					style={{ width: "76px" }}
					onChange={(e) => setStepLength(parseInt(e.target.value))}>
					<option value="1">1/16</option>
					<option value="2">1/8</option>
					<option value="4">1/4</option>
					<option value="8">1/2</option>
					<option value="16">1/1</option>
				</select>
			</div>
			<button
				className="top-button"
				style={{ transform: "scale(1,-1)" }}
				onClick={saveSequence}>
				<svg width="18" height="18" viewBox="0 0 185.2 185.2">
					<path
						fill="var(--fg2)"
						d="M26.5 529.2h185.2v-79.4h-26.5v53H53v-53H26.5z"
						transform="translate(-26.5 -344)"
					/>
					<path
						fill="var(--fg2)"
						d="M119 476.3 53 410h39.6V344h53V410h39.6z"
						transform="translate(-26.5 -344)"
					/>
				</svg>
			</button>
			<button className="top-button" onClick={downloadSequence}>
				<svg width="18" height="18" viewBox="0 0 185.2 185.2">
					<path
						fill="var(--fg2)"
						d="M26.5 529.2h185.2v-79.4h-26.5v53H53v-53H26.5z"
						transform="translate(-26.5 -344)"
					/>
					<path
						fill="var(--fg2)"
						d="M119 476.3 53 410h39.6V344h53V410h39.6z"
						transform="translate(-26.5 -344)"
					/>
				</svg>
			</button>
			<Link href="/">
				<button className="top-button">
					<svg width="20" height="20" viewBox="0 0 238.1 198.4">
						<path
							fill="var(--fg2)"
							d="M119 0 0 119h39.7v79.4h52.9v-52.9h53v53h52.8V119h39.7z"
						/>
					</svg>
				</button>
			</Link>
		</div>
	);
}
