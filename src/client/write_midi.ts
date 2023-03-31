import {
	instrumentList,
	Note,
	PitchLocation,
	SequenceMetadata,
} from "@/server/types";
import MW from "midi-writer-js";
import Soundfont from "soundfont-player";

export let currentTick: number = -1;
let currentInterval: NodeJS.Timer;
const instruments: Map<string, Soundfont.Player> = new Map<
	string,
	Soundfont.Player
>();
export let isPlaying: boolean = false;

export function playNoteDefault(note: Note) {
	note.duration = 2;
	playNote(120, 4, note);
}

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

export function getTick() {
	return currentTick;
}

let tickFunction = () => {
	return;
};

export function setTickFunction(func: () => void) {
	tickFunction = func;
}

export function StopSequence() {
	clearInterval(currentInterval);
	currentTick = -1;
	isPlaying = false;
}

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
		Promise.all(
			instrumentIDs.map((id) => {
				const ac = new AudioContext();
				ac.destination.channelCount = 2;
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
	sequence: SequenceMetadata,
	notes: Map<string, Note>,
	instruments: Map<string, Soundfont.Player>
): any {
	if (currentTick > sequence.length) {
		clearInterval(intervalID);
		currentTick = -1;
		isPlaying = false;
		tickFunction();
		return;
	} else {
		const notesToPlay: Note[] = new Array<Note>();
		notes.forEach((mapNote) => {
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
						sequence.bpm,
						sequence.denominator,
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
function GetMidi(sequence: SequenceMetadata, notes: Array<Note>): Uint8Array {
	const track = new MW.Track();

	track.setTimeSignature(sequence.numerator, sequence.denominator);
	track.setTempo(sequence.bpm, 0);

	const events = new Array<MW.Event>();
	notes.forEach((note) => {
		events.push(
			new MW.NoteEvent({
				pitch: note.pitchName() as MW.Pitch,
				duration: `T${toTick(note.duration)}`,
				velocity: note.velocity,
				startTick: toTick(note.location),
				channel: note.instrument.channel,
			})
		);
	});
	track.addEvent(events);

	const writer = new MW.Writer(track);
	return writer.buildFile();
}

export function PlaySequence(
	sequence: SequenceMetadata,
	notes: Map<string, Note>
) {
	clearInterval(currentInterval);
	currentTick = 0;
	currentInterval = setIntervalWrapper(
		PlayTick,
		toSec(sequence.bpm, sequence.denominator, 1) * 1000,
		sequence,
		notes,
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
	// Create a blob with the data we want to download as a file
	const midi = new Blob([GetMidi(sequence, notes)], { type: "audio/midi" });
	const filename = "MIDI_Sequence.midi";

	// IE, new browsers second works
	if ((window.navigator as any).msSaveOrOpenBlob) {
		(window.navigator as any).msSaveOrOpenBlob(midi, filename);
	} else {
		const link = document.createElement("a");
		link.download = filename;
		link.style.display = "none";
		link.href = window.URL.createObjectURL(midi);
		link.addEventListener("click", (e) => {
			setTimeout(() => {
				URL.revokeObjectURL(link.href), 30 * 1000;
			});
		});

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}

function toTick(time: number) {
	return time * 32;
}

function toSec(bpm: number, denominator: number, time: number) {
	return (time * 60) / (bpm * denominator);
}
