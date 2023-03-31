import { WriteMidi } from "@/client/write_midi";
import { AddNotes, ClearNotes, EditSequence } from "@/database/calls";
import { Note, SequenceMetadata, instrumentList, instrumentColors, Instrument } from "@/server/types";
import Link from "next/link";
import { announce, clearAnnouncer } from "@react-aria/live-announcer";
import { useState } from "react";

type ContentPageProps = {
	sequence: SequenceMetadata;
	setStepLength: (stepLength: number) => void;
	setBPM: (stepLength: number) => void;
	saveSequence: () => void;
	downloadSequence: () => void;
	playSequence: () => void;
	stopSequence: () => void;
	setInstrument: (instrument: string) => void;
	setLength: (length: string) => void;
	setTimeSig: (timeSig: string) => void;
};

export default function TopBar({
	sequence,
	setStepLength,
	setBPM,
	saveSequence,
	downloadSequence,
	playSequence,
	stopSequence,
	setInstrument,
	setLength,
	setTimeSig
}: ContentPageProps) {
	const [message, setMessage] = useState("");
	return (
		<div className="top-bar">
			<button
				className="top-button"
				aria-label="Play"
				onClick={playSequence}
			>
				▶
			</button>
			<button
				className="top-button"
				aria-label="Stop"
				onClick={stopSequence}
			>
				◼
			</button>
			<div className="settings">
				<input
					className="settings-input"
					aria-label="BPM"
					type="number"
					min="1"
					max="999"
					defaultValue={sequence.bpm ? sequence.bpm : "120"}
					onChange={(e) => {
						if (e.target.value === "" || parseInt(e.target.value) < 0) {
							e.target.value = "1";
						} else if (parseInt(e.target.value) > 999) {
							e.target.value = "999"
						}
						setBPM(parseInt(e.target.value))
					}}
					style={{ width: "48px", marginRight: "-6px" }}
					maxLength={3}
				/>
				<span aria-hidden="true">BPM |</span>
				<select
					className="settings-input dropdown"
					aria-label="Time Signature"
					style={{ width: "64px", marginLeft: "4px", marginRight: "-2px"}}
					onChange={(e) => {
						setTimeSig(e.target.value);
					}}
				>
					<option value="4/4">4/4</option>
					<option value="3/4">3/4</option>
					<option value="6/8">6/8</option>
					<option value="5/4">5/4</option>
				</select>
				<span aria-hidden="true">|</span>
				<select
					className="settings-input dropdown"
					aria-label="Step Length"
					style={{ width: "76px", marginLeft: "4px", marginRight: "-2px"}}
					onChange={(e) => setStepLength(parseInt(e.target.value))}
				>
					<option value="1">1/16</option>
					<option value="2">1/8</option>
					<option value="4">1/4</option>
					<option value="8">1/2</option>
					<option value="16">1/1</option>
				</select>
				<span aria-hidden="true">|</span>
				<input
					className="settings-input"
					aria-label="Length"
					type="number"
					min="1"
					max="99"
					defaultValue={sequence.length ? sequence.length : "1"}
					onChange={(e) => {
						if (e.target.value === "" || parseInt(e.target.value) < 0) {
							e.target.value = "1";
						} else if (parseInt(e.target.value) > 99) {
							e.target.value = "99";
						}
						setLength(e.target.value);
					}}
					style={{ width: "38px", marginRight: "-6px", marginLeft: "6px" }}
					maxLength={3}
				/>
				<span aria-hidden="true" style={{ marginRight: "6px"}}>Bars</span>
			</div>
			<select
				aria-label="Instrument"
				className="instrument-selection dropdown"
				onChange={(e) => setInstrument(e.target.value)}
			>
				<option value="Piano">Piano</option>
				<option value="Guitar">Guitar</option>
				<option value="Bass">Bass</option>
				<option value="Trumpet">Trumpet</option>
				<option value="Synth Drum">Synth Drum</option>	
			</select>
			<div className="settings">
				<span aria-hidden="true">Vel:</span>
				<input
					className="settings-input"
					aria-label="Velocity"
					type="number"
					min="1"
					max="100"
					defaultValue={""}
					onChange={(e) => {
						if (e.target.value === "" || parseInt(e.target.value) < 1) {
							e.target.value = "1";
						} else if (parseInt(e.target.value) > 100) {
							e.target.value = "100"
						}
					}}
					style={{ width: "52px", marginRight: "-12px", marginLeft: "4px" }}
					maxLength={3}
				/>
			</div>
			<button
				className="top-button"
				aria-label="Save"
				style={{ transform: "scale(1,-1)" }}
				onClick={() => {
					saveSequence();
					clearAnnouncer("assertive");
					announce("Sequence saved", "assertive", 50);
				}}
			>
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
			<button
				className="top-button"
				aria-label="Download"
				onClick={downloadSequence}
			>
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
			<button
				className="top-button"
				aria-label="Home"
				onClick={() => (window.location.href = "/")}
			>
				<svg width="20" height="20" viewBox="0 0 238.1 198.4">
					<path
						fill="var(--fg2)"
						d="M119 0 0 119h39.7v79.4h52.9v-52.9h53v53h52.8V119h39.7z"
					/>
				</svg>
			</button>
		</div>
	);
}
