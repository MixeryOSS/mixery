import { BaseReadableStream } from "./BaseStream.js";

export class ReadableWebStream extends BaseReadableStream {
    #reader: ReadableStreamDefaultReader<Uint8Array>;
    get reader() { return this.#reader; }

    #currentChunk: Uint8Array;
    #currentChunkPos = 0;

    constructor(readonly underlying: ReadableStream<Uint8Array>) {
        super();
        this.#reader = underlying.getReader();
    }

    async grabChunk() {
        if (!this.#reader) return true;
        if (this.#currentChunk && this.#currentChunkPos < this.#currentChunk.length) return false;
        
        const result = await this.#reader.read();
        if (result.done) {
            this.#reader.releaseLock();
            this.#reader = undefined;
            return true;
        }

        this.#currentChunk = result.value;
        this.#currentChunkPos = 0;
        return false;
    }

    async readByte(): Promise<number> {
        if (await this.grabChunk()) return -1;
        return this.#currentChunk[this.#currentChunkPos++];
    }

    async readBytes(length: number): Promise<Uint8Array> {
        if (await this.grabChunk()) return new Uint8Array();
        let bytesLeft = this.#currentChunk.length - this.#currentChunkPos;
        if (bytesLeft >= length) {
            const view = this.#currentChunk.subarray(this.#currentChunkPos, this.#currentChunkPos + length);
            this.#currentChunkPos += length;
            return view;
        }

        // Partial read
        let buf = new Uint8Array(length);
        let ptr = 0;
        while (ptr < length) {
            let bytesToConsume = Math.min(bytesLeft, length - ptr);
            let from = this.#currentChunk.subarray(this.#currentChunkPos, this.#currentChunkPos + bytesToConsume);
            buf.set(from, ptr);
            ptr += bytesToConsume;
            this.#currentChunkPos += bytesToConsume;
            if (ptr >= length) break;
            
            if (await this.grabChunk()) return buf.subarray(0, ptr);
            bytesLeft = this.#currentChunk.length - this.#currentChunkPos;
        }

        return buf;
    }
}