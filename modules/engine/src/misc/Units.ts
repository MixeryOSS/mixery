export namespace Units {
    export const BEAT = 96;

    export function unitsToMs(bpm: number, units: number) {
        return 60_000 * units / bpm / BEAT;
    }
}