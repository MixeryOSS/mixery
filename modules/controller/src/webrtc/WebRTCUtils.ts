import { WritableBlobStream } from "@mixery/blobson";

export namespace WebRTCUtils {
    export enum DescType {
        OFFER = 0x00,
        UNKNOWN = 0xFF,
    }

    export function packInit(desc: RTCSessionDescriptionInit): Blob {
        const stream = new WritableBlobStream();
        let descType: DescType;
        switch (desc.type) {
            case "offer": descType = DescType.OFFER; break;
            default: descType = DescType.UNKNOWN; break;
        }

        stream.writeByte(descType);
        if (descType == DescType.UNKNOWN) stream.writeString(desc.type);
        stream.writeString(desc.sdp ?? "");
        return stream.toBlob();
    }
}