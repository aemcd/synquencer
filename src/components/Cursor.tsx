import { announce, clearAnnouncer } from "@react-aria/live-announcer";
import React, { useEffect } from "react";
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
	const cursorNote = React.useRef(
		new Note({
			location: 0,
			pitch: 12 * 4,
			velocity: 50,
			duration: 1,
			instrument: instrumentList.Piano,
		})
	);
	let mod = React.useRef<number>(0);
	let selectedNote = React.useRef<Note | null>(null);

	function setSelectedNote(note: Note | null) {
		selectedNote.current = note;
	}

	function setMod(n: number) {
		mod.current = n;
	}

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
		cursorNote.current.pitch += noteChange - (mod.current % 12);
		setMod(mod.current + noteChange - (mod.current % 12));
		const newNote = new Note(cursorNote.current);
		addNote(newNote);
		clearAnnouncer("assertive");
		announce(
			newNote.pitchName() + " added at " + newNote.location,
			"assertive",
			7000
		);
		setSelectedNote(newNote);
	});

	useHotkeys("up, down", function (event, handler) {
		event.preventDefault();
		let action = "Position";
		switch (event.key) {
			case "ArrowUp":
				cursorNote.current.pitch++;
				setMod(mod.current + 1);
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
			case "ArrowDown":
				cursorNote.current.pitch--;
				setMod(mod.current - 1);
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
		}
		clearAnnouncer("assertive");
		announce(
			`${action} at ` +
				cursorNote.current.pitchName() +
				"at" +
				cursorNote.current.location,
			"assertive",
			7000
		);
	});

	useHotkeys("ctrl + ArrowUp, ctrl + ArrowDown", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system

		event.preventDefault();
		let action = "Position ";
		switch (event.key) {
			case "ArrowUp":
				cursorNote.current.pitch += 12;
				setMod(mod.current + 12);
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
			case "ArrowDown":
				cursorNote.current.pitch -= 12;
				setMod(mod.current - 12);
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
					action = "Note";
				}
				break;
		}
		clearAnnouncer("assertive");
		announce(
			`${action} at ` +
				cursorNote.current.pitchName() +
				"at" +
				cursorNote.current.location,
			"assertive",
			7000
		);
		//alert("Move note" + event.key + "an octave");
	});
	useHotkeys("1, 2, 3, 4, 5", function (event, handler) {
		switch (event.key) {
			case "1":
				clearAnnouncer("assertive");
				announce("Note duration set to 1/16.");
				cursorNote.current.duration = 1;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "2":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/8.");
				cursorNote.current.duration = 2;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "3":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/4.");
				cursorNote.current.duration = 4;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "4":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/2.");
				cursorNote.current.duration = 8;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			case "5":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/1.");
				cursorNote.current.duration = 16;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
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
					if (handler.ctrl == true && selectedNote.current != null) {
						if (
							cursorNote.current.location -
								cursorNote.current.duration >=
							0
						) {
							cursorNote.current.location -=
								cursorNote.current.duration;
							removeNote(selectedNote.current);
							const newNote = new Note(cursorNote.current);
							addNote(newNote);
							selectedNote.current = newNote;
							clearAnnouncer("assertive");
							announce(
								"Move" +
									newNote.pitchName() +
									" to " +
									newNote.location,
								"assertive",
								7000
							);
							break;
						}
					}
					if (
						cursorNote.current.location -
							cursorNote.current.duration >=
						0
					) {
						cursorNote.current.location -=
							cursorNote.current.duration;
						let prevNote = selectedNote.current;
						let sameLoc = false;
						setSelectedNote(null);
						console.log(selectedNote);
						noteMap.forEach((note) => {
							cursorNote.current.location +=
								cursorNote.current.duration;
							if (
								cursorNote.current.location == note.location &&
								(prevNote == null ||
									prevNote.location !=
										cursorNote.current.location ||
									prevNote.pitch > cursorNote.current.pitch)
							) {
								setSelectedNote(note);
								sameLoc = true;
								cursorNote.current.location = note.location;
								cursorNote.current.pitch = note.pitch;
							}
							cursorNote.current.location -=
								cursorNote.current.duration;
							if (
								cursorNote.current.location == note.location &&
								!sameLoc
							) {
								setSelectedNote(note);
							}
						});
						if (selectedNote.current == null) {
							clearAnnouncer("assertive");
							announce(
								"rest at " + cursorNote.current.location,
								"assertive",
								7000
							);
						} else {
							cursorNote.current.location =
								selectedNote.current.location;
							cursorNote.current.pitch =
								selectedNote.current.pitch;
							clearAnnouncer("assertive");
							announce(
								"Note at " +
									selectedNote.current?.pitchName() +
									" " +
									selectedNote.current?.location,
								"assertive",
								7000
							);
						}
						break;
					}
					break;

				case "ArrowRight":
					if (handler.ctrl == true && selectedNote.current != null) {
						if (
							cursorNote.current.location +
								cursorNote.current.duration * 2 <=
							sequence.length
						) {
							cursorNote.current.location +=
								cursorNote.current.duration;
							removeNote(selectedNote.current);
							const newNote = new Note(cursorNote.current);
							addNote(newNote);
							setSelectedNote(newNote);
							clearAnnouncer("assertive");
							announce(
								"Move" +
									newNote.pitchName() +
									"to" +
									newNote.location,
								"assertive",
								7000
							);
							break;
						}
					}
					if (
						cursorNote.current.location +
							cursorNote.current.duration * 2 <=
						sequence.length
					) {
						cursorNote.current.location +=
							cursorNote.current.duration;
						const prevNote = selectedNote.current;
						setSelectedNote(null);
						console.log(selectedNote);
						let sameLoc = false;
						noteMap.forEach((note) => {
							cursorNote.current.location -=
								cursorNote.current.duration;
							if (
								cursorNote.current.location === note.location &&
								(prevNote == null ||
									prevNote.location !==
										cursorNote.current.location ||
									prevNote.pitch < cursorNote.current.pitch)
							) {
								setSelectedNote(note);
								sameLoc = true;
								cursorNote.current.location = note.location;
								cursorNote.current.pitch = note.pitch;
							}
							cursorNote.current.location +=
								cursorNote.current.duration;
							if (
								cursorNote.current.location === note.location &&
								!sameLoc
							) {
								setSelectedNote(note);
							}
						});

						if (selectedNote.current == null) {
							clearAnnouncer("assertive");
							announce(
								"Rest at " + cursorNote.current.location,
								"assertive",
								7000
							);
						} else {
							cursorNote.current.location =
								selectedNote.current.location;
							cursorNote.current.pitch =
								selectedNote.current.pitch;
							clearAnnouncer("assertive");
							announce(
								"Note at " +
									selectedNote.current.pitchName() +
									" " +
									selectedNote.current.location,
								"assertive",
								7000
							);
						}
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
				cursorNote.current.velocity += 10;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			}
			case "ArrowDown": {
				cursorNote.current.velocity -= 10;
				if (selectedNote.current != null) {
					removeNote(selectedNote.current);
					const newNote = new Note(cursorNote.current);
					addNote(newNote);
					setSelectedNote(newNote);
				}
				break;
			}
		}
		announce(`Changed velocity to ${cursorNote.current.velocity}`);
	});
	useHotkeys("del", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
		if (selectedNote.current != null) {
			removeNote(selectedNote.current);
			setSelectedNote(null);
		}
		announce("Note deleted");
	});

	return null;
}
