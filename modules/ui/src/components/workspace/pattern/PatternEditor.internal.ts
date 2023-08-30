import type { ToolObject } from "@/handling/ITool";
import type { Clip, PlaylistTrack } from "@mixery/engine";
import { toRaw } from "vue";

export namespace internal {
    export class ClipObject implements ToolObject {
        _trackPosition: PlaylistTrack | undefined;

        constructor(
            public readonly unwrap: Clip
        ) {}

        get startPosition() { return this.unwrap.startAtUnit; }
        set startPosition(v) { this.unwrap.startAtUnit = v; }

        get duration() { return this.unwrap.durationUnit; }
        set duration(v) { this.unwrap.durationUnit = v; }

        get trackPosition() { return this._trackPosition; }
        set trackPosition(v) {
            const raw = toRaw(this.unwrap);
            if (this._trackPosition) this._trackPosition.clips.splice(this._trackPosition.clips.indexOf(raw), 1);
            this._trackPosition = v;
            if (v) v.clips.push(raw);
        }

        createCopy(): ClipObject {
            const cloned = structuredClone(this.unwrap);
            const copy = new ClipObject(cloned);
            if (this._trackPosition) copy.trackPosition = this._trackPosition;
            return copy;
        }
    }
}