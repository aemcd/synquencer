import { NumberLiteralType } from "typescript";

//JSON serialization code references these resources:
//https://dev.to/hansott/simple-way-to-serialize-objects-to-json-in-typescript-27f5
//https://www.xolv.io/blog/dev-notes/how-to-pass-a-class-to-a-function-in-typescript/

export abstract class Serializable {
    serialize() {
        return JSON.stringify(Object.values(self));
    }
    static deserialize<A extends Serializable>(str: string, con: (...args: any) => A) {
        //second argument should be a constructor to a Serializable object
        type Struct = Parameters<typeof con>;
        const structArg: Struct = JSON.parse(str);
        return con(structArg);
    }
}

export class Sequence extends Serializable{
    id: String;
    length: Number = 0;
    bpm: Number = 120;
    timeSignature: {numerator: Number, denominator: Number};
    
    constructor (args:
        {id: String,
        length: Number,
        bpm: Number,
        timeSignature: {numerator: Number, denominator: Number},},
    ) {
        super();
        this.id = args.id;
        this.length = args.length;
        this.bpm = args.bpm;
        this.timeSignature = args.timeSignature;
    }

}
/*
export class Note {
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

export class Pitch {
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
*/

export class Instrument extends Serializable{
    channel: Number;
    name: String;

    constructor (
        channel: Number,
        name: String,
    ) {
        super();
        this.channel = channel;
        this.name = name;
    }
}


export {}