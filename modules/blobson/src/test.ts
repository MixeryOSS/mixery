import { BaseReadableStream, BaseWritableStream } from "./streams/BaseStream.js";
import { ReadableWebStream } from "./streams/ReadableWebStream.js";
import { WritableBlobStream } from "./streams/WritableBlobStream.js";

let errors = 0;

function assert(expected: any, result: any) {
    if (expected != result) throw new Error(`Expected <${expected}> but <${result}> found!`);
}

function assertDeep(expected: any, result: any) {
    if (typeof expected != typeof result) throw new Error(`Expected <${typeof expected}> type but <${typeof result}> found!`);
    if (typeof expected == "object") {
        if (expected.constructor != result.constructor) throw new Error(`Expected <${expected.constructor.name}> type but <${result.constructor.name}> found!`);
        if (expected instanceof Array) {
            if (!expected.length != !result.length) throw new Error(`Expected array length ${expected.length} but ${result.length} found!`);
            expected.forEach((v, i) => assertDeep(v, result[i]));
        } else if (expected.constructor == Object) {
            const keys = Object.keys(expected);
            keys.forEach(key => assertDeep(expected[key], result[key]));
        } else if (expected.equals && expected.equals(result)) {
            throw new Error(`Expected <${expected}> but <${result}> found!`);
        }
    } else {
        return assert(expected, result);
    }
}

async function test(
    name: string,
    writePart: (stream: BaseWritableStream) => any,
    readPart: (stream: BaseReadableStream) => any
) {
    try {
        const writeStream = new WritableBlobStream();
        await writePart(writeStream);
        const readStream = new ReadableWebStream(writeStream.toBlob().stream());
        await readPart(readStream);
        console.log(`${name} -- PASSED`);
    } catch (e) {
        console.error(e);
        errors++;
        console.warn(`${name} -- FAILED`);
    }
}

// Test section
await test(
    "Serialize/Byte",
    async stream => stream.writeByte(123),
    async stream => assert(123, await stream.readByte())
);
await test(
    "Serialize/VarInt",
    async stream => stream.writeInt(123456),
    async stream => assert(123456, await stream.readInt())
);
await test(
    "Serialize/VarBigInt",
    async stream => stream.writeBigInt(12345638712831289371283721983789217389127389789312n),
    async stream => assert(12345638712831289371283721983789217389127389789312n, await stream.readBigInt())
);
await test(
    "Serialize/Number",
    async stream => stream.writeNumber(123456),
    async stream => assert(123456, await stream.readNumber())
);
await test(
    "Serialize/String",
    async stream => stream.writeString("The quick brown fox jumps over the lazy dog."),
    async stream => assert("The quick brown fox jumps over the lazy dog.", await stream.readString())
);

const testObj = {
    projectMetadata: {
        title: "Keep On Sparkling!",
        artists: []
    },
    bpm: 185,
    protection: {
        signature: {
            type: "ecdsa",
            s: 1239821372183289378912731n,
            d: 872381736127489573179127398712893n
        }
    },
    resources: {
        "/samples/kick.wav": {
            file: new Blob(["sample data here"], { type: "audio/wav" }),
            waveform: new Float32Array([0.123, 13.123, 71.12451, 1.41])
        }
    }
};
await test(
    "Serialize/Object",
    async stream => stream.writeObject(testObj),
    async stream => assertDeep(testObj, await stream.readObject())
);

console.log(`Errors/Failed Tests: ${errors}`);

// @ts-ignore
process.exit(errors);