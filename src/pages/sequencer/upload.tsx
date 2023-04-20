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
import { useCallback, useRef } from "react";
import * as MidiFile from "midi-file";

export default function Home() {
	const router = useRouter();

	const uploadInput = useRef<HTMLInputElement>(null);

	const upload = useCallback(() => {
		const files = uploadInput.current?.files;
		if (files == null) {
			alert("Failed to upload file");
			return;
		}

		const file = files[0];

		const fileData = new Blob([file]);

		const fr = new FileReader();
		fr.onloadend = function () {
			console.log(fr.result);
			if (fr.result == null) {
				return;
			}

			const byteArr = new Uint8Array(fr.result as ArrayBuffer);
			const midiData = MidiFile.parseMidi(byteArr);
			console.log(midiData);

			const newSeq = new SequenceMetadata({
				id: "",
				length: 32,
				bpm: 120,
				numerator: 4,
				denominator: 4,
			});
			const notes = new Array<Note>();
		};

		fr.onerror = function (error) {
			console.log("Error: ", error);
		};

		fr.readAsArrayBuffer(fileData);
	}, []);

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

			if (container != null) {
				router.push(`/sequencer/${id}`);
			} else {
				router.push(`/`);
			}
		},
		[router]
	);

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
					<h2 style={{ margin: "0 0 24px 0" }}>Upload File</h2>
					<input
						type="file"
						accept="audio/midi"
						ref={uploadInput}
						style={{ textAlign: "center", margin: "auto" }}
						onChange={upload}
					></input>
				</div>
			</div>
		</>
	);
}
