import { announce } from "@react-aria/live-announcer";
import React from "react";
import {
	Instrument,
	Note,
	PitchLocation,
	SequenceMetadata,
} from "@/server/types";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
	addNote: (note: Note) => void;
	sequence: SequenceMetadata;
};
export default function Cursor({ addNote, sequence }: Props) {
	const cursorNote = React.useMemo(() => {
		return new Note({
			location: 0,
			pitch: 12 * 4,
			velocity: 50,
			duration: 4,
			instrument: new Instrument({
				channel: 0,
				name: "",
			}),
		});
	}, []);
	let mod = 0;
	useHotkeys("a, b, c, d, e, f, g", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();

		const newNote = new Note(cursorNote);
		let noteChange = -3;
		switch (event.key) {
			case "a":
				break;
			case "b":
				noteChange = -1;
				break;
			case "c":
				noteChange = 0;
				break;
			case "d":
				noteChange = 2;
				break;
			case "e":
				noteChange = 4;
				break;
			case "f":
				noteChange = 5;
				break;
			case "g":
				noteChange = 7;
				break;
		}
		newNote.pitch += mod + noteChange;
		const newNotes = addNote(newNote);
		announce(newNote.pitchName() + " added at ", "assertive", 50);
	});
	useHotkeys("up, down", function (event, handler) {
		event.preventDefault();
		switch (event.key) {
			case "ArrowUp":
				if (mod < 1) {
					mod++;
				}
				break;
			case "ArrowDown":
				if (mod > -1) {
					mod--;
				}
				break;
		}
		announce("Note at" + cursorNote.pitchName());
	});
	useHotkeys("ctrl + ArrowUp, ctrl + ArrowDown", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		switch (event.key) {
			case "ArrowUp":
				cursorNote.pitch += 12;
				break;
			case "ArrowDown":
				cursorNote.pitch -= 12;

				break;
		}

		//alert("Move note" + event.key + "an octave");
	});
	useHotkeys("1, 2, 3, 4, 5", function (event, handler) {
		switch (event.key) {
			case "1":
				alert("Note duration set to 1/16.");
				break;
			case "2":
				alert("Note duration set to 1/8.");
				break;
			case "3":
				alert("Note duration set to 1/4.");
				break;
			case "4":
				alert("Note duration set to 1/2.");
				break;
			case "5":
				alert("Note duration set to 1/1.");
				break;
			default:
				alert(event);
		}
	});
	useHotkeys(
		"ArrowLeft, ArrowRight, ctrl+ArrowLeft, ctrl+ArrowRight",
		function (event, handler) {
			switch (event.key) {
				case "ArrowLeft":
					if (handler.ctrl == true) {
						alert("Move note left.");
						break;
					}
					if (cursorNote.location - cursorNote.duration >= 0) {
						cursorNote.location -= cursorNote.duration;
					}
					break;
				case "ArrowRight":
					if (handler.ctrl == true) {
						alert("Moved note right.");
						break;
					}
					if (
						cursorNote.location + cursorNote.duration * 2 <=
						sequence.length
					) {
						cursorNote.location += cursorNote.duration;
					}
					break;
				default:
					alert(event);
			}
		}
	);
	useHotkeys("ctrl+n, command+n", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("Create a new sequence:");
	});
	useHotkeys("shift + up, shift + down", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("changed velocity" + event.key);
	});
	useHotkeys("del", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		alert("Note deleted" + event.key);
	});

	return (
		<div
			aria-label="Cursor"
			aria-atomic="true"
			aria-live="assertive"
			tabIndex={0}
		></div>
	);
}
