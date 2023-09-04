import { BaseWritableStream } from "@mixery/blobson";
import { Message, MessageFactory } from "./Message.js";
import { Identifier } from "../types.js";

export enum NoteEventType {
    KEYDOWN = 0x00,
    KEYUP = 0x01,
}

export class NoteEventMessage implements Message {
    static readonly ID = "mixery:note_event";
    messageId: Identifier = NoteEventMessage.ID;
    
    constructor(
        public readonly eventType: NoteEventType,
        public readonly channel: number,
        public readonly midiIndex: number,
        public readonly velocity: number
    ) {}

    serialize(stream: BaseWritableStream): void {
        stream.writeByte(this.eventType);
        stream.writeInt(this.channel);
        stream.writeByte(Math.max(Math.min(this.midiIndex, 127), 0));
        stream.writeNumber(this.velocity);
    }

    static createFactory(): MessageFactory {
        return {
            messageId: NoteEventMessage.ID,
            async deserialize(stream) {
                const eventType: NoteEventType = await stream.readByte();
                const channel = await stream.readInt();
                const midiIndex = await stream.readByte();
                const velocity = await stream.readNumber();
                return new NoteEventMessage(eventType, channel, midiIndex, velocity);
            },
        };
    }
}