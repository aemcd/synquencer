import React, {
	useEffect,
	useRef,
	useReducer,
	MouseEvent,
	useMemo,
} from "react";
import {
	Instrument,
	Note,
	PitchLocation,
	SequenceMetadata,
} from "@/server/types";

type ContentPageProps = {
	sequence: SequenceMetadata;
	notes: Array<Note>;
	stepLength: number;
};

export default function PianoRoll({
	sequence,
	notes,
	stepLength,
}: ContentPageProps) {
	// TODO

	const sequenceMap = useMemo(() => {
		return new Map<string, Note>();
	}, []);

	notes.forEach((note) => {
		sequenceMap.set(note.getPitchLocation().serialize(), note);
	});

	let rollWidth = 767;
	let rollHeight = 864;
	let gridWidth = 24;
	let gridHeight = 24;

	const DRAG_STATES = {
		NOT_DRAGGING: 0,
		MOVING_NOTE: 1,
		CHANGING_LENGTH: 2,
	} as const;

	let dragState: number = DRAG_STATES.NOT_DRAGGING;
	let selectedNote: Note | null = null;
	let startGridX = -1;
	let startGridY = -1;

	const bgRef = useRef<HTMLCanvasElement | null>(null);
	const fgRef = useRef<HTMLCanvasElement | null>(null);

	let computedStyle: CSSStyleDeclaration;
	let bgCtx: CanvasRenderingContext2D | null;
	let fgCtx: CanvasRenderingContext2D | null;

	useEffect(() => {
		computedStyle = getComputedStyle(document.body);

		if (bgRef.current) {
			bgCtx = bgRef.current.getContext("2d");
		}

		if (fgRef.current) {
			fgCtx = fgRef.current.getContext("2d");
		}

		drawBG();
		drawFG();
	});

	useEffect(() => {
		console.log("here");

		if (sequenceMap != null && drawFG != null) {
			notes.forEach((note) => {
				sequenceMap.set(note.getPitchLocation().serialize(), note);
			});
			drawFG();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [notes]);

	function drawBG() {
		if (!bgCtx) return;

		bgCtx.clearRect(0, 0, rollWidth, rollHeight);

		bgCtx.lineWidth = 2;

		// horizontal grid lines
		bgCtx.fillStyle = computedStyle.getPropertyValue("--bg1");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			bgCtx.fillRect(0, gridHeight * (i + 1) - 1, rollWidth, 2);
		}

		// vertical grid lines
		for (let i = 0; i < rollWidth / gridWidth; i++) {
			(i + 1) % 4 == 0
				? (bgCtx.fillStyle = computedStyle.getPropertyValue("--bg3"))
				: (bgCtx.fillStyle = computedStyle.getPropertyValue("--bg1"));
			if ((i + 1) % stepLength == 0) {
				bgCtx.fillRect(gridWidth * (i + 1) - 1, 0, 2, rollHeight);
			}
		}
	}

	function drawFG() {
		if (!fgCtx) return;

		fgCtx.clearRect(0, 0, rollWidth, rollHeight);

		sequenceMap.forEach((value) => {
			if (value !== selectedNote) {
				drawNote(
					value.location,
					value.pitch,
					value.duration,
					computedStyle.getPropertyValue("--yellow"),
					computedStyle.getPropertyValue("--yellow-accent"),
					false
				);
			}
		});

		if (selectedNote && dragState == DRAG_STATES.NOT_DRAGGING) {
			drawNote(
				selectedNote.location,
				selectedNote.pitch,
				selectedNote.duration,
				computedStyle.getPropertyValue("--yellow"),
				computedStyle.getPropertyValue("--yellow-accent"),
				true
			);
		}
	}

	function drawNote(
		gridX: number,
		gridY: number,
		length: number,
		colorFill: string,
		colorOutline: string,
		highlighted: boolean
	) {
		if (length < 0) return;
		if (!fgCtx) return;

		fgCtx.fillStyle = colorFill;
		fgCtx.fillRect(
			gridX * gridWidth,
			gridY * gridHeight,
			gridWidth * length,
			gridHeight
		);
		fgCtx.strokeStyle = colorOutline;
		fgCtx.lineWidth = 2;
		fgCtx.strokeRect(
			gridX * gridWidth,
			gridY * gridHeight,
			gridWidth * length,
			gridHeight
		);
		fgCtx.fillStyle = colorOutline;
		fgCtx.fillRect(
			(gridX + length) * gridWidth - 6,
			gridY * gridHeight + 4,
			2,
			gridHeight - 8
		);

		if (highlighted) {
			fgCtx.strokeStyle = computedStyle.getPropertyValue("--fg0");
			fgCtx.strokeRect(
				gridX * gridWidth - 2,
				gridY * gridHeight - 2,
				gridWidth * length + 4,
				gridHeight + 4
			);
		}
	}

	function getGridPos(e: MouseEvent) {
		let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

		let pixelX = e.clientX - rect.left - 2;
		let pixelY = e.clientY - rect.top - 2;

		let isRightHalf = pixelX % gridWidth > gridWidth / 2;

		let gridX = stepLength * Math.floor(pixelX / gridWidth / stepLength);
		let gridY = Math.floor(pixelY / gridHeight);

		return { gridX, gridY, isRightHalf };
	}

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();

		let { gridX, gridY, isRightHalf } = getGridPos(e);

		startGridX = gridX;
		startGridY = gridY;

		selectedNote = null;

		sequenceMap.forEach((value) => {
			if (
				gridY == value.pitch &&
				gridX >= value.location &&
				gridX < value.location + value.duration
			) {
				// Clicked cell lies within an existing note. Only take the last one, which will be on top because of the render order.
				selectedNote = value;
			}
		});

		if (e.button === 2) {
			// right click - delete if note was found
			if (selectedNote != null) {
				// @ts-ignore
				sequenceMap.delete(selectedNote.getPitchLocation().serialize());
			}
			selectedNote = null;
			drawFG();
		} else if (e.button == 0) {
			// left click
			if (selectedNote != null) {
				// note found
				// @ts-ignore
				if (
					gridX ==
						selectedNote.location +
							selectedNote.duration -
							stepLength &&
					isRightHalf
				) {
					// end of the note was clicked - start changing length
					dragState = DRAG_STATES.CHANGING_LENGTH;
				} else {
					// another part of the note was clicked - start moving
					dragState = DRAG_STATES.MOVING_NOTE;
				}
			} else {
				// no note found; creating new note
				selectedNote = new Note({
					location: startGridX,
					velocity: 100,
					duration: stepLength,
					pitch: startGridY,
					instrument: new Instrument({ channel: 1, name: "Piano" }),
				});
				dragState = DRAG_STATES.CHANGING_LENGTH;
				drawFG();
				drawNote(
					startGridX,
					startGridY,
					selectedNote.duration,
					computedStyle.getPropertyValue("--yellow"),
					computedStyle.getPropertyValue("--yellow-accent"),
					false
				);
			}
		}
	}

	function handleMouseMove(e: MouseEvent) {
		e.preventDefault();

		if (dragState == DRAG_STATES.NOT_DRAGGING) return;

		if (!selectedNote) return;

		let { gridX, gridY } = getGridPos(e);

		if (dragState == DRAG_STATES.MOVING_NOTE) {
			// moving note
			drawFG();
			drawNote(
				selectedNote.location + gridX - startGridX,
				gridY,
				selectedNote.duration,
				computedStyle.getPropertyValue("--yellow"),
				computedStyle.getPropertyValue("--yellow-accent"),
				false
			);
		} else {
			// changing note length
			drawFG();
			drawNote(
				selectedNote.location,
				startGridY,
				Math.max(
					stepLength,
					gridX - selectedNote.location + stepLength
				),
				computedStyle.getPropertyValue("--yellow"),
				computedStyle.getPropertyValue("--yellow-accent"),
				false
			);
		}
	}

	function handleMouseUp(e: MouseEvent) {
		e.preventDefault();

		if (dragState == DRAG_STATES.NOT_DRAGGING) return;

		if (!selectedNote) return;

		let { gridX, gridY } = getGridPos(e);

		if (dragState == DRAG_STATES.MOVING_NOTE) {
			// done moving note
			if (!(gridX == startGridX && gridY == startGridY)) {
				// check to make sure we're actually changing the note location
				let newNote = new Note({
					location: selectedNote.location + gridX - startGridX,
					velocity: selectedNote.velocity,
					duration: selectedNote.duration,
					pitch: gridY,
					instrument: selectedNote.instrument,
				});
				sequenceMap.set(
					newNote.getPitchLocation().serialize(),
					newNote
				);
				sequenceMap.delete(selectedNote.getPitchLocation().serialize());
				selectedNote = newNote;
			}
		} else {
			// done changing note length
			if (
				!(
					gridX == startGridX &&
					gridY == startGridY &&
					sequenceMap.has(`${startGridX},${startGridY}`)
				)
			) {
				// check to make sure we're actually changing the length
				let newNote = new Note({
					location: selectedNote.location,
					velocity: selectedNote.velocity,
					duration: Math.max(
						stepLength,
						gridX - selectedNote.location + stepLength
					),
					pitch: startGridY,
					instrument: new Instrument({ channel: 1, name: "Piano" }),
				});
				sequenceMap.set(
					selectedNote.getPitchLocation().serialize(),
					newNote
				);
				selectedNote = newNote;
			}
		}

		dragState = DRAG_STATES.NOT_DRAGGING;
		// selectedNote = null;

		drawFG();
	}

	function handleMouseOut(e: MouseEvent) {
		e.preventDefault();

		dragState = DRAG_STATES.NOT_DRAGGING;
		// selectedNote = null;

		drawFG();
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
	}

	return (
		<div style={{ position: "relative" }}>
			<canvas
				ref={bgRef}
				width={rollWidth}
				height={rollHeight}
				style={{
					position: "absolute",
					left: "0",
					top: "0",
					zIndex: "0",
					imageRendering: "pixelated",
					border: "solid",
					borderColor: "var(--bg4)",
					borderWidth: "2px",
				}}
			/>
			<canvas
				ref={fgRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseOut={handleMouseOut}
				onContextMenu={handleContextMenu}
				width={rollWidth}
				height={rollHeight}
				style={{
					position: "absolute",
					left: "0",
					top: "0",
					zIndex: "1",
					imageRendering: "pixelated",
					border: "solid",
					borderColor: "var(--bg3)",
					borderWidth: "2px",
				}}
			/>
		</div>
	);
}
