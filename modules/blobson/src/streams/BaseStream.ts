export enum ObjectTypes {
    UNDEFINED = 0x00, // <-- Likely why JS was hated by a lot of developers
    NULL = 0x01,
    NUMBER = 0x02,
    STRING = 0x03,
    BOOLEAN = 0x04,
    ARRAY = 0x05,
    OBJECT = 0x06,
    BIGINT = 0x07,
    BLOB = 0x08,
    BUFFER = 0x09,
    TYPED_ARRAY = 0x0A
}

export enum TypedArrayID {
    U8 = 0x00,
    S8 = 0x01,
    U16 = 0x02,
    S16 = 0x03,
    U32 = 0x04,
    S32 = 0x05,
    U64 = 0x06,
    S64 = 0x07,
    F32 = 0x08,
    F64 = 0x09
}

export type TypedArray =
    | Uint8Array | Int8Array | Uint16Array | Int16Array
    | Uint32Array | Int32Array | BigUint64Array | BigInt64Array
    | Float32Array | Float64Array;

export abstract class BaseStream {
}

export abstract class BaseWritableStream extends BaseStream {
    abstract write(data: BlobPart): void;

    writeByte(v: number) { this.write(new Uint8Array([v])); }
    writeNumber(v: number) { this.write(new Float64Array([v])); }

    writeInt(v: number) {
        let buf: number[] = [];
        let b: number;
        do {
            b = v & 0x7F;
            v >>= 7;
            if (v > 0) b |= 0x80;
            buf.push(b);
        } while (v != 0);
        this.write(new Uint8Array(buf));
    }

    writeBigInt(v: bigint) {
        let buf: number[] = [];
        let b: bigint;
        do {
            b = v & 0x7Fn;
            v >>= 7n;
            if (v > 0) b |= 0x80n;
            buf.push(Number(b));
        } while (v != 0n);
        this.write(new Uint8Array(buf));
    }

    writeString(v: string) {
        const buf = new TextEncoder().encode(v);
        this.writeInt(buf.length);
        this.write(buf);
    }

    writeBlob(v: Blob) {
        this.writeString(v.type);
        this.writeInt(v.size);
        this.write(v);
    }

    writeBuffer(v: ArrayBuffer) {
        this.writeInt(v.byteLength);
        this.write(v);
    }

    writeTypedArray(v: TypedArray) {
        let type: TypedArrayID;
        if (v instanceof Uint8Array) type = TypedArrayID.U8;
        else if (v instanceof Int8Array) type = TypedArrayID.S8;
        else if (v instanceof Uint16Array) type = TypedArrayID.U16;
        else if (v instanceof Int16Array) type = TypedArrayID.S16;
        else if (v instanceof Uint32Array) type = TypedArrayID.U32;
        else if (v instanceof Int32Array) type = TypedArrayID.S32;
        else if (v instanceof BigUint64Array) type = TypedArrayID.U64;
        else if (v instanceof BigInt64Array) type = TypedArrayID.S64;
        else if (v instanceof Float32Array) type = TypedArrayID.F32;
        else if (v instanceof Float64Array) type = TypedArrayID.F64;
        else throw new Error(`Unknown typed array: ${(v as any).constructor.name}`);

        this.writeByte(type);
        this.writeInt(v.length);
        this.write(v);
    }

    writeObject(obj: any) {
        let type: ObjectTypes;
        switch (typeof obj) {
            case "undefined": type = ObjectTypes.UNDEFINED; break;
            case "number": type = ObjectTypes.NUMBER; break;
            case "string": type = ObjectTypes.STRING; break;
            case "boolean": type = ObjectTypes.BOOLEAN; break;
            case "bigint": type = ObjectTypes.BIGINT; break;
            case "object":
                if (obj == null) type = ObjectTypes.NULL;
                else if (obj instanceof Array) type = ObjectTypes.ARRAY;
                else if (obj.constructor == Object) type = ObjectTypes.OBJECT;
                else if (obj instanceof Blob) type = ObjectTypes.BLOB;
                else if ((obj as TypedArray).buffer) type = ObjectTypes.TYPED_ARRAY;
                else throw new Error(`Unable to serialize object -> ${obj.constructor.name}`);
                break;
            default: throw new Error(`Unable to serialize ${typeof obj} type`);
        }
        this.writeByte(type);
        if (obj == null || typeof obj == "undefined") return;

        // Simple stuffs
        switch (typeof obj) {
            case "number": return this.writeNumber(obj);
            case "string": return this.writeString(obj);
            case "boolean": return this.writeByte(obj? 1 : 0);
            case "bigint": return this.writeBigInt(obj);
            case "object": break;
            default: throw new Error(`Unable to serialize ${typeof obj} type`);
        }

        // Complex object
        switch (type) {
            case ObjectTypes.ARRAY:
                this.writeInt((obj as any[]).length);
                (obj as any[]).forEach(v => this.writeObject(v));
                return;
            case ObjectTypes.OBJECT:
                const keys = Object.keys(obj);
                this.writeInt(keys.length);
                keys.forEach(key => {
                    this.writeString(key);
                    this.writeObject(obj[key]);
                });
                return;
            case ObjectTypes.BLOB: return this.writeBlob(obj);
            case ObjectTypes.TYPED_ARRAY: return this.writeTypedArray(obj);
            default: throw new Error(`Unable to serialize object -> ${obj.constructor.name}`);
        }
    }
}

export abstract class BaseReadableStream extends BaseStream {
    abstract readByte(): Promise<number>;

    async readBytes(length: number): Promise<Uint8Array> {
        let raw = new Uint8Array(length);
        let b: number;

        for (let i = 0; i < length; i++) {
            b = await this.readByte();
            if (b == -1) return raw.subarray(0, i);
            raw[i] = b;
        }

        return raw;
    }

    async readNumber(): Promise<number> {
        const buf = await this.readBytes(8);
        return new DataView(buf.buffer, buf.byteOffset, 8).getFloat64(0, true);
    }

    async readInt(): Promise<number> {
        let v = 0, shift = 0;
        let b: number;
        do {
            b = await this.readByte();
            v |= (b & 0x7F) << shift;
            shift += 7;
        } while (b & 0x80);
        return v;
    }

    async readBigInt(): Promise<bigint> {
        let v = 0n, shift = 0n;
        let b: number;
        do {
            b = await this.readByte();
            v |= BigInt(b & 0x7F) << shift;
            shift += 7n;
        } while (b & 0x80);
        return v;
    }

    async readString(): Promise<string> {
        let length = await this.readInt();
        return new TextDecoder().decode(await this.readBytes(length));
    }

    async readBlob(): Promise<Blob> {
        const type = await this.readString();
        const size = await this.readInt();
        return new Blob([await this.readBytes(size)], { type: type });
    }

    async readTypedArray(): Promise<TypedArray> {
        const type: TypedArrayID = await this.readByte();
        const length = await this.readInt();
        if (type == TypedArrayID.U8) return await this.readBytes(length);
        else if (type == TypedArrayID.S8) {
            const buf = await this.readBytes(length);
            return new Int8Array(buf.buffer, buf.byteOffset, length);
        }
        
        let size: number;
        switch (type) {
            case TypedArrayID.U16:
            case TypedArrayID.S16: size = 2; break;
            case TypedArrayID.F32:
            case TypedArrayID.U32:
            case TypedArrayID.S32: size = 4; break;
            case TypedArrayID.F64:
            case TypedArrayID.U64:
            case TypedArrayID.S64: size = 8; break;
            default: throw new Error(`Unknown typed array ID ${type}`);
        }

        const buf = await this.readBytes(length * size);
        if ((buf.byteOffset % size) == 0) {
            switch (type) {
                case TypedArrayID.U16: return new Uint16Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.S16: return new Int16Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.U32: return new Uint32Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.S32: return new Int32Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.U64: return new BigUint64Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.S64: return new BigInt64Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.F32: return new Float32Array(buf.buffer, buf.byteOffset, length);
                case TypedArrayID.F64: return new Float64Array(buf.buffer, buf.byteOffset, length);
            }
        }

        // Misaligned - copy to new buffer and construct from it
        const newBuf = new ArrayBuffer(length * size);
        const newBufView = new Uint8Array(newBuf);
        newBufView.set(buf);

        switch (type) {
            case TypedArrayID.U16: return new Uint16Array(newBuf);
            case TypedArrayID.S16: return new Int16Array(newBuf);
            case TypedArrayID.U32: return new Uint32Array(newBuf);
            case TypedArrayID.S32: return new Int32Array(newBuf);
            case TypedArrayID.U64: return new BigUint64Array(newBuf);
            case TypedArrayID.S64: return new BigInt64Array(newBuf);
            case TypedArrayID.F32: return new Float32Array(newBuf);
            case TypedArrayID.F64: return new Float64Array(newBuf);
        }
    }

    async readObject(): Promise<any> {
        const type: ObjectTypes = await this.readByte();
        switch (type) {
            case ObjectTypes.UNDEFINED: return undefined;
            case ObjectTypes.NULL: return null;
            case ObjectTypes.NUMBER: return await this.readNumber();
            case ObjectTypes.STRING: return await this.readString();
            case ObjectTypes.BOOLEAN: return await this.readByte() != 0;
            case ObjectTypes.BIGINT: return await this.readBigInt();
            case ObjectTypes.ARRAY:
                const arrLength = await this.readInt();
                const out: any[] = [];
                for (let i = 0; i < arrLength; i++) out.push(await this.readObject());
                return out;
            case ObjectTypes.OBJECT:
                const keysCount = await this.readInt();
                const obj = {};
                for (let i = 0; i < keysCount; i++) {
                    const key = await this.readString();
                    const child = await this.readObject();
                    obj[key] = child;
                }
                return obj;
            case ObjectTypes.BLOB: return await this.readBlob();
            case ObjectTypes.TYPED_ARRAY: return await this.readTypedArray();
            default: throw new Error(`Unknown type ID ${type}`);
        }
    }
}