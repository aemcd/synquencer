import React, {
	useEffect,
	useRef,
	useReducer,
	MouseEvent,
	useMemo,
	UIEventHandler,
	WheelEventHandler,
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
	sequenceMap: Map<string, Note>;
};

export default function PianoRoll({
	sequence,
	notes,
	stepLength,
	sequenceMap,
}: ContentPageProps) {
	let rollWidth = 767;
	let rollHeight = 575;

	let gridWidth = 24;
	let gridHeight = 24;

	// viewPos and viewPitch represent the note location
	// of the bottom-left of this canvas
	let viewLoc = 0;
	// 24 is C1
	let viewPitch = 24;

	let keyColors: boolean[] = [
		true,
		false,
		true,
		false,
		true,
		true,
		false,
		true,
		false,
		true,
		false,
		true,
	];

	const DRAG_STATES = {
		NOT_DRAGGING: 0,
		MOVING_NOTE: 1,
		CHANGING_LENGTH: 2,
	} as const;

	let dragState: number = DRAG_STATES.NOT_DRAGGING;
	let selectedNote: Note | null = null;
	let copiedNote: Note | null = null;
	let startGridX = -1;
	let startGridY = -1;

	const pianoRef = useRef<HTMLCanvasElement | null>(null);
	const bgRef = useRef<HTMLCanvasElement | null>(null);
	const fgRef = useRef<HTMLCanvasElement | null>(null);

	let computedStyle: CSSStyleDeclaration;
	let pianoCtx: CanvasRenderingContext2D | null;
	let bgCtx: CanvasRenderingContext2D | null;
	let fgCtx: CanvasRenderingContext2D | null;

	useEffect(() => {
		computedStyle = getComputedStyle(document.body);

		if (pianoRef.current) {
			pianoCtx = pianoRef.current.getContext("2d");
		}

		if (bgRef.current) {
			bgCtx = bgRef.current.getContext("2d");
		}

		if (fgRef.current) {
			fgCtx = fgRef.current.getContext("2d");
		}

		drawBG();
		drawFG();
		drawPiano();
	});

	useEffect(() => {
		if (sequenceMap != null && drawFG != null) {
			notes.forEach((note) => {
				sequenceMap.set(note.getPitchLocation().serialize(), note);
			});
			drawFG();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [notes]);

	function drawPiano() {
		if (!pianoCtx) return;

		pianoCtx.clearRect(0, 0, 64, rollHeight);

		// draw white keys
		pianoCtx.fillStyle = computedStyle.getPropertyValue("--piano-white");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			if (keyColors[(i + viewPitch) % 12]) {
				pianoCtx.fillRect(
					0,
					rollHeight - (i * gridHeight + gridHeight),
					64,
					gridHeight
				);
			}
		}

		// draw key lines
		pianoCtx.fillStyle = computedStyle.getPropertyValue("--bg3");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			pianoCtx.fillRect(0, gridHeight * (i + 1) - 1, 64, 2);
		}

		// draw C labels
		pianoCtx.font = "24px monospace";
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			if ((i + viewPitch) % 12 == 0) {
				let cLabel = `C${Math.floor((i + viewPitch) / 12) - 1}`;
				pianoCtx.fillText(cLabel, 2, rollHeight - (i * gridHeight + 3));
			}
		}

		/* fgCtx.fillStyle = computedStyle.getPropertyValue("--bg0");
		fgCtx.fillRect(0, 0, 200, 34);
		fgCtx.font = "24px monospace";
		fgCtx.fillStyle = computedStyle.getPropertyValue("--fg0");
		fgCtx.fillText(`Velocity: ${selectedNote.velocity}%`, 6, 24); */
	}

	function drawBG() {
		if (!bgCtx) return;

		// clear bg
		bgCtx.clearRect(0, 0, rollWidth, rollHeight);

		// color rows to match keys
		bgCtx.fillStyle = computedStyle.getPropertyValue("--bg1");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			if (keyColors[(i + viewPitch) % 12]) {
				bgCtx.fillRect(
					0,
					rollHeight - (i * gridHeight + gridHeight),
					rollWidth,
					gridHeight
				);
			}
		}

		bgCtx.lineWidth = 2;

		// horizontal grid lines
		bgCtx.fillStyle = computedStyle.getPropertyValue("--bg0");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			bgCtx.fillRect(0, gridHeight * (i + 1) - 1, rollWidth, 2);
		}

		// vertical grid lines
		for (let i = 0; i < rollWidth / gridWidth; i++) {
			(i + 1) % 4 == 0
				? (bgCtx.fillStyle = computedStyle.getPropertyValue("--bg3"))
				: (bgCtx.fillStyle = computedStyle.getPropertyValue("--bg0"));
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
		location: number,
		pitch: number,
		length: number,
		colorFill: string,
		colorOutline: string,
		highlighted: boolean
	) {
		if (length < 0) return;
		if (!fgCtx) return;

		fgCtx.fillStyle = colorFill;
		fgCtx.fillRect(
			(location - viewLoc) * gridWidth,
			rollHeight - ((pitch - viewPitch) * gridHeight + gridHeight) + 1,
			gridWidth * length,
			gridHeight
		);
		fgCtx.strokeStyle = colorOutline;
		fgCtx.lineWidth = 2;
		fgCtx.strokeRect(
			(location - viewLoc) * gridWidth,
			rollHeight - ((pitch - viewPitch) * gridHeight + gridHeight) + 1,
			gridWidth * length,
			gridHeight
		);
		fgCtx.fillStyle = colorOutline;
		fgCtx.fillRect(
			(location - viewLoc + length) * gridWidth - 6,
			rollHeight - ((pitch - viewPitch) * gridHeight + gridHeight) + 5,
			2,
			gridHeight - 8
		);

		if (highlighted) {
			fgCtx.strokeStyle = computedStyle.getPropertyValue("--fg0");
			fgCtx.strokeRect(
				(location - viewLoc) * gridWidth - 2,
				rollHeight -
					((pitch - viewPitch) * gridHeight + gridHeight) -
					1,
				gridWidth * length + 4,
				gridHeight + 4
			);
		}
	}

	function velocityAlert(velocity: number) {
		if (!fgCtx || !selectedNote) return;

		fgCtx.fillStyle = computedStyle.getPropertyValue("--bg0");
		fgCtx.fillRect(0, 0, 200, 34);
		fgCtx.font = "24px monospace";
		fgCtx.fillStyle = computedStyle.getPropertyValue("--fg0");
		fgCtx.fillText(`Velocity: ${selectedNote.velocity}%`, 6, 24);
	}

	function getGridPos(e: MouseEvent) {
		let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

		let pixelX = e.clientX - rect.left - 2;
		let pixelY = e.clientY - rect.top - 2;

		let isRightHalf = pixelX % gridWidth > gridWidth / 2;

		let location = viewLoc + Math.floor(pixelX / gridWidth);
		let pitch = viewPitch + Math.floor((rollHeight - pixelY) / gridHeight);

		return { location, pitch, isRightHalf };
	}

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();

		let { location, pitch, isRightHalf } = getGridPos(e);

		startGridX = location;
		startGridY = pitch;

		selectedNote = null;

		sequenceMap.forEach((value) => {
			if (
				pitch == value.pitch &&
				location >= value.location &&
				location < value.location + value.duration
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
					location == // @ts-ignore
						selectedNote.location + // @ts-ignore
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
		} else if (e.button == 1) {
			if (selectedNote) {
				copiedNote = selectedNote;
			} else if (copiedNote) {
				let newNote = new Note({
					location: startGridX,
					velocity: copiedNote.velocity,
					duration: copiedNote.duration,
					pitch: startGridY,
					instrument: new Instrument({ channel: 1, name: "Piano" }),
				});
				sequenceMap.set(
					newNote.getPitchLocation().serialize(),
					newNote
				);
				selectedNote = newNote;
				copiedNote = newNote;
				drawFG();
			}
		}
	}

	function handleMouseMove(e: MouseEvent) {
		e.preventDefault();

		if (dragState == DRAG_STATES.NOT_DRAGGING) return;

		if (!selectedNote) return;

		let { location, pitch } = getGridPos(e);

		if (dragState == DRAG_STATES.MOVING_NOTE) {
			// moving note
			drawFG();
			drawNote(
				selectedNote.location + location - startGridX,
				pitch,
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
					location - selectedNote.location + stepLength
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

		let { location, pitch } = getGridPos(e);

		if (dragState == DRAG_STATES.MOVING_NOTE) {
			// done moving note
			if (!(location == startGridX && pitch == startGridY)) {
				// check to make sure we're actually changing the note location
				let newNote = new Note({
					location: selectedNote.location + location - startGridX,
					velocity: selectedNote.velocity,
					duration: selectedNote.duration,
					pitch: pitch,
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
					location == startGridX &&
					pitch == startGridY &&
					sequenceMap.has(
						new PitchLocation({
							pitch: startGridY,
							location: startGridX,
						}).serialize()
					)
				)
			) {
				// check to make sure we're actually changing the length
				let newNote = new Note({
					location: selectedNote.location,
					velocity: selectedNote.velocity,
					duration: Math.max(
						stepLength,
						location - selectedNote.location + stepLength
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

	/* function handleWheel(e: any) {
		if (!selectedNote) return;

		if (e.deltaY > 0) {
			if (!(selectedNote.velocity - 10 < 0)) {
				let newNote = new Note({
					location: selectedNote.location,
					velocity: selectedNote.velocity - 10,
					duration: selectedNote.duration,
					pitch: selectedNote.pitch,
					instrument: selectedNote.instrument,
				});
				sequenceMap.set(
					newNote.getPitchLocation().serialize(),
					newNote
				);
				selectedNote = newNote;
			}
		} else if (e.deltaY < 0) {
			if (!(selectedNote.velocity + 10 > 100)) {
				let newNote = new Note({
					location: selectedNote.location,
					velocity: selectedNote.velocity + 10,
					duration: selectedNote.duration,
					pitch: selectedNote.pitch,
					instrument: selectedNote.instrument,
				});
				sequenceMap.set(
					newNote.getPitchLocation().serialize(),
					newNote
				);
				selectedNote = newNote;
			}
		}
		velocityAlert(selectedNote.velocity);
	} */

	function handleWheel(e: any) {
		if (e.deltaY > 0) {
			// scroll down
			if (!(viewPitch - 4 < 0)) {
				viewPitch -= 4;
				drawPiano();
				drawBG();
				drawFG();
			}
		} else if (e.deltaY < 0) {
			// scroll up
			if (!(viewPitch + 4 > 128 - rollHeight / gridHeight)) {
				viewPitch += 4;
				drawPiano();
				drawBG();
				drawFG();
			}
		}
	}

	return (
		<div aria-label="Piano Roll" style={{ position: "relative" }}>
			<canvas
				ref={pianoRef}
				width={"62px"}
				height={rollHeight}
				style={{
					position: "absolute",
					left: "0",
					top: "0",
					imageRendering: "pixelated",
					border: "solid",
					borderColor: "var(--bg3)",
					borderWidth: "2px",
					backgroundColor: "var(--black)",
				}}
			/>
			<canvas
				ref={bgRef}
				width={rollWidth}
				height={rollHeight}
				style={{
					position: "absolute",
					left: "64px",
					top: "0",
					zIndex: "0",
					imageRendering: "pixelated",
					border: "solid",
					borderColor: "var(--bg3)",
					borderWidth: "2px",
				}}
			/>
			<canvas
				aria-label="PianoRoll"
				tabIndex={0}
				ref={fgRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseOut={handleMouseOut}
				onContextMenu={handleContextMenu}
				onWheel={handleWheel}
				width={rollWidth}
				height={rollHeight}
				style={{
					position: "absolute",
					left: "64px",
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
