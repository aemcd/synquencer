//JSON serialization code references these resources:
//https://dev.to/hansott/simple-way-to-serialize-objects-to-json-in-typescript-27f5
//https://www.xolv.io/blog/dev-notes/how-to-pass-a-class-to-a-function-in-typescript/

export abstract class Serializable {
	serialize() {
		return JSON.stringify(Object.values(self));
	}
	static deserialize<A extends Serializable>(
		str: string,
		con: (...args: any) => A
	) {
		//second argument should be a constructor to a Serializable object
		type Struct = Parameters<typeof con>;
		const structArg: Struct = JSON.parse(str);
		return con(structArg);
	}
}

export class Sequence extends Serializable {
	id: String;
	length: number = 0;
	bpm: number = 120;
	timeSignature: { numerator: number; denominator: number };

	constructor(args: {
		id: String;
		length: number;
		bpm: number;
		timeSignature: { numerator: number; denominator: number };
	}) {
		super();
		this.id = args.id;
		this.length = args.length;
		this.bpm = args.bpm;
		this.timeSignature = args.timeSignature;
	}
	getLength() {
		return this.length;
	}
	setLength(length: number) {
		this.length = length;
	}

	getBPM() {
		return this.bpm;
	}
	setBPM(bpm: number) {
		this.bpm = bpm;
	}
}

export class Note extends Serializable {
	location: number;
	velocity: number;
	duration: number;
	pitch: number;

	constructor(args: {
		location: number;
		velocity: number;
		duration: number;
		pitch: number;
	}) {
		super();
		this.location = args.location;
		this.velocity = args.velocity;
		this.duration = args.duration;
		this.pitch = args.pitch;
	}
	getLocation() {
		return this.location;
	}
	setLocation(location: number) {
		if (location < 0) {
			this.location = 0;
			return;
			/*
		} else if (location > this.length) {
			this.location = this.length();
			return;
        */
		} else {
			this.location = location;
		}
	}
	getVelocity() {
		return this.velocity;
	}
	setVelocity(velocity: number) {
		if (velocity < 0) {
			this.velocity = 0;
			return;
		} else if (velocity > 127) {
			this.velocity = 127;
			return;
		}
		this.velocity = velocity;
	}
	public pitchName() {
		let pitchnumber: number = this.pitch % 12;
		let octavenumber: number = (this.pitch - pitchnumber) / 12;
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
	name: String;

	constructor(args: { channel: number; name: String }) {
		super();
		this.channel = args.channel;
		this.name = args.name;
	}
}

export {};
