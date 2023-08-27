export namespace Temperaments {
    export interface Temperament {
        getFrequency(midi: number, a4Index: number, a4Freq: number): number;
    }

    export const EQUAL: Temperament = {
        getFrequency(midi, a4Index, a4Freq) { return Math.pow(2, (midi - a4Index) / 12) * a4Freq; },
    };
}