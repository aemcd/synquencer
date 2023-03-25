import { Note, PitchLocation, SequenceMetadata } from "@/server/types";
import { Arsenal } from "@next/font/google";
import MW from "midi-writer-js";
import Soundfont from "soundfont-player";
import { parseIsolatedEntityName } from "typescript";

function setIntervalWrapper(
	callback: any,
	time: number,
	...arg: any
): NodeJS.Timer {
	const args = Array.prototype.slice.call(arguments, 1);
	args[0] = setInterval(function () {
		callback.apply(null, args as []);
	}, time);
	return args[0];
}

function PlayTick(
	intervalID: NodeJS.Timer,
	sequence: SequenceMetadata,
	notes: Map<string, Note>,
	instruments: Map<string, Soundfont.Player>,
	curr_tick: { tick: number }
): any {
	console.log(arguments);
	if (curr_tick.tick > sequence.length) {
		clearInterval(intervalID);
	} else {
		console.log(`tick: ${curr_tick.tick}`);
		const notesToPlay: Note[] = new Array<Note>();
		notes.forEach((mapNote) => {
			if (mapNote.location === curr_tick.tick) {
				notesToPlay.push(mapNote);
			}
		});
		console.log(notesToPlay);

		notesToPlay.forEach((note) => {
			const instrument = instruments.get(note.instrument.name as string);
			if (instrument != undefined) {
				console.log(
					`gain: ${note.velocity / 100}, duration: ${toSec(
						sequence.bpm,
						sequence.denominator,
						note.duration
					)}`
				);
				//instrument.connect(new AudioContext().destination);

				instrument.play(note.pitchName(), undefined, {
					gain: note.velocity / 100,
					duration: toSec(
						sequence.bpm,
						sequence.denominator,
						note.duration
					),
				});
			}
		});
	}
	curr_tick.tick++;
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

	const events = new Array<MW.NoteEvent>();
	notes.forEach((note) => {
		events.push(
			new MW.NoteEvent({
				pitch: note.pitchName() as MW.Pitch,
				duration: `T${toTick(note.duration)}`,
				velocity: note.velocity,
				startTick: toTick(note.location),
			})
		);
	});
	track.addEvent(events);

	const writer = new MW.Writer(track);
	return writer.buildFile();
}

export async function PlaySequence(
	sequence: SequenceMetadata,
	notes: Array<Note>
) {
	const instrumentIDs: Soundfont.InstrumentName[] = ["acoustic_grand_piano"];
	const instrumentNames: string[] = ["Piano"];

	const playerInstruments = await Promise.all(
		instrumentIDs.map((id) => {
			const ac = new AudioContext();
			ac.destination.channelCount = 2;
			return Soundfont.instrument(ac, id);
		})
	);
	const instruments: Map<string, Soundfont.Player> = new Map<
		string,
		Soundfont.Player
	>();
	playerInstruments.forEach((player, index) => {
		instruments.set(instrumentNames[index], player);
	});
	const curr_tick = { tick: 0 };
	const intervalID = setIntervalWrapper(
		PlayTick,
		toSec(sequence.bpm, sequence.denominator, 1) * 1000,
		sequence,
		notes,
		instruments,
		curr_tick
	);
	return { intervalID, curr_tick };
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
