import { useHotkeys } from "react-hotkeys-hook";
import React, { useEffect } from "react";
import { Note } from "@/server/types";

export default function PreviewPiano() {
	let selectedNote = React.useRef<Note | null>(null);

	useHotkeys("a, b, c, d, e, f, g", function (event, handler) {
		// Prevent the default refresh event under WINDOWS system
		event.preventDefault();
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
	});
}
