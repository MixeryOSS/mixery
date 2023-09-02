import type { ToolObject } from "@/handling/ITool";
import type { ClippedNote, NotesClip } from "@mixery/engine";
import { toRaw } from "vue";

export namespace internal {
    export class NoteObject implements ToolObject {
        constructor(
            private readonly _selectedClip: NotesClip | undefined,
            public readonly unwrap: ClippedNote
        ) {}
    
        get startPosition(): number { return this.unwrap.startAtUnit; }
        set startPosition(v: number) { this.unwrap.startAtUnit = v; }
    
        get duration(): number { return this.unwrap.durationUnit; }
        set duration(v: number) { this.unwrap.durationUnit = v; }
    
        get trackPosition(): number { return this.unwrap.midiIndex; }
        set trackPosition(v: number) { this.unwrap.midiIndex = v; }

        createCopy(): NoteObject {
            const cloned = structuredClone(toRaw(this.unwrap));
            if (this._selectedClip) this._selectedClip.notes.push(cloned);
            return new NoteObject(this._selectedClip, cloned);
        }
    }
}