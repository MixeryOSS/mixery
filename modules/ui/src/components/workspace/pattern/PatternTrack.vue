<script setup lang="ts">
import { CanvasRenderer } from '@/canvas/CanvasRenderer';
import { RenderingHelper } from '@/canvas/RenderingHelper';
import { useResizeObserver } from '@/components/composes';
import { MixeryUI } from '@/handling/MixeryUI';
import { Snapper } from '@/handling/Snapper';
import { Units, type ClippedNote, type ResourcePath, type AudioClip, AudioSourceNode } from '@mixery/engine';
import { computed, nextTick, onMounted, ref } from 'vue';

const props = defineProps<{
    editorVisible: boolean,
    workspaceId: string,
    trackIndex: number,
    scrollX: number,
    zoomX: number,
    trackLabelWidth: number,
    seekPointer: number,
    snap: number,
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
    const renderer = new CanvasRenderer(render);
    canvasRenderer.value = renderer;
    useResizeObserver(canvas.value!, render);
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
        renderer.startRender(canvas.value!);
        const accent = window.getComputedStyle(canvas.value!).getPropertyValue("--color-accent");
        const beatsPerScreen = Math.ceil(canvas.value!.offsetWidth / props.zoomX) + 1;
        const firstBeatOffset = props.scrollX % 96;
        const seekX = (Units.msToUnits(getWorkspace().project.bpm, props.seekPointer) - props.scrollX) * props.zoomX / 96;

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
            let textWidth = clipWidth + Math.min(clipX, 0) - 12;
            let textX = clipX < 0? 0 : clipX;
            if (clipX > canvas.value!.offsetWidth || (clipX + clipWidth) < 0) return;
            let clipName: string;
            switch (clip.type) {
                case "notes": clipName = `Notes: ${clip.clipChannel}`; break;
                case "audio": clipName = `Audio: ${clip.resource.path[clip.resource.path.length - 1]} -> ${clip.clipChannel}`; break;
                default: clipName = `<Unknown>`; break;
            }

            const selected = getWorkspace().selectedClips.has(clip);
            if (canvas.value!.offsetHeight > 30) {
                renderer.fillRoundRect(clipX + 1, 1, clipWidth - 2, 12, 4, getTrack().trackColor ?? accent);
                renderer.ctx!.globalAlpha = 0.5;
                renderer.begin()
                .roundRect(clipX + 1, 1, clipWidth - 2, canvas.value!.offsetHeight - 2, 4)
                .fill(getTrack().trackColor ?? accent);
                
                renderer.ctx!.globalAlpha = 1;
                renderer.stroke(selected? selectedOutline : normalOutline, 2).end();
                renderer.fillTextWithLimit(clipName, textX + 5, 11, textWidth, "12px Nunito Sans", "#000000");

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

                if (clip.type == "audio") {
                    const res = getWorkspace().project.resourcesManager.get(clip.resource);
                    if (!res) {
                        getWorkspace().project.resourcesManager.loadResource(clip.resource);
                        return;
                    }
                    if (!res.waveform) return;

                    const bpm = getWorkspace().project.bpm;
                    const waveformSampleRate = res.waveform[0].sampleRate;
                    let offset = Math.floor(Units.unitsToMs(bpm, clip.audioStartAtUnit) * waveformSampleRate / 1000);
                    let samples = Math.floor(Units.unitsToMs(bpm, clip.durationUnit) * waveformSampleRate / 1000);
                    let waveformX = clipX;
                    const pxPerSample = (clipWidth - 4) / samples;
                    const samplesPerPage = Math.floor(canvas.value!.offsetWidth / pxPerSample);
                    
                    // Optimize rendering
                    if (waveformX < 0) {
                        const samplesOutside = Math.floor(-waveformX / pxPerSample);
                        offset += samplesOutside;
                        waveformX = 0;
                    }

                    samples = Math.min(samples, samplesPerPage);
                    const waveformsHeight = canvas.value!.offsetHeight - 16;
                    const peak = waveformsHeight / (res.waveform.length * 2);

                    for (let ch = 0; ch < res.waveform.length; ch++) {
                        const middle = 14 + (ch * 2 + 1) * peak;
                        
                        renderer.begin();
                        for (let i = 0; i < samples; i++) {
                            if (offset + i >= res.waveform[ch].pos.length) continue;
                            let v = res.waveform[ch].pos[offset + i];
                            renderer.line(waveformX + 2 + i * pxPerSample, middle - peak * v);
                        }
                        for (let i = samples - 1; i >= 0; i--) {
                            if (offset + i >= res.waveform[ch].neg.length) continue;
                            let v = res.waveform[ch].pos[offset + i];
                            renderer.line(waveformX + 2 + i * pxPerSample, middle + peak * v);
                        }
                        renderer.fill(getTrack().trackColor ?? accent);
                        renderer.end();
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

async function dropEventToResourceHandle(event: DragEvent) {
    if (event.dataTransfer) {
        const resourceRefJSON = event.dataTransfer.getData("application/x.mixery.resource");
        if (resourceRefJSON) {
            const resourceRef: {workspaceId: string, path: ResourcePath} = JSON.parse(resourceRefJSON);
            const fromWorkspace = MixeryUI.workspaces.get(resourceRef.workspaceId);
            if (!fromWorkspace) return undefined;

            // TODO also force loading the resource when loading project from disk
            return await fromWorkspace.project.resourcesManager.loadResource(resourceRef.path);
        }
    }

    return undefined;
}

function onDragOver(event: DragEvent) {
    event.preventDefault();
}

async function onDrop(event: DragEvent) {
    event.preventDefault();
    const handle = await dropEventToResourceHandle(event);
    if (!handle) return;

    if (handle.audioBuffer) {
        const clip: AudioClip = {
            type: "audio",
            clipChannel: getWorkspace().selectedNode instanceof AudioSourceNode
                ? (getWorkspace().selectedNode as AudioSourceNode).data.channelName
                : "Default Channel",
            startAtUnit: Snapper.snap(scrollX.value + event.offsetX * 96 / zoomX.value, props.snap),
            durationUnit: Units.msToUnits(getWorkspace().project.bpm, (handle.audioBuffer.length / handle.audioBuffer.sampleRate) * 1000),
            resource: handle.path,
            audioStartAtUnit: 0,
            stretchFactor: 1
        };
        getTrack().clips.push(clip);
        getWorkspace().selectedClips.clear();
        getWorkspace().selectedClips.add(clip);
        getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PatternsEditor);
    }

    // TODO parse notes presets...
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
            @dragover="onDragOver"
            @drop="onDrop"
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