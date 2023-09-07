import { BaseWritableStream } from "@mixery/blobson";
import { Message, MessageFactory } from "./Message.js";
import { Identifier } from "../types.js";
import { Messages } from "./Messages.js";

export class NoteColorMessage implements Message {
    static readonly ID = "mixery:note_color";
    messageId: Identifier = NoteColorMessage.ID;

    constructor(
        public readonly channel: number,
        public readonly midiIndex: number,
        public readonly red: number,
        public readonly green: number,
        public readonly blue: number
    ) {}

    serialize(stream: BaseWritableStream): void {
        stream.writeInt(this.channel);
        stream.writeInt(this.midiIndex);
        stream.writeByte(this.red);
        stream.writeByte(this.green);
        stream.writeByte(this.blue);
    }

    static createFactory(): MessageFactory {
        return {
            messageId: NoteColorMessage.ID,
            async deserialize(stream) {
                const channel = await stream.readInt();
                const midiIndex = await stream.readInt();
                const red = await stream.readByte();
                const green = await stream.readByte();
                const blue = await stream.readByte();
                return new NoteColorMessage(channel, midiIndex, red, green, blue);
            },
        };
    }
}