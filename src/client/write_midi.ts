import {
	instrumentList,
	Note,
	NoteKey,
	SequenceMetadata,
} from "@/server/types";
import MW from "midi-writer-js";
import Soundfont from "soundfont-player";

export let currentTick: number = -1;
let currentInterval: NodeJS.Timer;
let doLoop = false;
let startTick = -1;
let endTick = -1;
let curNoteMap: Map<string, Note> = new Map<string, Note>();
let curSeq: SequenceMetadata = new SequenceMetadata();

const instruments: Map<string, Soundfont.Player> = new Map<
	string,
	Soundfont.Player
>();

export function setCurNoteMap(map: Map<string, Note>) {
	curNoteMap = map;
}

export function setCurSeq(seq: SequenceMetadata) {
	curSeq = seq;
}

/**
 * Create a loop section for playback
 * @param start Start tick of the loop
 * @param end End tick of the loop
 */
export function setLoop(start: number, end: number) {
	if (currentTick != -1) {
		currentTick = start;
	}
	startTick = start;
	endTick = end;
	doLoop = true;
}

/**
 * Clear a loop section
 */
export function clearLoop() {
	startTick = -1;
	endTick = -1;
	doLoop = false;
}

/**
 * Play a note for a duration of an eighth note at 120bpm
 * @param note The note to play
 */
export function playNoteDefault(note: Note) {
	const newNote = new Note(note);
	newNote.duration = 2;
	playNote(120, 4, newNote);
}

/**
 * Play a note
 * @param bpm BPM of the sequence
 * @param denominator Denominator of time signature
 * @param note The note to play
 */
export function playNote(bpm: number, denominator: number, note: Note) {
	getInstruments();
	const instrument = instruments.get(note.instrument.name as string);
	if (instrument != undefined) {
		instrument.play(note.pitchName(), undefined, {
			gain: note.velocity / 50,
			duration: toSec(bpm, denominator, note.duration),
		});
	}
}

/**
 * Get current tick
 * @returns Current tick in playback
 */
export function getTick() {
	return currentTick;
}

let tickFunction = () => {
	return;
};

/**
 * Set function to run every tick of playback
 * @param func The function
 */
export function setTickFunction(func: () => void) {
	tickFunction = func;
}

/**
 * Stops the currently playing sequence
 */
export function StopSequence() {
	clearInterval(currentInterval);
	currentTick = -1;
	tickFunction();
	instruments.forEach((player) => {
		player.stop();
	});
}

/**
 * Loads the instruments and returns them
 * @returns instrument list
 */
export function getInstruments() {
	const instrumentIDs: Soundfont.InstrumentName[] = [
		"acoustic_grand_piano",
		"acoustic_guitar_nylon",
		"acoustic_bass",
		"trumpet",
		"synth_drum",
	];
	const instrumentNames: string[] = [
		instrumentList.Piano.name,
		instrumentList.Guitar.name,
		instrumentList.Bass.name,
		instrumentList.Trumpet.name,
		instrumentList.Synth_Drum.name,
	];

	if (instruments.size == 0) {
		const ac = new AudioContext();
		Promise.all(
			instrumentIDs.map((id) => {
				return Soundfont.instrument(ac, id);
			})
		).then((playerInstruments) => {
			playerInstruments.forEach((player, index) => {
				instruments.set(instrumentNames[index], player);
			});
		});
	}

	return instruments;
}

function setIntervalWrapper(
	callback: any,
	time: number,
	...arg: any
): NodeJS.Timer {
	const args = Array.prototype.slice.call(arguments, 1);
	args[0] = undefined;
	callback.apply(null, args as []);
	args[0] = setInterval(function () {
		callback.apply(null, args as []);
	}, time);
	return args[0];
}

function PlayTick(
	intervalID: NodeJS.Timer | undefined,
	instruments: Map<string, Soundfont.Player>
): any {
	if (doLoop && currentTick > endTick) {
		currentTick = startTick;
	}
	if (currentTick >= curSeq.length && !doLoop) {
		clearInterval(intervalID);
		currentTick = -1;
		tickFunction();
		return;
	} else {
		const notesToPlay: Note[] = new Array<Note>();
		curNoteMap.forEach((mapNote) => {
			if (mapNote.location === currentTick) {
				notesToPlay.push(mapNote);
			}
		});

		tickFunction();

		notesToPlay.forEach((note) => {
			const instrument = instruments.get(note.instrument.name as string);
			if (instrument != undefined) {
				instrument.play(note.pitchName(), undefined, {
					gain: note.velocity / 50,
					duration: toSec(
						curSeq.bpm,
						curSeq.denominator,
						note.duration
					),
				});
			}
		});
	}
	currentTick++;
}

/**
 * Builds a MIDI file from a sequence and notes
 *
 * @param sequence The sequence
 * @param notes The notes of the sequence
 * @returns A midi file as Uint8Array
 */
function GetMidi(sequence: SequenceMetadata, notes: Array<Note>): string {
	const track = new MW.Track();

	track.setTimeSignature(sequence.numerator, sequence.denominator);
	track.setTempo(sequence.bpm, 0);

	notes.forEach((note) => {
		track.addEvent(
			new MW.NoteEvent({
				pitch: note.pitchName() as MW.Pitch,
				duration: `T${toTick(note.duration)}`,
				velocity: note.velocity,
				startTick: toTick(note.location),
				channel: note.instrument.channel,
			})
		);
	});

	const writer = new MW.Writer(track);
	return writer.dataUri();
}

export function PlaySequence() {
	clearInterval(currentInterval);
	currentTick = doLoop ? startTick : 0;
	currentInterval = setIntervalWrapper(
		PlayTick,
		toSec(curSeq.bpm, curSeq.denominator, 1) * 1000,
		getInstruments()
	);
}

/**
 * Builds a MIDI file from a sequence and notes and downloads it
 *
 * @param sequence The sequence
 * @param notes The notes of the sequence
 */
export function WriteMidi(
	sequence: SequenceMetadata,
	notes: Array<Note>
): void {
	const filename = "Synquence.midi";

	const link = document.createElement("a");
	link.download = filename;
	link.style.display = "none";
	link.href = GetMidi(sequence, notes);
	link.addEventListener("click", () => {
		setTimeout(() => {
			URL.revokeObjectURL(link.href);
		}, 30 * 1000);
	});

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function toTick(time: number) {
	return time * 32;
}

function toSec(bpm: number, denominator: number, time: number) {
	return (time * 60) / (bpm * denominator);
}
