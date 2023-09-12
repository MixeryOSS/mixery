<script setup lang="ts">
import { useParentRef } from '@/use';
import ModuleBox from './ModuleBox.vue';
import { ref, watch } from 'vue';
import { Controller } from '@/Controller';
import { NoteEventMessage, NoteEventType } from '@mixery/controller';

const props = defineProps<{
    x: number,
    y: number,
    width: number,
    height: number,
    channel: number,
    matrix: [number, number]
}>();
const emits = defineEmits([
    "update:x",
    "update:y",
    "update:width",
    "update:height",
    "updateCollision"
]);

const moduleX = useParentRef<number>("x", props, emits);
const moduleY = useParentRef<number>("y", props, emits);
const moduleWidth = useParentRef<number>("width", props, emits);
const moduleHeight = useParentRef<number>("height", props, emits);
const pads = ref(
    new Array(props.matrix[0] * props.matrix[1])
    .fill(undefined)
    .map((_, idx) => ({
        x: idx % props.matrix[0],
        y: Math.floor(idx / props.matrix[1]),
        midiIndex: idx,
        isPressed: false,
        color: "#dadada"
    }))
);

const mapping = new Map<number, (typeof pads.value)[number]>();

function noteUp(event: PointerEvent) {
    const prev = mapping.get(event.pointerId);

    if (prev) {
        prev.isPressed = false;
        mapping.delete(event.pointerId);
        Controller.client.send(new NoteEventMessage(NoteEventType.KEYUP, props.channel ?? 0, prev.midiIndex, event.pressure));
    }
}

function noteDown(event: PointerEvent, pad: (typeof pads.value)[number]) {
    const prev = mapping.get(event.pointerId);
    if (prev != pad) {
        if (prev) noteUp(event); // Release key from previous event

        pad.isPressed = true;
        mapping.set(event.pointerId, pad);
        Controller.client.send(new NoteEventMessage(NoteEventType.KEYDOWN, props.channel ?? 0, pad.midiIndex, event.pressure));
    }
}

function onPointerDown(event: PointerEvent, x: number, y: number) {
    const pad = pads.value[x + y * props.matrix[0]];
    noteDown(event, pad);
    if (navigator.vibrate) navigator.vibrate(5);
}

function onPointerUp(event: PointerEvent) {
    noteUp(event);
}

function onPointerMove(event: PointerEvent, x: number, y: number) {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    const pad = pads.value[x + y * props.matrix[0]];
    const prev = mapping.get(event.pointerId);
    if (!prev) return;
    if (prev != pad && navigator.vibrate) navigator.vibrate(3);
    noteDown(event, pad);
}

Controller.onNoteColor.useProxy().listen(event => {
    const { channel, midiIndex, color } = event;
    if (props.channel != channel) return
    if (midiIndex < 0 || midiIndex >= pads.value.length) return;
    pads.value[midiIndex].color = color;
});
</script>

<template>
    <ModuleBox
        v-model:x="moduleX"
        v-model:y="moduleY"
        v-model:width="moduleWidth"
        v-model:height="moduleHeight"
        @update-collision="emits('updateCollision')"
    >
        <template v-slot:name>Drum Pad Ch. {{ props.channel ?? 0 }}</template>
        <div class="content" @pointerup="onPointerUp" @pointerleave="onPointerUp">
            <div v-for="rowIndex in props.matrix[1]" class="row">
                <div
                    v-for="colIndex in props.matrix[0]"
                    class="pad"
                    :class="{ pressed: pads[colIndex - 1 + (rowIndex - 1) * props.matrix[0]].isPressed }"
                    :style="{ '--color-pad': pads[colIndex - 1 + (rowIndex - 1) * props.matrix[0]].color }"
                    @pointerdown="onPointerDown($event, colIndex - 1, rowIndex - 1)"
                    @pointerup="onPointerUp"
                    @pointermove="onPointerMove($event, colIndex - 1, rowIndex - 1)"
                >
                    <!--<slot :name="`pad-${colIndex}-${rowIndex}`"></slot>-->
                </div>
            </div>
        </div>
    </ModuleBox>
</template>

<style scoped lang="scss">
.content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .row {
        flex: 1 1 auto;
        display: flex;

        .pad {
            position: relative;
            flex: 1 1 auto;
            user-select: none;
            touch-action: none;
            --color-pad: #dadada;

            &::before {
                content: '';
                position: absolute;
                top: 1px;
                left: 1px;
                width: calc(100% - 2px);
                height: calc(100% - 6px);
                background-color: var(--color-pad);
                border-radius: 4px;
                box-shadow: 0 4px #0000003f, 0 4px var(--color-pad), inset 0 0 0 2px #ffffff4f;
                transition: 0.1s linear top, 0.1s linear height, 0.1s linear box-shadow;
            }

            &.pressed::before {
                top: 4px;
                box-shadow: 0 1px #0000003f, 0 1px var(--color-pad), inset 0 0 0 4px #ffffff7f, inset 0 0 0 2px #ffffff;
                transition: none;
            }
        }
    }
}
</style>