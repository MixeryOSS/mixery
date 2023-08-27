export namespace MidiText {
    export const NOTES = [
        "C", "C#",
        "D", "D#",
        "E",
        "F", "F#",
        "G", "G#",
        "A", "A#",
        "B",
    ];
    export const NON_PIANO_NOTES = [
        "Unused"
    ];
    export const MIDI_A0 = 21;

    export function midiToNoteName(midi: number) {
        let noteIndex = midi - MIDI_A0;
        if (noteIndex < 0) return NON_PIANO_NOTES[midi % NON_PIANO_NOTES.length];
        noteIndex += 9;
        const octave = Math.floor(noteIndex / NOTES.length);
        const noteName = NOTES[noteIndex % NOTES.length];
        return `${noteName}${octave}`;
    }
}