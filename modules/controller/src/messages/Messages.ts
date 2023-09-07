import { ReadableWebStream, WritableBlobStream } from "@mixery/blobson";
import { Identifier } from "../types.js";
import { Message, MessageFactory } from "./Message.js";
import { NoteEventMessage } from "./NoteEventMessage.js";
import { NoteColorMessage } from "./NoteColorMessage.js";

export namespace Messages {
    const wellKnownStringToByte = new Map<Identifier, number>();
    const wellKnownByteToString = new Map<number, Identifier>();
    export const Factories = new Map<string, MessageFactory>();

    function addWellKnownMessageId(id: Identifier, value: number) {
        wellKnownStringToByte.set(id, value);
        wellKnownByteToString.set(value, id);
    }

    export function addFactory(factory: MessageFactory) {
        Factories.set(factory.messageId, factory);
    }

    // Well known messages
    addWellKnownMessageId(NoteEventMessage.ID, 0x00); addFactory(NoteEventMessage.createFactory());
    addWellKnownMessageId(NoteColorMessage.ID, 0x01); addFactory(NoteColorMessage.createFactory());

    export function pack(message: Message): Blob {
        const stream = new WritableBlobStream();
        const numericalId = wellKnownStringToByte.get(message.messageId);

        if (numericalId != undefined) {
            stream.writeString("");
            stream.writeInt(numericalId);
        } else {
            stream.writeString(message.messageId);
        }

        message.serialize(stream);
        return stream.toBlob();
    }

    export async function unpack(message: Blob): Promise<Message | undefined> {
        const stream = new ReadableWebStream(message.stream());
        let stringId = await stream.readString();

        if (stringId.length == 0) {
            const numericalId = await stream.readInt();
            stringId = wellKnownByteToString.get(numericalId);
        }

        if (!stringId) return undefined;

        const factory = Factories.get(stringId);
        if (!factory) return undefined;

        const deserialized = await factory.deserialize(stream);
        stream.reader.releaseLock();
        return deserialized;
    }
}