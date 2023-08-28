export namespace Units {
    export const BEAT = 96;

    export function unitsToMs(bpm: number, units: number) {
        return 60_000 * units / bpm / BEAT;
    }

    export function msToUnits(bpm: number, ms: number) {
        return ms * bpm * BEAT / 60_000;
    }
}