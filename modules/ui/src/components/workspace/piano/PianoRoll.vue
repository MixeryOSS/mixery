<script setup lang="ts">
import MixeryWindow from '../../windows/MixeryWindow.vue';
import TitlebarButton from '../../windows/TitlebarButton.vue';
import WindowToolsbar from '../../windows/WindowToolsbar.vue';
import MixeryIcon from '../../icons/MixeryIcon.vue';
import FancyScrollbar from '../universal/FancyScrollbar.vue';
import { Units, type ClippedNote, NotesSourceNode } from '@mixery/engine';
import { computed, onMounted, ref, watch, toRaw, type WritableComputedRef, onUnmounted } from 'vue';
import { CanvasRenderer } from '../../../canvas/CanvasRenderer';
import { MidiText } from '../../MidiText';
import { useParentState, useResizeObserver, useTrackableXYv2 } from '../../composes';
import { Tools } from "../../../handling/Tools";
import type { ToolContext } from '@/handling/ITool';
import { Snapper } from '@/handling/Snapper';
import { MixeryUI } from '@/handling/MixeryUI';
import { RenderingHelper } from '@/canvas/RenderingHelper';
import { internal } from './PianoRoll.internal';
import type { ContextMenuEntry } from '@/components/contextmenus/ContextMenuEntry';
import { traverse } from '@/utils';

const props = defineProps<{
    visible: boolean,
    workspaceId: string,
    seekPointer: number,
    reactiveBpm: number,
    contextMenu?: ContextMenuEntry[],
    contextMenuX: number,
    contextMenuY: number,
}>();
const emits = defineEmits([
    "update:visible",
    "update:seekPointer",
    "updateKeybinds",
    "update:contextMenu",
    "update:contextMenuX",
    "update:contextMenuY",
]);

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }
function getProject() { return getWorkspace().project; }
function getEditingClip() { return getWorkspace().editingNotesClip; }

const canvas = ref<HTMLCanvasElement>();
const scrollHandleY = ref<HTMLDivElement>();
// const zoomHandle = ref<HTMLSpanElement>();
const canvasRenderer = ref<CanvasRenderer>();

const contextMenu = useParentState<ContextMenuEntry[]>("contextMenu", props, emits);
const contextMenuX = useParentState<number>("contextMenuX", props, emits);
const contextMenuY = useParentState<number>("contextMenuY", props, emits);

const updateHandle = ref(0);
const visible = useParentState("visible", props, emits);
const seekUpdateHandle = ref(0);
const scrollX = ref(0); // TODO track time instead
const scrollY = ref(0);
const zoomX = ref(96); // 96px per beat (100%)
const zoomY = ref(24); // 24px per line
const pageHeight = computed(() => zoomY.value * 128);
const scrollHandleYTop = computed(() => {
    const viewHeight = canvas.value?.offsetHeight ?? 100;
    const handleHeight = scrollHandleY.value?.offsetHeight ?? 1;
    const scrollProgress = scrollY.value / (pageHeight.value - viewHeight);
    return (((viewHeight - handleHeight) * scrollProgress) / viewHeight) * 100 - 0.1;
});
const pianoWidth = ref(100);
const scrollbarHeight = ref(40);
const clipDuration = ref(96);
const seekPointer = computed({
    get() {
        seekUpdateHandle.value;
        const editingClip = getEditingClip();
        return props.seekPointer - (editingClip? Units.unitsToMs(getProject().bpm, editingClip.startAtUnit) : 0);
    },
    set(v) {
        const editingClip = getEditingClip();
        emits("update:seekPointer", v + (editingClip? Units.unitsToMs(getProject().bpm, editingClip.startAtUnit) : 0));
    }
});
const editingClipRef = computed(() => {
    updateHandle.value;
    return getEditingClip();
});

const snap = ref(96 / 8);
const tools = Tools.LIST.map(v => v());
const selectedTool = ref(tools[0]);

const toolContext: ToolContext = {
    createObject() {
        let note: ClippedNote = { midiIndex: 0, startAtUnit: 0, durationUnit: 0, velocity: 0.8 };
        const selectedClip = getEditingClip();
        if (selectedClip) {
            selectedClip.notes.push(note);
            return new internal.NoteObject(selectedClip, note);
        } else {
            return new internal.NoteObject(undefined, note);
        }
    },
    deleteObject(obj) {
        const selectedClip = getEditingClip();
        if (!selectedClip) return;
        const idx = selectedClip.notes.indexOf(obj.unwrap as unknown as ClippedNote);
        selectedClip.notes.splice(idx, 1);
    },
    hitTest(position, trackPosition) {
        const selectedClip = getEditingClip();
        if (!selectedClip) return;
        let note = selectedClip.notes.find(v => v.midiIndex == trackPosition && position >= v.startAtUnit && position < v.startAtUnit + v.durationUnit);
        return note? new internal.NoteObject(selectedClip, note) : undefined;
    },
    clearSelection() {
        // TODO
    },
    getSelection() {
        // TODO
        return [];
    },
    addSelection(obj) {
        // TODO
    },
    get snapSegmentSize() { return snap.value; }
};

let lastResizerObserver: ResizeObserver | undefined;

onMounted(() => {
    const renderer = new CanvasRenderer(render);
    canvasRenderer.value = renderer;
    watch(canvas, elem => {
        if (!elem) return;
        if (lastResizerObserver) lastResizerObserver.disconnect();
        lastResizerObserver = useResizeObserver(elem, render);
    });
    getWorkspace().rendering.registerCallback([
        RenderingHelper.Keys.All,
        RenderingHelper.Keys.SeekPointer,
        RenderingHelper.Keys.PianoRoll
    ], () => render());

    const gridColor = ["#ffffff1f", "#ffffff2f"];
    const hoveredRowBg = "#ffffff1f";
    const hoveredRowPianoBg = "#0000001f";
    const velocityBarBg = "#0000003f";
    const velocityBarFg = "#000000af";
    const noteBorder = "#0000007f";
    const noteBg = ["#efefef", "#0f0f0f"];
    const noteFg = ["#000000", "#ffffff"];
    const noteHg = ["#ffffff", "#3f3f3f"];

    function render() {
        // Before render to canvas
        if (toRaw(editingClipRef.value) != getEditingClip()) updateHandle.value++;

        if (!props.visible) return;
        if (!canvas.value) return;
        renderer.startRender(canvas.value!);
        const editingClip = getEditingClip();
        clipDuration.value = editingClip?.durationUnit ?? 0;
        const fancy = getWorkspace().settings.fancyRendering;
        const accent = window.getComputedStyle(canvas.value!).getPropertyValue("--color-accent");
        const rowsPerScreen = Math.ceil(canvas.value!.offsetHeight / zoomY.value) + 1;
        const beatsPerScreen = Math.ceil(canvas.value!.offsetWidth / zoomX.value) + 1;
        const firstRowOffset = scrollY.value % zoomY.value;
        const firstRowFlippedIndex = Math.floor(scrollY.value / zoomY.value);
        const firstBeatOffset = scrollX.value % 96;
        const renderVelocityBar = zoomY.value >= 20;
        const renderNoteName = zoomY.value >= 14;
        const seekX = (Units.msToUnits(props.reactiveBpm, seekPointer.value) - scrollX.value) * zoomX.value / 96;
        const endOfClipX = ((editingClip?.durationUnit ?? 0) - scrollX.value) * zoomX.value / 96;

        renderer.fillRect(pianoWidth.value + seekX, 0, 2, canvas.value!.offsetHeight, accent);
        renderer.fillRect(pianoWidth.value + endOfClipX, 0, 2, canvas.value!.offsetHeight, "#ff7f7f");
        
        for (let i = 0; i < beatsPerScreen; i++) {
            const beatX = i * zoomX.value - firstBeatOffset * zoomX.value / 96;
            const beatIndex = i + Math.floor(scrollX.value / 96);
            const lineWidth = beatIndex % 4 == 0? 4 : 2;
            const gCol = gridColor[beatIndex % 4 == 0? 1 : 0];
            renderer.fillRect(pianoWidth.value + beatX - lineWidth / 2, 0, lineWidth, canvas.value!.offsetHeight, gCol);
        }

        for (let i = -1; i < rowsPerScreen; i++) {
            const rowY = i * zoomY.value - firstRowOffset;
            const index = 127 - i - firstRowFlippedIndex;
            const noteName = MidiText.midiToNoteName(index);
            const bg = noteBg[noteName.includes("#")? 1 : 0];
            const fg = noteFg[noteName.includes("#")? 1 : 0];
            const hg = noteHg[noteName.includes("#")? 1 : 0];
            const noteWidth = noteName.includes("#")? pianoWidth.value * 0.7 : pianoWidth.value;
            const highlightEnd = noteName.includes("#")? noteWidth + 2 : noteWidth;
            renderer.fillRect(0, rowY, noteWidth, zoomY.value * 2, bg);
            renderer.fillRect(0, rowY + zoomY.value - 1, pianoWidth.value, 1, noteName.match(/^C\d+/)? "#0000007f" : "#0000001f");
            
            if (fancy) {
                // Note highlights
                renderer.fillRect(0, rowY, noteWidth, 2, hg);
                renderer.fillRect(highlightEnd - 4, rowY, 2, zoomY.value - 1, hg);
            }

            renderer.fillText(noteName, 10, rowY + 17, "12px Nunito Sans", fg);
            renderer.fillRect(pianoWidth.value, rowY - 1, canvas.value!.offsetWidth, 2, gridColor[0]);

            if (renderer.testMouseRect(0, rowY, canvas.value!.offsetWidth, zoomY.value)) {
                renderer.fillRect(pianoWidth.value, rowY, canvas.value!.offsetWidth, zoomY.value, hoveredRowBg);
                renderer.fillRect(0, rowY, pianoWidth.value, zoomY.value, hoveredRowPianoBg);
            }
        }
        
        renderer.fillRect(pianoWidth.value - 2, 0, 2, canvas.value!.offsetHeight, "#1f1f1f");

        if (!editingClip) return; // TODO draw "no notes clip selected"
        editingClip.notes.forEach(note => {
            const index = 127 - note.midiIndex - firstRowFlippedIndex;
            let noteX = (note.startAtUnit - scrollX.value) * zoomX.value / 96;
            let noteWidth = note.durationUnit * zoomX.value / 96;
            if (noteX < 0) {
                let delta = -noteX;
                noteX = 0;
                noteWidth -= delta;
            }
            const noteY = index * zoomY.value - firstRowOffset;
            if (noteY < -zoomY.value || noteWidth <= 0) return;

            const noteName = MidiText.midiToNoteName(note.midiIndex);
            const noteNameWidth = renderer.ctx!.measureText(noteName).width;
            renderer.begin()
            .roundRect(pianoWidth.value + noteX + 1, noteY + 1, noteWidth - 2, zoomY.value - 2, 4)
            .fill(note.noteColor ?? accent)
            .stroke(noteBorder, 1)
            .end();

            if (renderVelocityBar) {
                const barHeight = zoomY.value * 4 / 24;
                renderer.progressBar(pianoWidth.value + noteX + 4, noteY + zoomY.value - barHeight - 4, noteWidth - 8, barHeight, note.velocity, velocityBarFg, velocityBarBg);
                if (noteWidth >= noteNameWidth + 4) {
                    renderer.fillText(noteName, pianoWidth.value + noteX + 3, noteY + 14, "12px Nunito Sans", "#000000");
                }
            } else if (renderNoteName && noteWidth >= noteNameWidth + 4) {
                renderer.fillText(noteName, pianoWidth.value + noteX + 3, noteY + zoomY.value / 2 + 4.5, "12px Nunito Sans", "#000000");
            }
        });
    }
});
onUnmounted(() => {
    if (lastResizerObserver) {
        lastResizerObserver.disconnect();
        lastResizerObserver = undefined;
    }
})

watch(scrollX, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PianoRoll));
watch(scrollY, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PianoRoll));
watch(zoomX, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PianoRoll));
watch(zoomY, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PianoRoll));
watch(pianoWidth, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PianoRoll));
watch(visible, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PianoRoll));

// Tracking
const computedScrollY = computed({
    get() {
        const viewHeight = canvas.value!.offsetHeight;
        const handleHeight = scrollHandleY.value?.offsetHeight ?? 1;
        const scrollProgress = scrollY.value / (pageHeight.value - viewHeight);
        return (viewHeight - handleHeight) * scrollProgress;
    },
    set(v) {
        const viewHeight = canvas.value!.offsetHeight;
        const handleHeight = scrollHandleY.value?.offsetHeight ?? 1;
        v /= viewHeight - handleHeight;
        v *= pageHeight.value - viewHeight;
        scrollY.value = Math.max(Math.min(v, pageHeight.value - viewHeight), 0);
    }
});

const centerZoomX = computed({
    get() { return zoomX.value; },
    set(v) {
        const viewWidth = canvas.value?.offsetWidth ?? 100;
        const delta = zoomX.value - v;
        scrollX.value += (viewWidth / 2 - pianoWidth.value) / zoomX.value * 96;
        zoomX.value = zoomX.value - delta;
        scrollX.value = Math.max(scrollX.value - (viewWidth / 2 - pianoWidth.value) / zoomX.value * 96, 0);
    }
});
const centerZoomY = computed({
    get() { return zoomY.value; },
    set(v) {
        const delta = zoomY.value - v;
        const viewHeight = canvas.value?.offsetHeight ?? 100;
        scrollY.value += viewHeight / 2;
        const lastZoom = zoomY.value;
        zoomY.value = zoomY.value - delta, 10;
        const zoomRatio = lastZoom / zoomY.value;
        scrollY.value = Math.min(Math.max(scrollY.value / zoomRatio - viewHeight / 2, 0), pageHeight.value - viewHeight);
    }
});

const onScrollHandlePointerDown = useTrackableXYv2(undefined, computedScrollY);
const onZoomHandlePointerDown = useTrackableXYv2(centerZoomX, centerZoomY, {
    minX: 10,
    minY: 10,
    maxY: 50,
    scale: 0.1,
    shiftScale: 0.01,
    ctrlScale: 1
});

getWorkspace().rendering.registerCallback([RenderingHelper.Keys.SeekPointer], () => {
    seekUpdateHandle.value++;
});

function onScroll(event: WheelEvent) {
    event.preventDefault();
    const viewHeight = canvas.value?.offsetHeight ?? 100;
    const isTouchpad = Math.abs((event as any).wheelDeltaY) != 120 && event.deltaMode == 0;
    const wheelX = (event.shiftKey? event.deltaY : event.deltaX) * (isTouchpad? 1 : 0.5);
    const wheelY = event.shiftKey? event.deltaX : event.deltaY;

    if (event.ctrlKey) {
        scrollX.value += (event.offsetX - pianoWidth.value) / zoomX.value * 96;
        zoomX.value = Math.max(zoomX.value - wheelX, 10);
        scrollX.value = Math.max(scrollX.value - (event.offsetX - pianoWidth.value) / zoomX.value * 96, 0);

        scrollY.value += event.offsetY;
        const lastZoom = zoomY.value;
        zoomY.value = Math.min(Math.max(zoomY.value - wheelY / 100, 10), 50);
        const zoomRatio = lastZoom / zoomY.value;
        scrollY.value = Math.min(Math.max(scrollY.value / zoomRatio - event.offsetY, 0), pageHeight.value - viewHeight);
    } else {
        scrollX.value = Math.max(scrollX.value + wheelX / zoomX.value * 96, 0);
        scrollY.value = Math.min(Math.max(scrollY.value + wheelY, 0), pageHeight.value - viewHeight);
    }
}

function lockPointer(event: PointerEvent) { (event.target as HTMLElement).requestPointerLock(); }
function unlockPointer(event: PointerEvent) { document.exitPointerLock(); }
function noContextMenu(event: Event) { event.preventDefault(); }

function canvasMouse(event: PointerEvent, cb: (position: number, midiIndex: number) => any) {
    const renderer = canvasRenderer.value!;
    const rowsPerScreen = Math.ceil(canvas.value!.offsetHeight / zoomY.value) + 1;
    const firstRowOffset = scrollY.value % zoomY.value;
    const firstRowFlippedIndex = Math.floor(scrollY.value / zoomY.value);
    const position = Snapper.snap((event.offsetX - pianoWidth.value) / zoomX.value * 96 + scrollX.value, snap.value);
    
    for (let i = 0; i < rowsPerScreen; i++) {
        const rowY = i * zoomY.value - firstRowOffset;
        const midiIndex = 127 - i - firstRowFlippedIndex;

        if (renderer.testMouseRect(pianoWidth.value, rowY, canvas.value!.offsetWidth, zoomY.value)) {
            cb(position, midiIndex);
        }
    }
}
function onCanvasMouseDown(event: PointerEvent) {
    canvasRenderer.value!.mouseX = event.offsetX;
    canvasRenderer.value!.mouseY = event.offsetY;
    canvasMouse(event, (position, midi) => toRaw(selectedTool).value.onMouseDown(toolContext, event.buttons, position, midi));
    
    getWorkspace().rendering.redrawRequest(
        RenderingHelper.Keys.PianoRoll,
        RenderingHelper.Keys.PatternsEditor
    );
}
function onCanvasMouseMove(event: PointerEvent) {
    event.preventDefault();
    canvasRenderer.value!.mouseX = event.offsetX;
    canvasRenderer.value!.mouseY = event.offsetY;
    canvasMouse(event, (position, midi) => toRaw(selectedTool).value.onMouseMove(toolContext, event.buttons, position, midi));
    
    getWorkspace().rendering.redrawRequest(
        RenderingHelper.Keys.PianoRoll,
        RenderingHelper.Keys.PatternsEditor
    );
}
function onCanvasMouseUp(event: PointerEvent) {
    event.preventDefault();
    canvasMouse(event, (position, midi) => toRaw(selectedTool).value.onMouseUp(toolContext, event.buttons, position, midi));
    if (event.pointerType != "mouse") {
        canvasRenderer.value!.mouseX = -1;
        canvasRenderer.value!.mouseY = -1;
    }

    getWorkspace().rendering.redrawRequest(
        RenderingHelper.Keys.PianoRoll,
        RenderingHelper.Keys.PatternsEditor
    );
}

function changeChannel(event: MouseEvent) {
    const workspaceUI = traverse(event.target as HTMLElement, v => v.classList.contains("workspace"), v => v.parentElement);
    const workspaceBox = workspaceUI?.getBoundingClientRect();
    contextMenuX.value = event.pageX - (workspaceBox?.x ?? 0);
    contextMenuY.value = event.pageY - (workspaceBox?.y ?? 0);

    const nodes = getWorkspace().project.nodes.nodes.filter(v => v.typeId == NotesSourceNode.ID);
    contextMenu.value = nodes.length > 0? nodes.map(v => ({
        label: (v as NotesSourceNode).data.channelName,
        onClick() {
            const editingClip = getEditingClip();
            if (!editingClip) return;
            editingClip.clipChannel = (v as NotesSourceNode).data.channelName;
            updateHandle.value++;
            getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.PatternsEditor);
        },
    })) : [];
}
</script>

<template>
    <MixeryWindow title="Piano Roll" :width=900 :height=500 resizable :visible=visible @focused="
    getWorkspace().windowKeybinds.keybinds = [];
    emits('updateKeybinds');
    ">
        <template v-slot:title-left>
            <TitlebarButton is-icon><MixeryIcon type="menu" /></TitlebarButton>
        </template>
        <template v-slot:title-right>
            <TitlebarButton @click="emits('update:visible', !visible)" is-icon><MixeryIcon type="close" /></TitlebarButton>
        </template>
        <template v-slot:toolsbars>
            <WindowToolsbar>
                <template v-for="tool in tools">
                    <TitlebarButton is-icon @click="selectedTool = tool" :highlight="selectedTool.toolName == tool.toolName" v-if="tool.icon">
                        <MixeryIcon :type="tool.icon as any" />
                    </TitlebarButton>
                    <TitlebarButton @click="selectedTool = tool" :highlight="selectedTool.toolName == tool.toolName" v-else>{{ tool.toolName }}</TitlebarButton>
                </template>
                <TitlebarButton><span
                    class="zoom-handle"
                    @pointerdown="lockPointer($event); onZoomHandlePointerDown($event);"
                    @pointerup="unlockPointer"
                >Zoom {{ (zoomX / 0.96).toFixed(0) }}%</span></TitlebarButton>
                <TitlebarButton @click="changeChannel">Channel: {{ editingClipRef? editingClipRef.clipChannel : "<Not selected>" }}</TitlebarButton>
            </WindowToolsbar>
        </template>
        <div class="inner">
            <FancyScrollbar
                v-model:scroll-x="scrollX"
                v-model:zoom-x="zoomX"
                v-model:leftbar-width="pianoWidth"
                v-model:scrollbar-height="scrollbarHeight"
                v-model:seek="seekPointer"
                :units-count="clipDuration"
                :bpm="props.reactiveBpm"
            />
            <div class="canvas-container">
                <canvas class="canvas" ref="canvas"
                    @wheel="onScroll"
                    @pointerdown="onCanvasMouseDown"
                    @pointermove="onCanvasMouseMove"
                    @pointerup="onCanvasMouseUp"
                    @contextmenu="noContextMenu"
                ></canvas>
                <div
                    class="scrollbar y-axis"
                    ref="scrollHandleY"
                    :style="{ top: `${scrollHandleYTop}%` }"
                    @pointerdown="onScrollHandlePointerDown"
                ></div>
            </div>
        </div>
        <!--<div class="scrollbar x-axis" ref="scrollHandleX" @pointerdown="lockPointer" @pointerup="unlockPointer"></div>-->
    </MixeryWindow>
</template>

<style scoped lang="scss">
.inner {
    display: flex;
    flex-direction: column;
    height: 100%;

    .canvas-container {
        position: relative;
        flex: 1 1 auto;

        .canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            touch-action: none;
        }
    }
}

.scrollbar {
    position: absolute;
    background-color: #ffffff1f;
    border: 1px solid #ffffff1f;
    border-radius: 4px;
    touch-action: none;

    &:hover {
        background-color: #ffffff3f;
        border: 1px solid #ffffff3f;
    }

    &.y-axis {
        width: 20px;
        height: 20%;
        right: 0;
        cursor: ns-resize;

        &::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            translate: -50% -50%;
            width: 10px;
            height: 2px;
            background-color: #ffffff3f;
            box-shadow: 0 -5px #ffffff3f, 0 5px #ffffff3f;
        }
    }
    
    &.x-axis {
        left: 50%;
        translate: -50% 0;
        width: 30%;
        height: 20px;
        bottom: 0;
        cursor: ew-resize;

        &::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            translate: -50% -50%;
            width: 2px;
            height: 10px;
            background-color: #ffffff3f;
            box-shadow: -5px 0 #ffffff3f, 5px 0 #ffffff3f;
        }
    }
}

.zoom-handle {
    cursor: move;
    touch-action: none;
    display: inline-block;
}
</style>