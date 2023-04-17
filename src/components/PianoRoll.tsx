import React, {
	useEffect,
	useRef,
	useReducer,
	MouseEvent,
	useMemo,
	UIEventHandler,
	WheelEventHandler,
	useState,
	useCallback,
} from "react";
import { Instrument, Note, NoteKey, SequenceMetadata } from "@/server/types";
import { playNoteDefault } from "@/client/write_midi";

type ContentPageProps = {
	sequence: SequenceMetadata;
	stepLength: number;
	sequenceMap: Map<string, Note>;
	currentInstrument: {
		instrument: Instrument;
		primary: string;
		accent: string;
	};
	removeAndAddNote: (rmNote: Note, addNote: Note) => void;
	addNote: (note: Note) => void;
	removeNote: (note: Note) => void;
	tick: number;
};

let KEY_COLORS: boolean[] = [
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

const rollWidth = 767;
const rollHeight = 575;

const gridWidth = 24;
const gridHeight = 24;

export default function PianoRoll({
	sequence,
	stepLength,
	sequenceMap,
	currentInstrument,
	addNote,
	removeNote,
	removeAndAddNote,
	tick,
}: ContentPageProps) {
	// viewPos and view.current.pitch represent the note location
	// of the bottom-left of this canvas
	//let view.current.loc = 0;
	// 24 is C1
	//let view.current.pitch = 24;

	const dragState = useRef<number>(DRAG_STATES.NOT_DRAGGING);
	const lastMouseMove = useRef<MouseEvent | null>(null);

	let selectedNote: Note | null = null;
	let copiedNote: Note | null = null;
	let startGridX = -1;
	let startGridY = -1;

	const [view, setView] = useState({ loc: 0, pitch: 24 });

	const computedStyle = useRef<CSSStyleDeclaration | null>(null);

	const pianoRef = useRef<HTMLCanvasElement | null>(null);
	const bgRef = useRef<HTMLCanvasElement | null>(null);
	const fgRef = useRef<HTMLCanvasElement | null>(null);

	const pianoCtx = useRef<CanvasRenderingContext2D | null>(null);
	const bgCtx = useRef<CanvasRenderingContext2D | null>(null);
	const fgCtx = useRef<CanvasRenderingContext2D | null>(null);

	useEffect(() => {
		computedStyle.current = getComputedStyle(document.body);

		if (pianoRef.current) {
			pianoCtx.current = pianoRef.current.getContext("2d");
		}

		if (bgRef.current) {
			bgCtx.current = bgRef.current.getContext("2d");
		}

		if (fgRef.current) {
			fgCtx.current = fgRef.current.getContext("2d");
		}
	}, []);

	useEffect(() => {
		drawPiano();
		drawBG();
		drawFG();

		if (lastMouseMove.current) {
			handleMouseMove(lastMouseMove.current);
		}
	});

	useEffect(() => {
		if (sequenceMap != null && drawFG != null) {
			drawFG();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sequenceMap]);

	function drawPiano() {
		if (!pianoCtx.current || !computedStyle.current) {
			return;
		}

		pianoCtx.current.clearRect(0, 0, 72, rollHeight);

		// draw white keys
		pianoCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--piano-white");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			if (KEY_COLORS[(i + view.pitch) % 12]) {
				pianoCtx.current.fillRect(
					0,
					rollHeight - (i * gridHeight + gridHeight),
					72,
					gridHeight
				);
			}
		}

		// draw key lines
		pianoCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--piano-black");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			pianoCtx.current.fillRect(0, gridHeight * (i + 1) - 1, 72, 2);
		}

		// draw C labels
		pianoCtx.current.font = "24px monospace";
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			if ((i + view.pitch) % 12 == 0) {
				let cLabel = `C${Math.floor((i + view.pitch) / 12) - 1}`;
				pianoCtx.current.fillText(
					cLabel,
					2,
					rollHeight - (i * gridHeight + 3)
				);
			}
		}

		/* fgCtx.fillStyle = computedStyle.getPropertyValue("--bg0");
		fgCtx.fillRect(0, 0, 200, 34);
		fgCtx.font = "24px monospace";
		fgCtx.fillStyle = computedStyle.getPropertyValue("--fg0");
		fgCtx.fillText(`Velocity: ${selectedNote.velocity}%`, 6, 24); */
	}

	function drawBG() {
		if (!bgCtx.current || !computedStyle.current) return;

		// clear bg
		bgCtx.current.clearRect(0, 0, rollWidth, rollHeight);

		// color rows to match keys
		bgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--bg1");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			if (KEY_COLORS[(i + view.pitch) % 12]) {
				bgCtx.current.fillRect(
					0,
					rollHeight - (i * gridHeight + gridHeight),
					rollWidth,
					gridHeight
				);
			}
		}

		bgCtx.current.lineWidth = 2;

		// horizontal grid lines
		bgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--bg0");
		for (let i = 0; i < rollHeight / gridHeight; i++) {
			bgCtx.current.fillRect(0, gridHeight * (i + 1) - 1, rollWidth, 2);
		}

		// vertical grid lines
		for (let i = 0; i < rollWidth / gridWidth; i++) {
			if (
				(view.loc + i + 1) %
					((sequence.numerator * 16) / sequence.denominator) ==
				0
			) {
				bgCtx.current.fillStyle =
					computedStyle.current.getPropertyValue("--bg4");
			} else if ((view.loc + i + 1) % (16 / sequence.denominator) == 0) {
				bgCtx.current.fillStyle =
					computedStyle.current.getPropertyValue("--bg2");
			} else {
				bgCtx.current.fillStyle =
					computedStyle.current.getPropertyValue("--bg0");
			}
			if ((view.loc + i + 1) % stepLength == 0) {
				bgCtx.current.fillRect(
					gridWidth * (i + 1) - 1,
					0,
					2,
					rollHeight
				);
			}
		}

		// darken past the end of the sequence
		bgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--bg");
		bgCtx.current.fillRect(
			Math.max(0, 1 + gridWidth * (sequence.length - view.loc)),
			0,
			rollWidth,
			rollHeight
		);

		// draw playhead
		bgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--bg3");
		bgCtx.current.fillRect(
			(tick - view.loc) * gridWidth,
			0,
			gridWidth,
			rollHeight
		);
	}

	function drawFG() {
		if (!fgCtx.current || !computedStyle.current) return;

		fgCtx.current.clearRect(0, 0, rollWidth, rollHeight);

		sequenceMap.forEach((value) => {
			if (
				value != selectedNote &&
				value.instrument.name == currentInstrument.instrument.name
			) {
				drawNote(
					value.location,
					value.pitch,
					value.duration,
					// @ts-ignore
					computedStyle.current.getPropertyValue(
						currentInstrument.primary
					),
					// @ts-ignore
					computedStyle.current.getPropertyValue(
						currentInstrument.accent
					),
					false
				);
			}
		});

		if (
			selectedNote &&
			dragState.current == DRAG_STATES.NOT_DRAGGING &&
			selectedNote.instrument.name == currentInstrument.instrument.name
		) {
			drawNote(
				selectedNote.location,
				selectedNote.pitch,
				selectedNote.duration,
				computedStyle.current.getPropertyValue(
					currentInstrument.primary
				),
				computedStyle.current.getPropertyValue(
					currentInstrument.accent
				),
				true
			);
		}

		// draw location labels
		fgCtx.current.font = "24px monospace";
		fgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--bg4");
		for (let i = 0; i < rollWidth / gridWidth; i++) {
			if (
				(view.loc + i) %
					((sequence.numerator * 16) / sequence.denominator) ==
				0
			) {
				fgCtx.current.fillText(
					`${
						(view.loc + i) /
						((sequence.numerator * 16) / sequence.denominator)
					}`,
					i * gridWidth + 5,
					20
				);
			}
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
		if (!fgCtx.current || !computedStyle.current) return;

		fgCtx.current.fillStyle = colorFill;
		fgCtx.current.fillRect(
			(location - view.loc) * gridWidth,
			rollHeight - ((pitch - view.pitch) * gridHeight + gridHeight) + 1,
			gridWidth * length,
			gridHeight
		);
		fgCtx.current.strokeStyle = colorOutline;
		fgCtx.current.lineWidth = 2;
		fgCtx.current.strokeRect(
			(location - view.loc) * gridWidth,
			rollHeight - ((pitch - view.pitch) * gridHeight + gridHeight) + 1,
			gridWidth * length,
			gridHeight
		);
		fgCtx.current.fillStyle = colorOutline;
		fgCtx.current.fillRect(
			(location - view.loc + length) * gridWidth - 6,
			rollHeight - ((pitch - view.pitch) * gridHeight + gridHeight) + 5,
			2,
			gridHeight - 8
		);

		if (highlighted) {
			fgCtx.current.strokeStyle =
				computedStyle.current.getPropertyValue("--fg0");
			fgCtx.current.strokeRect(
				(location - view.loc) * gridWidth - 2,
				rollHeight -
					((pitch - view.pitch) * gridHeight + gridHeight) -
					1,
				gridWidth * length + 4,
				gridHeight + 4
			);
		}
	}

	function velocityAlert(velocity: number) {
		if (!fgCtx.current || !selectedNote || !computedStyle.current) return;

		fgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--bg0");
		fgCtx.current.fillRect(0, 0, 200, 34);
		fgCtx.current.font = "24px monospace";
		fgCtx.current.fillStyle =
			computedStyle.current.getPropertyValue("--fg0");
		fgCtx.current.fillText(`Velocity: ${selectedNote.velocity}%`, 6, 24);
	}

	function getGridPos(e: MouseEvent) {
		let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

		let pixelX = e.clientX - rect.left - 2;
		let pixelY = e.clientY - rect.top - 2;

		let isRightHalf = pixelX % gridWidth > gridWidth / 2;

		let location = view.loc + Math.floor(pixelX / gridWidth);
		let pitch = view.pitch + Math.floor((rollHeight - pixelY) / gridHeight);

		return { location, pitch, isRightHalf };
	}

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();

		if (!computedStyle.current) {
			return;
		}

		let { location, pitch, isRightHalf } = getGridPos(e);

		startGridX = location;
		startGridY = pitch;

		selectedNote = null;

		sequenceMap.forEach((value) => {
			if (
				value.instrument.name === currentInstrument.instrument.name &&
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
				removeNote(selectedNote);
				//sequenceMap.delete(selectedNote.getNoteKey().serialize());
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
					dragState.current = DRAG_STATES.CHANGING_LENGTH;
				} else {
					// another part of the note was clicked - start moving
					dragState.current = DRAG_STATES.MOVING_NOTE;
				}
			} else {
				// no note found; creating new note
				selectedNote = new Note({
					location: startGridX,
					velocity: 100,
					duration: stepLength,
					pitch: startGridY,
					instrument: currentInstrument.instrument,
				});
				dragState.current = DRAG_STATES.CHANGING_LENGTH;
				drawFG();
				drawNote(
					startGridX,
					startGridY,
					selectedNote.duration,
					computedStyle.current.getPropertyValue(
						currentInstrument.primary
					),
					computedStyle.current.getPropertyValue(
						currentInstrument.accent
					),
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
					instrument: currentInstrument.instrument,
				});
				addNote(newNote);
				//sequenceMap.set(newNote.getNoteKey().serialize(),newNote);
				selectedNote = newNote;
				copiedNote = newNote;
				drawFG();
			}
		}
	}

	function handleMouseMove(e: MouseEvent) {
		e.preventDefault();

		if (!computedStyle.current) {
			return;
		}

		(document.activeElement as HTMLElement).blur();

		if (dragState.current == DRAG_STATES.NOT_DRAGGING) return;

		if (!selectedNote) return;

		let { location, pitch } = getGridPos(e);

		if (dragState.current == DRAG_STATES.MOVING_NOTE) {
			// moving note
			drawFG();
			drawNote(
				selectedNote.location + location - startGridX,
				pitch,
				selectedNote.duration,
				computedStyle.current.getPropertyValue(
					currentInstrument.primary
				),
				computedStyle.current.getPropertyValue(
					currentInstrument.accent
				),
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
				computedStyle.current.getPropertyValue(
					currentInstrument.primary
				),
				computedStyle.current.getPropertyValue(
					currentInstrument.accent
				),
				false
			);
		}
	}

	function handleMouseUp(e: MouseEvent) {
		e.preventDefault();

		if (dragState.current == DRAG_STATES.NOT_DRAGGING) return;

		if (!selectedNote) return;

		let { location, pitch } = getGridPos(e);

		if (dragState.current == DRAG_STATES.MOVING_NOTE) {
			// done moving note
			if (!(location == startGridX && pitch == startGridY)) {
				// check to make sure we're actually changing the note location
				let newNote = new Note({
					location: selectedNote.location + location - startGridX,
					velocity: selectedNote.velocity,
					duration: selectedNote.duration,
					pitch: pitch,
					instrument: currentInstrument.instrument,
				});
				removeAndAddNote(selectedNote, newNote);
				//sequenceMap.set(newNote.getNoteKey().serialize(),newNote);
				//sequenceMap.delete(selectedNote.getNoteKey().serialize());
				selectedNote = newNote;
			}
		} else {
			// done changing note length
			if (
				!(
					location == startGridX &&
					pitch == startGridY &&
					sequenceMap.has(
						new NoteKey({
							pitch: startGridY,
							location: startGridX,
							instrument: currentInstrument.instrument,
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
					instrument: currentInstrument.instrument,
				});
				addNote(newNote);
				// sequenceMap.set(selectedNote.getNoteKey().serialize(),newNote);
				selectedNote = newNote;
			}
		}

		dragState.current = DRAG_STATES.NOT_DRAGGING;
		// selectedNote = null;

		drawFG();
	}

	function handleMouseOut(e: MouseEvent) {
		e.preventDefault();

		dragState.current = DRAG_STATES.NOT_DRAGGING;
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
					newNote.getNoteKey().serialize(),
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
					newNote.getNoteKey().serialize(),
					newNote
				);
				selectedNote = newNote;
			}
		}
		velocityAlert(selectedNote.velocity);
	} */

	function handleRollScroll(e: any) {
		if (e.deltaY > 0) {
			// scroll down
			setView({ ...view, loc: view.loc + 4 });
		} else if (e.deltaY < 0) {
			// scroll up
			if (!(view.loc - 4 < 0)) {
				setView({ ...view, loc: view.loc - 4 });
			}
		}
	}

	function handlePianoClick(e: MouseEvent) {
		e.preventDefault();

		(document.activeElement as HTMLElement).blur();

		let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

		let pixelY = e.clientY - rect.top - 2;

		let pitch = view.pitch + Math.floor((rollHeight - pixelY) / gridHeight);

		playNoteDefault(
			new Note({
				location: 0,
				velocity: selectedNote ? selectedNote.velocity : 100,
				duration: 0,
				pitch: pitch,
				instrument: currentInstrument.instrument,
			})
		);
	}

	function handlePianoScroll(e: any) {
		if (e.deltaY > 0) {
			// scroll down
			if (!(view.pitch - 4 < 0)) {
				setView({ ...view, pitch: view.pitch - 4 });
				drawPiano();
			}
		} else if (e.deltaY < 0) {
			// scroll up
			if (!(view.pitch + 4 > 128 - rollHeight / gridHeight)) {
				setView({ ...view, pitch: view.pitch + 4 });
				drawPiano();
			}
		}
	}

	return (
		<div aria-label="Piano Roll" style={{ position: "relative" }}>
			<canvas
				ref={pianoRef}
				width={"70px"}
				height={rollHeight}
				onMouseDown={handlePianoClick}
				onWheel={handlePianoScroll}
				onContextMenu={(e) => e.preventDefault()}
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
					left: "72px",
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
				onWheel={handleRollScroll}
				width={rollWidth}
				height={rollHeight}
				style={{
					position: "absolute",
					left: "72px",
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
