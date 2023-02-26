/*
    TODO: totally redo this
    Top-level initialObjects:
        -sequence: SharedMap
            -Map of object properties
        -notes: SharedMap
            -Hashmap between instruments and group of notes
            -key: SharedString; JSON serialized form of Instrument
            -value: SharedMap; group of notes played in each instrument
                -Hashmap between pitch/location and note
                -key: pitch/location of note (only one note can occupy a given pitch and location at same time for one instrument)
                -value: JSON serialized form of Note object
*/


import {SequenceMetadata, Note, Instrument} from "./types.js";
import {SharedString} from "@fluidframework/sequence";
import {SharedMap} from "fluid-framework";
import {TinyliciousClient} from "@fluidframework/tinylicious-client"

const schema = {
    initialObjects: {
        metadata: SharedMap,
        sequence: SharedMap,
    },
    dynamicObjectTypes: [SharedString, SharedMap],
}


let client: TinyliciousClient = new TinyliciousClient();

const {container, services} = await(client.createContainer(schema));

const metadataContainer = container.initialObjects.metadata as SharedMap;
const sequenceContainer = container.initialObjects.sequence as SharedMap;

let localMetadata = new SequenceMetadata(); //local copy of properties for clients

metadataContainer.on("valueChanged", (changed) => {
    //TODO: this might not actually work, figure out if it does
    //it's really stupid even if it does
    //implicit casting from string to number is a bit sus amogus
    const args = Object.fromEntries(metadataContainer.entries());
    const clazz = SequenceMetadata as new(arg: any) => any;
    localMetadata = new clazz(args);
});

//TODO: finalize loading from mongodb
//Serverside only
export function loadMetadata(id: any) {
    metadataContainer.clear();
    if (true) {//case where there is an existing sequence for the id
        let sequenceArgs: any = Object.entries(localMetadata);
        //TODO
        //load metadata for sequence from mongodb and replace sequenceArgs
        localMetadata = new SequenceMetadata(sequenceArgs);
    }
    else {//case where we are creating new sequence

    }
}

export function setMetadata(key: string, value: number | string) {
    metadataContainer.set(key, value);
}

export function getMetadata(key: keyof SequenceMetadata) {
    return localMetadata[key];
}

export {}