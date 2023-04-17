//JSON serialization code references these resources:
//https://dev.to/hansott/simple-way-to-serialize-objects-to-json-in-typescript-27f5
//https://www.xolv.io/blog/dev-notes/how-to-pass-a-class-to-a-function-in-typescript/

import { v4 as uuidv4 } from "uuid";
import { SharedMap } from "fluid-framework";
import { getRandomName } from "@fluidframework/server-services-client";
import { AzureClientProps } from "@fluidframework/azure-client";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import { SharedCounter } from "@fluidframework/counter";

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

	public getNoteKey() {
		return new NoteKey({
			pitch: this.pitch,
			location: this.location,
			instrument: this.instrument,
		});
	}
}

export class NoteKey extends Serializable {
	pitch: number;
	location: number;
	instrument: Instrument;

	constructor(args: {
		pitch: number;
		location: number;
		instrument: Instrument;
	}) {
		super();
		this.pitch = args.pitch;
		this.location = args.location;
		this.instrument = args.instrument;
	}
}

export const schema = {
	initialObjects: {
		metadata: SharedMap,
		sequence: SharedMap,
		syncPlaybackVotes: SharedCounter,
	},
} as const;

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
} as const;

export const instrumentColors = {
	Piano: { primary: "--yellow", accent: "--yellow-accent" },
	Guitar: { primary: "--green", accent: "--green-accent" },
	Bass: { primary: "--blue", accent: "--blue-accent" },
	Trumpet: { primary: "--red", accent: "--red-accent" },
	Synth_Drum: { primary: "--purple", accent: "--purple-accent" },
} as const;

export const useAzure = false;

export function generateUser() {
	const userConfig = {
		id: uuidv4(),
		name: getRandomName(),
	} as const;
	return userConfig;
}

export const user = generateUser();

export const connectionConfig: AzureClientProps = useAzure
	? ({
			connection: {
				tenantId: "c3172c50-a661-4db0-8a69-e03fb1a39f3b",
				tokenProvider: new InsecureTokenProvider(
					"043eecec8e88cffd7263ea50a6aa8240",
					user
				),
				type: "remote",
				endpoint: "https://us.fluidrelay.azure.com",
			},
	  } as const)
	: ({
			connection: {
				tokenProvider: new InsecureTokenProvider("fooBar", user),
				type: "local",
				endpoint: "http://localhost:7070",
			},
	  } as const);
