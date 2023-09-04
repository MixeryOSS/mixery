import { BaseReadableStream, BaseWritableStream } from "@mixery/blobson";
import { Identifier } from "../types.js";

export interface Message {
    readonly messageId: Identifier;
    serialize(stream: BaseWritableStream): void;
}

export interface MessageFactory {
    readonly messageId: Identifier;
    deserialize(stream: BaseReadableStream): Promise<Message>;
}