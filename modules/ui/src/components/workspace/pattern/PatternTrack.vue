<script setup lang="ts">
import { CanvasRenderer } from '@/canvas/CanvasRenderer';
import { RenderingHelper } from '@/canvas/RenderingHelper';
import { MixeryUI } from '@/handling/MixeryUI';
import type { ClippedNote, PlaylistTrack } from '@mixery/engine';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
    editorVisible: boolean,
    workspaceId: string,
    trackIndex: number,
    scrollX: number,
    zoomX: number,
    trackLabelWidth: number,
    seekPointer: number,
}>();
const emits = defineEmits([
    "update:scrollX", "update:zoomX",
    "canvas:pointerdown", "canvas:pointerup", "canvas:pointermove"
]);

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }
function getTrack() { return MixeryUI.workspaces.get(props.workspaceId)!.project.playlist.tracks[props.trackIndex]; }

const zoomX = computed({
    get() { return props.zoomX; },
    set(v) { emits("update:zoomX", v); }
});
const scrollX = computed({
    get() { return props.scrollX; },
    set(v) { emits("update:scrollX", v); }
});

const canvas = ref<HTMLCanvasElement>();
const canvasRenderer = ref<CanvasRenderer>();

onMounted(() => {
    const renderer = new CanvasRenderer(canvas.value!, render);
    canvasRenderer.value = renderer;
    renderer.useObserveResize();
    getWorkspace().rendering.registerCallback([
        RenderingHelper.Keys.All,
        RenderingHelper.Keys.PatternsEditor,
        RenderingHelper.Keys.SeekPointer
    ], () => render());

    const gridColor = ["#ffffff1f", "#ffffff2f"];
    const normalOutline = "#0000007f";
    const selectedOutline = "#ffffff";

    function render() {
        if (!props.editorVisible) return;
        if (!canvas.value) return;
        renderer.startRender();
        const accent = window.getComputedStyle(canvas.value!).getPropertyValue("--color-accent");
        const beatsPerScreen = Math.ceil(canvas.value!.offsetWidth / props.zoomX) + 1;
        const firstBeatOffset = props.scrollX % 96;
        const seekX = (props.seekPointer - props.scrollX) * props.zoomX / 96;

        renderer.fillRect(seekX - 1, 0, 2, canvas.value!.offsetHeight, accent);

        for (let i = 0; i < beatsPerScreen; i++) {
            const beatX = i * props.zoomX - firstBeatOffset * props.zoomX / 96;
            const beatIndex = i + Math.floor(props.scrollX / 96);
            const lineWidth = beatIndex % 4 == 0? 4 : 2;
            const gCol = gridColor[beatIndex % 4 == 0? 1 : 0];
            renderer.fillRect(beatX - lineWidth / 2, 0, lineWidth, canvas.value!.offsetHeight, gCol);
        }

        getTrack().clips.forEach(clip => {
            let clipX = (clip.startAtUnit - props.scrollX) * props.zoomX / 96;
            let clipWidth = clip.durationUnit * props.zoomX / 96;
            let textX = clipX < 0? 0 : clipX;
            if (clipX > canvas.value!.offsetWidth || (clipX + clipWidth) < 0) return;
            const clipName = clip.type == "notes"? clip.clipChannel : "<Unknown>";
            const selected = getWorkspace().selectedClip == clip;
            
            if (canvas.value!.offsetHeight > 30) {
                renderer.fillRoundRect(clipX + 1, 1, clipWidth - 2, 12, 4, getTrack().trackColor ?? accent);
                renderer.ctx.globalAlpha = 0.5;
                renderer.begin()
                .roundRect(clipX + 1, 1, clipWidth - 2, canvas.value!.offsetHeight - 2, 4)
                .fill(getTrack().trackColor ?? accent);
                
                renderer.ctx.globalAlpha = 1;
                renderer.stroke(selected? selectedOutline : normalOutline, 2).end();
                renderer.fillText(clipName, textX + 5, 11, "12px Nunito Sans", "#000000");

                // Render clips
                // We might need precalculation here
                const clipPreviewHeight = canvas.value!.offsetHeight - 15;

                if (clip.type == "notes") {
                    let minMidi = -1;
                    let maxMidi = -1;
                    const renderPredicate = (note: ClippedNote) => (
                        note.startAtUnit <= clip.durationUnit
                    ); // TODO

                    clip.notes.forEach(note => {
                        if (minMidi == -1 || maxMidi == -1) {
                            minMidi = maxMidi = note.midiIndex;
                        } else {
                            minMidi = Math.min(minMidi, note.midiIndex);
                            maxMidi = Math.max(maxMidi, note.midiIndex);
                        }
                    });

                    if (minMidi != -1 && maxMidi != -1) {
                        const tracksCount = maxMidi - minMidi + 1;
                        const trackHeight = clipPreviewHeight / tracksCount;

                        clip.notes.forEach(note => {
                        if (!renderPredicate(note)) return;
                            const realStartAtUnit = clip.startAtUnit + note.startAtUnit;
                            const realEndAtUnit = Math.min(realStartAtUnit + note.durationUnit, clip.startAtUnit + clip.durationUnit);
                            const realDuration = realEndAtUnit - realStartAtUnit;

                            let noteX = (realStartAtUnit - props.scrollX) * props.zoomX / 96;
                            let noteY = 12 + trackHeight * (tracksCount - (note.midiIndex - minMidi + 1));
                            let noteWidth = realDuration * props.zoomX / 96;
                            if (noteWidth <= 0) return;
                            renderer.fillRoundRect(noteX + 1, noteY + 2, noteWidth - 1, trackHeight - 1, 4, getTrack().trackColor ?? accent);
                        });
                    }
                }
            } else {
                // TODO draw clip only
                renderer.begin()
                .roundRect(clipX + 1, 1, clipWidth - 2, canvas.value!.offsetHeight - 2, 4)
                .fill(getTrack().trackColor ?? accent)
                .stroke(selected? selectedOutline : normalOutline, 2).end();
                renderer.fillText(clipName, textX + 5, 14, "14px Nunito Sans", "#000000");
            }
        });
    }
});

function onScroll(event: WheelEvent) {
    const isTouchpad = Math.abs((event as any).wheelDeltaY) != 120 && event.deltaMode == 0;
    const wheelX = (event.shiftKey? event.deltaY : event.deltaX) * (isTouchpad? 1 : 0.5);
    const wheelY = event.shiftKey? event.deltaX : event.deltaY;
    if (wheelX != 0 || event.ctrlKey) event.preventDefault();

    if (event.ctrlKey) {
        scrollX.value += event.offsetX / zoomX.value * 96;
        zoomX.value = Math.max(zoomX.value - wheelX, 10);
        nextTick(() => scrollX.value = Math.max(scrollX.value - event.offsetX / zoomX.value * 96, 0));

        getTrack().trackHeight = Math.max(Math.min(getTrack().trackHeight + wheelY, 250), 20);
    } else {
        scrollX.value = Math.max(scrollX.value + wheelX / zoomX.value * 96, 0);
    }

    getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PatternsEditor);
}
</script>

<template>
    <div class="track" :style="{
        height: `${getTrack().trackHeight}px`
    }">
        <div class="drag-handle"></div>
        <div class="label" :style="{
            width: `${trackLabelWidth}px`,
            'background-color': getTrack().trackColor
        }">{{ getTrack().trackName ?? "Track" }}</div>
        <canvas
            ref="canvas"
            :style="{ width: `calc(100% - ${trackLabelWidth + 44}px)` }"
            @wheel="onScroll"
            @pointerdown="emits('canvas:pointerdown', $event)"
            @pointermove="emits('canvas:pointermove', $event)"
            @pointerup="emits('canvas:pointerup', $event)"
            @contextmenu="$event.preventDefault()"
        ></canvas>
    </div>
</template>

<style scoped lang="scss">
.track {
    border-bottom: 2px solid #0000003f;
    overflow: hidden;

    * {
        display: inline-block;
        height: 100%;
        vertical-align: top;
    }

    .drag-handle {
        width: 16px;
        cursor: grab;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 1000px;
            top: calc((100% - 16px) / 2);
            left: 3px;
            background-color: #ffffff3f;
            box-shadow: 6px 0 #ffffff3f,
                0 6px #ffffff3f, 6px 6px #ffffff3f,
                0 12px #ffffff3f, 6px 12px #ffffff3f;
        }
    }

    .label {
        background-color: #ffffff0f;
        border-radius: 6px 0 0 6px;
        height: calc(100% - 8px);
        padding: 4px 12px;
        line-height: 1.2;
        border-right: 2px solid #ffffff7f;
        box-shadow: -2px 0 8px #000000;
    }

    canvas {
        touch-action: none;
    }
}
</style>