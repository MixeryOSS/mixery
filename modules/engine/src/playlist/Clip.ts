import { ResourcePath } from "../index.js";

export interface IClip<T extends string> {
    type: T;

    /**
     * The channel that this clip will emit note events or audio signals. This value must matches
     * with your input node.
     */
    clipChannel: string;

    /**
     * Time when this clip will be played in units. 96 units = 1 beat.
     */
    startAtUnit: number;

    /**
     * Duration of this clip in units. 96 units = 1 beat.
     */
    durationUnit: number;
}

export interface NotesClip extends IClip<"notes"> {
    /**
     * An array of notes that are belong to this clip. Note start time is relative to clip start
     * time (so the absolute start time of a note is `note.startAtUnit + clip.startAtUnit`).
     */
    notes: ClippedNote[];
}

export interface AudioClip extends IClip<"audio"> {
    /**
     * Path to resource. If the resource is not loaded, it will schedule a new loading task.
     */
    resource: ResourcePath;

    /**
     * Start time of the sample. `0` will play the start of the audio sample right at the start of
     * the clip.
     */
    audioStartAtUnit: number;

    /**
     * Sample stretch factor. `1` means the sample will be played at 1x speed.
     */
    stretchFactor: number;
}

export interface ClippedNote {
    noteColor?: `#${string}`;
    startAtUnit: number;
    durationUnit: number;
    midiIndex: number;
    velocity: number;
}

export type Clip = NotesClip | AudioClip;