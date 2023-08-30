import { BaseWritableStream } from "./BaseStream.js";

export class WritableBlobStream extends BaseWritableStream {
    parts: BlobPart[] = [];

    write(data: BlobPart): void {
        this.parts.push(data);
    }

    toBlob(options?: BlobPropertyBag) {
        return new Blob(this.parts, options);
    }
}