export interface NoteBase<TSignal extends string> {
    /**
     * Signal type. `instant` means the note is triggered at exact moment and the underlying system
     * should react to this immediately. `delayed` means the note is scheduled to play after a
     * specified time since the signal is received.
     */
    signalType: TSignal;

    /**
     * Node index according to MIDI specifications. Note A0 starts at index 21, while note C5 is
     * located at index 72. Notes from 0 to 20 can be used for drums.
     */
    midiIndex: number;

    /**
     * How strong the key is pressed.
     */
    velocity: number;
}

export interface NoteWithEvent<TSignal extends string> extends NoteBase<TSignal> {
    /**
     * The event type. `keydown` means the key is pressed and `keyup` means the key is released.
     * If the key is already down but `keydown` event is emitted, change the current key velocity
     * to new value.
     */
    eventType: "keydown" | "keyup";

    /**
     * Note unique ID. This ID is used for identifying which note from which device is pressed or
     * released.
     */
    uid: bigint;
}

export interface InstantNote extends NoteWithEvent<"instant"> {}
export interface DelayedNote extends NoteWithEvent<"delayed"> {
    /**
     * Note delay in milliseconds.
     */
    delayMs: number;
}

export type Note = InstantNote | DelayedNote;