export namespace UniqueID {
    let lastTimestamp = 0n;
    let currentSequence = 0n;

    /**
     * Generate a new global unique ID, using current system time and sequence index at that
     * time. This unique ID can be sorted in chronological order.
     * @returns The unique ID.
     */
    export function generate() {
        const timestamp = BigInt(Date.now());
        if (lastTimestamp != timestamp) {
            lastTimestamp = timestamp;
            currentSequence = 0n;
        }

        const sequence = currentSequence++;
        return (timestamp << 32n) | sequence;
    }

    /**
     * Extract timestamp and sequence ID from given global unique ID.
     * @param uid The unique ID.
     * @returns A pair of timestamp and sequence number at that time.
     */
    export function extract(uid: bigint): { timestamp: bigint, sequence: bigint } {
        const timestamp = (uid & 0xFFFFFFFFFFFFFFFF00000000n) >> 32n;
        const sequence = uid & 0x0000000000000000FFFFFFFFn;
        return { timestamp, sequence };
    }
}