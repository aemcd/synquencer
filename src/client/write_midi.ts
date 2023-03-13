import { Note, SequenceMetadata } from "@/server/types";
import MW from "midi-writer-js";
import MP from "midi-player-js";

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

export function PlayMidi(sequence: SequenceMetadata, notes: Array<Note>) {
	const player = new MP.Player((event: any) => {
		console.log(event);
	});
	player.loadArrayBuffer(GetMidi(sequence, notes));
	player.play();
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
