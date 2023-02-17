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
import {Sequence, Note, Instrument, Pitch} from "./types.js";

const schema = {
    initialObjects: {
        sequence: Sequence,
    },
    dynamicObjectTypes: [Note, Instrument, Pitch],
}

const {container, services} = await(client.createContainer(schema));

export {}