/*
    TODO: totally redo this
    Top-level initialObjects:
        -sequence: SharedString
            -JSON serialized form of object that stores sequence metadata
        -notes: SharedMap
            -Hashmap between instruments and group of notes
            -key: SharedString; JSON serialized form of Instrument
            -value: SharedMap; group of notes played in each instrument
                -Hashmap between pitch/location and note
                -key: pitch/location of note (only one note can occupy a given pitch and location at same time for one instrument)
                -value: JSON serialized form of Note object
*/

/*
import {Sequence, Note, Instrument} from "./types.js";
import {SharedString, SharedMap} from "@fluidframework/sequence";

const schema = {
    initialObjects: {
        metadata: SharedString,
        sequence: SharedMap,
    },
    dynamicObjectTypes: [SharedString, SharedMap],
}

const {container, services} = await(client.createContainer(schema));
*/
export {}