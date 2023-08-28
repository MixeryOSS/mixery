<script setup lang="ts">
import MixeryWindow from '../windows/MixeryWindow.vue';
import TitlebarButton from '../windows/TitlebarButton.vue';
import MixeryIcon from '../icons/MixeryIcon.vue';
import WindowToolsbar from '../windows/WindowToolsbar.vue';
import PatternTrack from "./pattern/PatternTrack.vue";
import FancyScrollbar from './universal/FancyScrollbar.vue';
import { Tools } from '@/handling/Tools';
import { computed, ref, unref, type ComponentInternalInstance, toRaw, watch, nextTick } from 'vue';
import { NoteClipNode, type Clip, type PlaylistTrack } from '@mixery/engine';
import type { ToolContext, ToolObject } from '@/handling/ITool';
import { Snapper } from '@/handling/Snapper';
import { MixeryUI } from '@/handling/MixeryUI';
import { RenderingHelper } from '@/canvas/RenderingHelper';

const props = defineProps<{
    visible: boolean,
    workspaceId: string,
    seekPointer: number,
    reactiveBpm: number
}>();
const emits = defineEmits(["update:visible", "clip-select", "update:seekPointer"]);

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }
function getProject() { return getWorkspace().project; }

function newTrack() {
    getProject().playlist.tracks.push({
        trackName: `Track ${getProject().playlist.tracks.length + 1}`,
        clips: [],
        trackHeight: 40,
        isMuted: false
    });

    // Not a good way to trigger updates
    scrollX.value += 1;
    scrollX.value -= 1;
}

const scrollX = ref(0); // TODO track time instead
const zoomX = ref(96); // 96px per beat (100%)
const trackLabelWidth = ref(100);

const seekPointer = computed({
    get() { return props.seekPointer; },
    set(v) { emits("update:seekPointer", v); }
});

const snap = ref(96 / 8);
const tools = Tools.LIST.map(v => v());
const selectedTool = ref(tools[0]);

class ClipObject implements ToolObject {
    _track?: PlaylistTrack;

    get startPosition(): number { return this.unwrap.startAtUnit; }
    set startPosition(v: number) {
        this.unwrap.startAtUnit = v;
        if (this._track) {
            seekPointer.value += 0.1;
            nextTick(() => seekPointer.value -= 0.1);
        }
    }

    get duration(): number { return this.unwrap.durationUnit; }
    set duration(v: number) { this.unwrap.durationUnit = v; }

    get trackPosition(): PlaylistTrack | undefined { return this._track; }
    set trackPosition(v: PlaylistTrack | undefined) {
        if (this._track) this._track.clips.splice(this._track.clips.indexOf(this.unwrap), 1);
        
        this._track = v;
        if (v) v.clips.push(toRaw(this.unwrap));
    }

    constructor(
        public readonly unwrap: Clip
    ) {}
}
const toolContext: ToolContext = {
    get snapSegmentSize() { return snap.value; },
    createObject() {
        const clipChannel = getWorkspace().selectedNode instanceof NoteClipNode
            ? (getWorkspace().selectedNode as NoteClipNode).data.channelName
            : getWorkspace().selectedClip.type == "notes"? getWorkspace().selectedClip.clipChannel
            : "Default Channel";

        const clip: Clip = { // TODO automation clips and audio clips
            type: "notes",
            notes: [],
            clipChannel,
            startAtUnit: 0,
            durationUnit: 0
        };
        getWorkspace().selectedClip = clip;
        return new ClipObject(clip);
    },
    deleteObject(obj) {
        const obj2 = obj as ClipObject;
        if (obj2._track) obj2._track.clips.splice(obj2._track.clips.indexOf(obj2.unwrap), 1);
    },
    hitTest(position, trackPosition) {
        let clip = (trackPosition as PlaylistTrack).clips.find(v => position >= v.startAtUnit && position < v.startAtUnit + v.durationUnit);

        if (clip) {
            let obj = new ClipObject(clip);
            obj._track = trackPosition;
            return obj;
        } else {
            return undefined;
        }
    },
    selectObject(obj) {
        getWorkspace().selectedClip = toRaw(obj.unwrap);
        seekPointer.value += 0.1;
        nextTick(() => seekPointer.value -= 0.1);
    },
};

function onCanvasMouseDown(track: PlaylistTrack, event: PointerEvent) {
    const position = Snapper.snap(event.offsetX / zoomX.value * 96 + scrollX.value, snap.value);
    selectedTool.value.onMouseDown(toolContext, event.buttons, position, track);
    getWorkspace().rendering.redrawRequest(
        RenderingHelper.Keys.PatternsEditor,
        RenderingHelper.Keys.SeekPointer
    );
}
function onCanvasMouseMove(track: PlaylistTrack, event: PointerEvent) {
    const position = Snapper.snap(event.offsetX / zoomX.value * 96 + scrollX.value, snap.value);
    selectedTool.value.onMouseMove(toolContext, event.buttons, position, track);
    getWorkspace().rendering.redrawRequest(
        RenderingHelper.Keys.PatternsEditor,
        RenderingHelper.Keys.SeekPointer
    );
}
function onCanvasMouseUp(track: PlaylistTrack, event: PointerEvent) {
    const position = Snapper.snap(event.offsetX / zoomX.value * 96 + scrollX.value, snap.value);
    selectedTool.value.onMouseUp(toolContext, event.buttons, position, track);
    getWorkspace().rendering.redrawRequest(
        RenderingHelper.Keys.PatternsEditor,
        RenderingHelper.Keys.SeekPointer
    );
}

watch(scrollX, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PatternsEditor));
watch(zoomX, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PatternsEditor));
</script>

<template>
    <MixeryWindow title="Patterns" :width="900" :height="500" resizable :visible="props.visible">
        <template v-slot:title-left>
            <TitlebarButton is-icon><MixeryIcon type="menu" /></TitlebarButton>
        </template>
        <template v-slot:title-right>
            <TitlebarButton @click="emits('update:visible', !props.visible)" is-icon><MixeryIcon type="close" /></TitlebarButton>
        </template>
        <template v-slot:toolsbars>
            <WindowToolsbar>
                <template v-for="tool in tools">
                    <TitlebarButton is-icon @click="selectedTool = tool" :highlight="selectedTool.toolName == tool.toolName" v-if="tool.icon">
                        <MixeryIcon :type="tool.icon as any" />
                    </TitlebarButton>
                    <TitlebarButton @click="selectedTool = tool" :highlight="selectedTool.toolName == tool.toolName" v-else>{{ tool.toolName }}</TitlebarButton>
                </template>
            </WindowToolsbar>
        </template>
        <div class="inner">
            <FancyScrollbar
                v-model:scroll-x="scrollX"
                v-model:zoom-x="zoomX"
                v-model:leftbar-width="trackLabelWidth"
                v-model:seek="seekPointer"
                :scrollbar-height="40"
                :units-count="96 * 4 * 16 /** Use maximum width */"
                :bpm="props.reactiveBpm"
            />
            <div class="tracks">
                <template v-for="(track, index) in getProject().playlist.tracks">
                    <PatternTrack
                        :workspace-id="props.workspaceId"
                        :editor-visible="props.visible"
                        :track-index="index"
                        :track-label-width="trackLabelWidth - 41"
                        :seek-pointer="seekPointer"
                        v-model:scroll-x="scrollX"
                        v-model:zoom-x="zoomX"
                        @canvas:pointerdown="onCanvasMouseDown(track, $event)"
                        @canvas:pointermove="onCanvasMouseMove(track, $event)"
                        @canvas:pointerup="onCanvasMouseUp(track, $event)"
                    ></PatternTrack>
                </template>
                <div class="new-track" @click="newTrack">
                    <MixeryIcon type="add" />
                    <div class="label">Add track</div>
                </div>
            </div>
        </div>
    </MixeryWindow>
</template>

<style scoped lang="scss">
.inner {
    display: flex;
    flex-direction: column;
    height: 100%;

    .tracks {
        flex: 1 1 auto;
        overflow-y: scroll;

        .new-track {
            display: flex;
            height: 25px;
            flex-direction: row;
            margin: 6px;
            padding: 6px;
            color: var(--color-accent);
            border-radius: 8px;

            .label {
                padding-left: 8px;
                display: inline-block;
                align-self: center;
                color: var(--color-text);
            }

            &:hover {
                background-color: #0000007f;
            }

            &:active {
                background-color: #0000009f;
            }
        }
    }
}
</style>