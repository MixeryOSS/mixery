import type { ToolObject } from "@/handling/ITool";
import type { ClippedNote } from "@mixery/engine";

export namespace internal {
    export class NoteObject implements ToolObject {
        constructor(public readonly unwrap: ClippedNote) {}
    
        get startPosition(): number { return this.unwrap.startAtUnit; }
        set startPosition(v: number) { this.unwrap.startAtUnit = v; }
    
        get duration(): number { return this.unwrap.durationUnit; }
        set duration(v: number) { this.unwrap.durationUnit = v; }
    
        get trackPosition(): number { return this.unwrap.midiIndex; }
        set trackPosition(v: number) { this.unwrap.midiIndex = v; }

        createCopy(): NoteObject {
            return new NoteObject(structuredClone(this.unwrap));
        }
    }
}