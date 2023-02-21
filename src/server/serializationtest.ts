
class Serializable {
    serialize() {
        return JSON.stringify(Object.entries(this));
    }
    static deserialize<A extends Serializable>(str: string, clazz: new(arg: any) => A) {
        //second argument should be a class that extends Serializable
        const structArg = Object.fromEntries(JSON.parse(str));
        return new clazz(structArg);
    }
}

class Thing extends Serializable {
    a: number;
    b: string;
    c: string;

    constructor(args: {
        a: number,
        b: string,
        c: string
    }) {
        super();
        this.a = args.a;
        this.b = args.b;
        this.c = args.c;
    }
}

const arg = {a: 1869, b: "boiler", c: "up"};
console.log(arg);
const thing = new Thing(arg);
console.log(thing);
const serializedThing: string = thing.serialize();
console.log(serializedThing);
const deserializedString = JSON.parse(serializedThing);
console.log(deserializedString);
const otherThing = new Thing(Thing.deserialize(serializedThing, Thing));
console.log(otherThing);
