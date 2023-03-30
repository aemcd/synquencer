//JSON serialization code references these resources:
//https://dev.to/hansott/simple-way-to-serialize-objects-to-json-in-typescript-27f5
//https://www.xolv.io/blog/dev-notes/how-to-pass-a-class-to-a-function-in-typescript/

export abstract class Serializable {
	serialize() {
		return JSON.stringify(Object.entries(this));
	}
	static deserialize<A extends Serializable>(
		str: string,
		clazz: new (arg: any) => A
	) {
		//second argument should be a class that extends Serializable
		const structArg = Object.fromEntries(JSON.parse(str));
		return new clazz(structArg);
	}
}

//all constructors to anything that extends Serializable must have one argument only
//structured as a set of initial parameters
//Also don't nest objects inside other objects, it might work but I'm not counting on it
//At the level of fluid that should be handled through SharedMap anyways
export class SequenceMetadata extends Serializable {
	id: string = "";
	length: number = 0;
	bpm: number = 120;
	numerator: number = 4;
	denominator: number = 4;

	constructor(args?: {
		id: string;
		length: number | string;
		bpm: number | string;
		numerator: number | string;
		denominator: number | string;
	}) {
		super();
		//this.id = args.id;
		if (args) {
			this.id = args.id as string;
			this.length = args.length as number;
			this.bpm = args.bpm as number;
			this.numerator = args.numerator as number;
			this.denominator = args.denominator as number;
		}
	}
}

export class Note extends Serializable {
	location: number;
	velocity: number;
	duration: number;
	pitch: number;
	instrument: Instrument;

	constructor(args: {
		location: number;
		velocity: number;
		duration: number;
		pitch: number;
		instrument: Instrument;
	}) {
		super();
		this.location = args.location;
		this.velocity = args.velocity;
		this.duration = args.duration;
		this.pitch = args.pitch;
		this.instrument = args.instrument;
	}
	public pitchName() {
		let pitchnumber: number = this.pitch % 12;
		let octavenumber: number = (this.pitch - pitchnumber) / 12 - 1;
		let pitchName: string = "";
		switch (pitchnumber) {
			case 0:
				pitchName = "C";
				break;
			case 1:
				pitchName = "C#";
				break;
			case 2:
				pitchName = "D";
				break;
			case 3:
				pitchName = "D#";
				break;
			case 4:
				pitchName = "E";
				break;
			case 5:
				pitchName = "F";
				break;
			case 6:
				pitchName = "F#";
				break;
			case 7:
				pitchName = "G";
				break;
			case 8:
				pitchName = "G#";
				break;
			case 9:
				pitchName = "A";
				break;
			case 10:
				pitchName = "A#";
				break;
			case 11:
				pitchName = "B";
				break;
		}
		return `${pitchName}${octavenumber}`;
	}

	public getPitchLocation() {
		return new PitchLocation({
			pitch: this.pitch,
			location: this.location,
		});
	}
}

export class PitchLocation extends Serializable {
	pitch: number;
	location: number;

	constructor(args: { pitch: number; location: number }) {
		super();
		this.pitch = args.pitch;
		this.location = args.location;
	}
}

/*
export class Pitch {
    height: number;
    name: String;

    constructor (
        height: number,
        name: String
    ) {
        this.height = height;
        this.name = name;
    }
}
*/

export class Instrument extends Serializable {
	channel: number;
	name: string;

	constructor(args: { channel: number; name: string }) {
		super();
		this.channel = args.channel;
		this.name = args.name;
	}

	getChannel() {
		return this.channel;
	}
	setChannel(channel: number) {
		this.channel = channel;
	}
	getName() {
		return this.name;
	}
	setName(name: string) {
		this.name = name;
	}
}

export const instrumentList = {
	Piano: new Instrument({ channel: 1, name: "Piano" }),
	Guitar: new Instrument({ channel: 25, name: "Guitar" }),
	Bass: new Instrument({ channel: 33, name: "Bass" }),
	Trumpet: new Instrument({ channel: 57, name: "Trumpet" }),
	Synth_Drum: new Instrument({ channel: 119, name: "Synth Drum" }),
};

export {};
