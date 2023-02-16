import { NumberLiteralType } from "typescript";

class Sequence {
    readonly id: String;
    length: Number = 0;
    bpm: Number = 120;
    timeSignature: {numerator: Number, denominator: Number};
    notes: Array<Note>;

    constructor (
        id: String,
        length: Number,
        bpm: Number,
        timeSignature: {numerator: Number, denominator: Number},
    ) {
        this.id = id;
        this.length = length;
        this.bpm = bpm;
        this.timeSignature = timeSignature;
        this.notes = new Array<Note>;
    }

    addNote(note: Note) {
        this.notes.push(note);
    }
}

class Note {
    pitch: Pitch;
    location: Number;
    instrument: Instrument;
    velocity: Number;
    duration: Number;

    constructor (
        pitch: Pitch,
        location: Number,
        instrument: Instrument,
        velocity: Number,
        duration: Number
    ) {
        this.pitch = pitch;
        this.location = location;
        this.instrument = instrument;
        this.velocity = velocity;
        this.duration = duration;
    }
}

class Pitch {
    height: Number;
    name: String;

    constructor (
        height: Number,
        name: String
    ) {
        this.height = height;
        this.name = name;
    }
}

class Instrument {
    channel: Number;
    name: String;

    constructor (
        channel: Number,
        name: String,
    ) {
        this.channel = channel;
        this.name = name;
    }
}

export{}