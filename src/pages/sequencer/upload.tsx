import Head from "next/head";
import {
	Note,
	SequenceMetadata,
	connectionConfig,
	instrumentList,
	schema,
} from "@/server/types";
import { useRouter } from "next/router";
import { SharedMap } from "fluid-framework";
import { AzureClient } from "@fluidframework/azure-client";
import { useCallback, useRef, useState } from "react";
import * as MidiFile from "midi-file";

export default function Home() {
	const router = useRouter();

	const [loadingState, setLoadingState] = useState<boolean>(false);
	const uploadInput = useRef<HTMLInputElement>(null);

	const create = useCallback(
		async (newSeq: SequenceMetadata, notes: Array<Note>) => {
			const client: AzureClient = new AzureClient(connectionConfig);
			const { container, services } = await client.createContainer(
				schema
			);
			const id = await container.attach();
			newSeq.id = id;
			const metadata = container.initialObjects.metadata as SharedMap;
			const noteMap = container.initialObjects.sequence as SharedMap;
			metadata.set("id", id);
			metadata.set("length", newSeq.length);
			metadata.set("bpm", newSeq.bpm);
			metadata.set("numerator", newSeq.numerator);
			metadata.set("denominator", newSeq.denominator);

			for (let n of notes) {
				noteMap.set(n.getNoteKey().serialize(), n);
			}

			container.once("saved", () => {
				container.dispose();
				router.push(`/sequencer/${id}`);
			});

			if (container == null) {
				router.push(`/`);
			}
		},
		[router]
	);

	const upload = useCallback(() => {
		setLoadingState(true);
		const files = uploadInput.current?.files;
		if (files == null) {
			alert("Failed to upload file");
			setLoadingState(false);
			return;
		}

		const file = files[0];

		const fileData = new Blob([file]);

		const fr = new FileReader();
		fr.onloadend = function () {
			if (fr.result == null) {
				setLoadingState(true);
				return;
			}

			const byteArr = new Uint8Array(fr.result as ArrayBuffer);
			const midiData = MidiFile.parseMidi(byteArr);
			const tPerBeat =
				midiData.header.ticksPerBeat != null
					? midiData.header.ticksPerBeat
					: 128;

			console.log(midiData);
			let newSeq = new SequenceMetadata({
				id: "",
				length: 32,
				bpm: 120,
				numerator: 4,
				denominator: 4,
			});
			const notes = new Array<Note>();

			let currentTime = 0;
			let unfinishedNotes = new Array<UnfinishedNote>();
			for (let i = 0; i < midiData.tracks[0].length; i++) {
				let event = midiData.tracks[0][i];
				currentTime += event.deltaTime;
				if (event.type === "timeSignature") {
					newSeq.numerator = event.numerator;
					newSeq.denominator = event.denominator;
				}

				if (event.type === "setTempo") {
					newSeq.bpm = Math.round(
						(60 * 1000000) / event.microsecondsPerBeat
					);
				}

				if (event.type === "noteOn") {
					unfinishedNotes.push({
						start: currentTime,
						pitch: event.noteNumber,
						velocity: event.velocity,
						channel: event.channel,
					});
				}

				if (event.type === "noteOff") {
					let un: UnfinishedNote | null = null;
					for (let j = 0; j < unfinishedNotes.length; j++) {
						let uNote = unfinishedNotes[j];
						if (
							event.channel === uNote.channel &&
							event.noteNumber === uNote.pitch
						) {
							un = {
								pitch: uNote.pitch,
								velocity: uNote.velocity,
								channel: uNote.channel,
								start: uNote.start,
							};
							unfinishedNotes.splice(j, 1);
							break;
						}
					}
					console.log(un);

					if (un != null) {
						let newNote = new Note({
							location: toBeat(un.start, tPerBeat),
							velocity: Math.round((un.velocity * 100) / 127),
							duration: toBeat(currentTime - un.start, tPerBeat),
							pitch: un.pitch,
							instrument: instrumentList.Piano,
						});
						for (let inst of Object.values(instrumentList)) {
							if (un.channel === inst.channel) {
								newNote.instrument = inst;
							}
						}

						notes.push(newNote);
					}
				}

				if (event.type === "endOfTrack") {
					if (toBeat(currentTime, tPerBeat) > newSeq.length) {
						newSeq.length = toBeat(currentTime, tPerBeat);
					}
				}
			}

			create(newSeq, notes);
		};

		fr.onerror = function (error) {
			console.log("Error: ", error);
		};

		fr.readAsArrayBuffer(fileData);
	}, [create]);

	return (
		<>
			<Head>
				<title>Sequencer</title>
				<meta name="description" content="Synquencer" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div
				style={{
					display: "flex",
					flexFlow: "row nowrap",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
				}}
			>
				<div
					style={{
						textAlign: "center",
					}}
				>
					{loadingState ? (
						<h2 style={{ margin: "0 0 24px 0" }}>Uploading...</h2>
					) : (
						<h2 style={{ margin: "0 0 24px 0" }}>Upload File</h2>
					)}
					{loadingState ? null : (
						<input
							type="file"
							accept="audio/midi"
							ref={uploadInput}
							style={{ textAlign: "center", margin: "auto" }}
							onChange={upload}
						></input>
					)}
				</div>
			</div>
		</>
	);
}

function toBeat(tick: number, ticksPerBeat: number) {
	return Math.round(tick / (ticksPerBeat / 4));
}

type UnfinishedNote = {
	start: number;
	pitch: number;
	velocity: number;
	channel: number;
};
