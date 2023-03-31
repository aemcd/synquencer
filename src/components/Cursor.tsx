import { announce, clearAnnouncer } from "@react-aria/live-announcer";
import React from "react";
import {
	Instrument,
	instrumentList,
	Note,
	PitchLocation,
	SequenceMetadata,
} from "@/server/types";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
	noteMap: Map<string, Note>;
	sequence: SequenceMetadata;
	addNote: (note: Note) => void;
	removeNote: (note: Note) => void;
};
export default function Cursor({
	noteMap,
	sequence,
	addNote,
	removeNote,
}: Props) {
	const cursorNote = React.useMemo(() => {
		return new Note({
			location: 0,
			pitch: 12 * 4,
			velocity: 50,
			duration: 1,
			instrument: instrumentList.Piano,
		});
	}, []);
	const [mod, setMod] = React.useState<number>(0);
	const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
	useHotkeys("a, b, c, d, e, f, g", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		setSelectedNote(null);
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
		cursorNote.pitch += noteChange - (mod % 12);
		setMod(mod + noteChange - (mod % 12));
		const newNote = new Note(cursorNote);
		addNote(newNote);
		clearAnnouncer("assertive");
		announce(newNote.pitchName() + " added at ", "assertive", 7000);
		setSelectedNote(newNote);
	});

	useHotkeys("up, down", function (event, handler) {
		event.preventDefault();
		let action = "Position";
		switch (event.key) {
			case "ArrowUp":
				cursorNote.pitch++;
				setMod(mod + 1);
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
			case "ArrowDown":
				cursorNote.pitch--;
				setMod(mod - 1);
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
		}
		clearAnnouncer("assertive");
		announce(`${action} at ` + cursorNote.pitchName(), "assertive", 7000);
	});

	useHotkeys("ctrl + ArrowUp, ctrl + ArrowDown", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system

		event.preventDefault();
		let action = "Position ";
		switch (event.key) {
			case "ArrowUp":
				cursorNote.pitch += 12;
				setMod(mod + 12);
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
			case "ArrowDown":
				cursorNote.pitch -= 12;
				setMod(mod - 12);
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
		}
		clearAnnouncer("assertive");
		announce(`${action} at ` + cursorNote.pitchName(), "assertive", 7000);
		//alert("Move note" + event.key + "an octave");
	});
	useHotkeys("1, 2, 3, 4, 5", function (event, handler) {
		switch (event.key) {
			case "1":
				clearAnnouncer("assertive");
				announce("Note duration set to 1/16.");
				cursorNote.duration = 1;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "2":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/8.");
				cursorNote.duration = 2;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "3":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/4.");
				cursorNote.duration = 4;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "4":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/2.");
				cursorNote.duration = 8;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "5":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/1.");
				cursorNote.duration = 16;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
		}
	});
	useHotkeys(
		"ArrowLeft, ArrowRight, ctrl+ArrowLeft, ctrl+ArrowRight",
		function (event, handler) {
			switch (event.key) {
				case "ArrowLeft":
					if (handler.ctrl == true && selectedNote != null) {
						if (cursorNote.location - cursorNote.duration >= 0) {
							cursorNote.location -= cursorNote.duration;
							removeNote(selectedNote);
							const newNote = new Note(cursorNote);
							addNote(newNote);
							setSelectedNote(newNote);
							clearAnnouncer("assertive");
							announce("Move note left.", "assertive", 7000);
							break;
						}
					}
					if (cursorNote.location - cursorNote.duration >= 0) {
						cursorNote.location -= cursorNote.duration;
						clearAnnouncer("assertive");
						announce("Moved left", "assertive", 7000);
						const prevNote = selectedNote;
						setSelectedNote(null);
						noteMap.forEach((note) => {
							if (
								cursorNote.location == note.location &&
								(prevNote == null ||
									prevNote.pitch > cursorNote.pitch)
							) {
								setSelectedNote(note);
							}
						});
						break;
					}

					break;
				case "ArrowRight":
					if (handler.ctrl == true && selectedNote != null) {
						if (
							cursorNote.location + cursorNote.duration * 2 <=
							sequence.length
						) {
							cursorNote.location += cursorNote.duration;
							removeNote(selectedNote);
							const newNote = new Note(cursorNote);
							addNote(newNote);
							setSelectedNote(newNote);
							clearAnnouncer("assertive");
							announce("Moved note right.");
							break;
						}
					}
					if (
						cursorNote.location + cursorNote.duration * 2 <=
						sequence.length
					) {
						cursorNote.location += cursorNote.duration;
						clearAnnouncer("assertive");
						announce("Moved right");
						const prevNote = selectedNote;
						setSelectedNote(null);
						noteMap.forEach((note) => {
							if (
								cursorNote.location == note.location &&
								(prevNote == null ||
									prevNote.pitch < cursorNote.pitch)
							) {
								setSelectedNote(note);
							}
						});
						break;
					}
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
		switch (event.key) {
			case "ArrowUp": {
				cursorNote.velocity += 10;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			}
			case "ArrowDown": {
				cursorNote.velocity -= 10;
				if (selectedNote != null) {
					removeNote(selectedNote);
					const newNote = new Note(cursorNote);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			}
		}
		announce(`Changed velocity to ${cursorNote.velocity}`);
	});
	useHotkeys("del", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		if (selectedNote != null) {
			removeNote(selectedNote);
			setSelectedNote(null);
		}
		announce("Note deleted");
	});

	return null;
}
