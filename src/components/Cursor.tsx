 import { announce, clearAnnouncer } from "@react-aria/live-announcer";
import React, { useCallback, useEffect } from "react";
import {
	Instrument,
	instrumentList,
	Note,
	NoteKey,
	SequenceMetadata,
} from "@/server/types";
import { useHotkeys } from "react-hotkeys-hook";
import { playNote } from "@/client/write_midi";

type Props = {
	noteMap: Map<string, Note>;
	sequence: SequenceMetadata;
	selectedNote: React.MutableRefObject<Note | null>;
	addNote: (note: Note) => void;
	removeNote: (note: Note) => void;
	removeAndAddNote: (rmNote: Note, addNote: Note) => void;
	undo: () => boolean;
	redo: () => boolean;
	PlayNote: (note: Note) => void;
};
export default function Cursor({
	noteMap,
	sequence,
	selectedNote,
	addNote,
	removeNote,
	removeAndAddNote,
	undo,
	redo,
	PlayNote,
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

	useEffect(() => {
		announce("Sequencer Start");
	}, []);

	const mode = React.useRef(false);

	const setSelectedNote = useCallback(
		(note: Note | null) => {
			selectedNote.current = note;
		},
		[selectedNote]
	);
	const editAndSetSelected = useCallback(() => {
		if (selectedNote.current != null) {
			const newNote = new Note(cursorNote.current);
			removeAndAddNote(selectedNote.current, newNote);
			setSelectedNote(newNote);
		}
	}, [removeAndAddNote, selectedNote, setSelectedNote]);

	useHotkeys("shift+k", function (event, handler) {
		if (mode.current == true) {
			mode.current = false;
			clearAnnouncer("assertive");
			announce("Input mode");
		} else {
			mode.current = true;
			clearAnnouncer("assertive");
			announce("Keyboard mode");
		}
	});

	useHotkeys("a, b, c, d, e, f, g", function (event, handler) {
		if (mode.current == true) {
			return;
		} else {
			// Prevent the default refresh event under WINDOWS system

			event.preventDefault();
			setSelectedNote(null);
			let noteChange = 0;
			switch (event.key) {
				case "a":
					noteChange = 9;
					break;
				case "b":
					noteChange = 11;
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
			cursorNote.current.pitch +=
				noteChange - (cursorNote.current.pitch % 12);
			const newNote = new Note(cursorNote.current);
			addNote(newNote);
			clearAnnouncer("assertive");
			announce(
				newNote.pitchName() + " added at " + newNote.location,
				"assertive",
				7000
			);
			setSelectedNote(newNote);
		PlayNote(newNote);
	}
	});

	useHotkeys("up, down", function (event, handler) {
		if (mode.current == true) {
			return;
		} else {
			event.preventDefault();
			let action = "Position";
			switch (event.key) {
				case "ArrowUp":
					cursorNote.current.pitch++;
					if (selectedNote.current != null) {
						editAndSetSelected();
						action = "Note";
					}
					break;
				case "ArrowDown":
					cursorNote.current.pitch--;
					if (selectedNote.current != null) {
						editAndSetSelected();
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
		PlayNote(cursorNote.current);
	}
	});

	useHotkeys("ctrl + ArrowUp, ctrl + ArrowDown", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system

		if (mode.current == true) {
			return;
		} else {
			event.preventDefault();
			let action = "Position ";
			switch (event.key) {
				case "ArrowUp":
					cursorNote.current.pitch += 12;
					if (selectedNote.current != null) {
						editAndSetSelected();
						action = "Note";
					}
					break;
				case "ArrowDown":
					cursorNote.current.pitch -= 12;
					if (selectedNote.current != null) {
						editAndSetSelected();
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
			PlayNote(cursorNote.current);
			//alert("Move note" + event.key + "an octave");
		}
	});
	useHotkeys("1, 2, 3, 4, 5", function (event, handler) {
		switch (event.key) {
			case "1":
				clearAnnouncer("assertive");
				announce("Note duration set to 1/16.");
				cursorNote.current.duration = 1;
				if (selectedNote.current != null) {
					editAndSetSelected();
				}
				break;
			case "2":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/8.");
				cursorNote.current.duration = 2;
				if (selectedNote.current != null) {
					editAndSetSelected();
				}
				break;
			case "3":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/4.");
				cursorNote.current.duration = 4;
				if (selectedNote.current != null) {
					editAndSetSelected();
				}
				break;
			case "4":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/2.");
				cursorNote.current.duration = 8;
				if (selectedNote.current != null) {
					editAndSetSelected();
				}
				break;
			case "5":
				clearAnnouncer("assertive");

				announce("Note duration set to 1/1.");
				cursorNote.current.duration = 16;
				if (selectedNote.current != null) {
					editAndSetSelected();
				}
				break;
		}
	});
	useHotkeys(
		"ArrowLeft, ArrowRight, ctrl+ArrowLeft, ctrl+ArrowRight",
		function (event, handler) {
			if (mode.current == true) {
				return;
			} else {
				switch (event.key) {
					case "ArrowLeft":
						if (
							handler.ctrl == true &&
							selectedNote.current != null
						) {
							if (
								cursorNote.current.location -
									cursorNote.current.duration >=
								0
							) {
								cursorNote.current.location -=
									cursorNote.current.duration;
								const newNote = new Note(cursorNote.current);
								removeAndAddNote(selectedNote.current, newNote);
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
									cursorNote.current.location ==
										note.location &&
									(prevNote == null ||
										prevNote.location !=
											cursorNote.current.location ||
										prevNote.pitch >
											cursorNote.current.pitch)
								) {
									setSelectedNote(note);
									sameLoc = true;
									cursorNote.current.location = note.location;
									cursorNote.current.pitch = note.pitch;
								}
								cursorNote.current.location -=
									cursorNote.current.duration;
								if (
									cursorNote.current.location ==
										note.location &&
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
							PlayNote(cursorNote.current);
						}
							break;
						}
						break;

					case "ArrowRight":
						if (
							handler.ctrl == true &&
							selectedNote.current != null
						) {
							if (
								cursorNote.current.location +
									cursorNote.current.duration * 2 <=
								sequence.length
							) {
								cursorNote.current.location +=
									cursorNote.current.duration;
								const newNote = new Note(cursorNote.current);
								removeAndAddNote(selectedNote.current, newNote);
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
									cursorNote.current.location ===
										note.location &&
									(prevNote == null ||
										prevNote.location !==
											cursorNote.current.location ||
										prevNote.pitch <
											cursorNote.current.pitch)
								) {
									setSelectedNote(note);
									sameLoc = true;
									cursorNote.current.location = note.location;
									cursorNote.current.pitch = note.pitch;
								}
								cursorNote.current.location +=
									cursorNote.current.duration;
								if (
									cursorNote.current.location ===
										note.location &&
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
							PlayNote(cursorNote.current);
						}
							break;
						}
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
					editAndSetSelected();
				}
				break;
			}
			case "ArrowDown": {
				cursorNote.current.velocity -= 10;
				if (selectedNote.current != null) {
					editAndSetSelected();
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
	useHotkeys("ctrl+z", function (event, handler) {
		event.preventDefault();
		undo();
		setSelectedNote(null);
		announce("Action undone");
	});

	useHotkeys("ctrl+shift+z", function (event, handler) {
		event.preventDefault();
		redo();
		setSelectedNote(null);
		announce("Action redone");
	});

	useHotkeys("ctrl+y", function (event, handler) {
		event.preventDefault();
		redo();
		setSelectedNote(null);
		announce("Action redone");

	});
	useHotkeys("a, w, s, e, d, f, t, g, y, h, u, j, k", function(event, handler) {
	if (mode.current == false) {
		return;
	} else {
		setSelectedNote(null);
		let noteChange = 0;
		switch(event.key) {
			case "a": 
			noteChange = 0;
			break;
			case "w":
				noteChange = 1;
break;
case "s":
	noteChange = 2;
	break;
	case "e":
		noteChange = 3;
		break;
		case "d": 
		noteChange = 4;
		break;
		case "f":
			noteChange = 5;
			break;
			case "t": 
			noteChange = 6;
			break;
			case "g": 
			noteChange = 7;
		break;
		case "y":
			noteChange = 8;
			break;;
			case "h":
				noteChange = 9;
				break;
				case "u":
				noteChange = 10;
				break;
				case "j": 
				noteChange = 11;
				break;
				case "k": 
				noteChange = 12;
				break;

		}
		cursorNote.current.pitch += noteChange - cursorNote.current.pitch % 12;
			PlayNote(cursorNote.current);
cursorNote.current.pitch -= noteChange; 
}	
});


	useHotkeys("z, x", function (event, handler) {
		if (mode.current == false) {
			return;
		} else {
		switch(event.key) {
			case "z": 
			cursorNote.current.pitch -= 12;
			break;
			case "x": 
			cursorNote.current.pitch += 12;
			break;
		}


	}
	});
		return null;
}