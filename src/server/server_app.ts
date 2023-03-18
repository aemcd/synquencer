import { GetNotes, GetSequence } from "@/database/calls";
import { SharedMap } from "fluid-framework";
import express from "express";

//TODO implement web server in express beyond just hello world

const app = express();
const port = 7200;

type sequenceEntry = {metadata: SharedMap, sequence: SharedMap};
let allSequences: Map<string, sequenceEntry> = new Map();

app.get("/", (req, res) => {
    res.send("Wazzup Beijing");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

export async function getSequenceEntry(id: string) : Promise<sequenceEntry> {
    let entry = allSequences.get(id);

    if (entry === undefined) {
        //TODO: full database code goes here
        const databaseMetadata = GetSequence(id);
        const databaseSequence = GetNotes(id);
    }

    return new Promise<sequenceEntry>(() => entry as sequenceEntry, );
}