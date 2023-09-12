<script setup lang="ts">
import { ref, watch } from 'vue';
import ModuleBox from './ModuleBox.vue';
import { useParentRef } from '@/use';
import { Controller } from '@/Controller';
import { NoteEventMessage, NoteEventType } from '@mixery/controller';

const props = defineProps<{
    x: number,
    y: number,
    width: number,
    height: number,
    channel: number
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

const pianoOctave = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    .map(v => ({ key: v, sharp: v.endsWith("#") }));
const pianoKeys = ref(new Array<{ key: string, sharp: boolean }[]>(10)
    .fill(pianoOctave)
    .flatMap((v, octave) => v.map((u: { key: string, sharp: boolean }, idx) => ({
        ...structuredClone(u),
        octave,
        isActive: false,
        midiIndex: octave * 12 + idx + 12,
        color: "",
    }))));

const mapping = new Map<number, (typeof pianoKeys.value)[number]>();

function noteUp(event: PointerEvent) {
    const prev = mapping.get(event.pointerId);

    if (prev) {
        prev.isActive = false;
        mapping.delete(event.pointerId);
        Controller.client.send(new NoteEventMessage(NoteEventType.KEYUP, props.channel ?? 0, prev.midiIndex, event.pressure));
    }
}

function noteDown(event: PointerEvent, key: (typeof pianoKeys.value)[number]) {
    const prev = mapping.get(event.pointerId);
    if (prev != key) {
        if (prev) noteUp(event); // Release key from previous event

        key.isActive = true;
        mapping.set(event.pointerId, key);
        Controller.client.send(new NoteEventMessage(NoteEventType.KEYDOWN, props.channel ?? 0, key.midiIndex, event.pressure));
    }
}

function pointerDown(event: PointerEvent, key: (typeof pianoKeys.value)[number]) {
    noteDown(event, key);
    if (navigator.vibrate) navigator.vibrate([1, 1, 2]); // Fade in
}

function pointerUp(event: PointerEvent) {
    noteUp(event);
}

function pointerMove(event: PointerEvent, key: (typeof pianoKeys.value)[number]) {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    const prev = mapping.get(event.pointerId);
    if (!prev) return;
    if (prev != key && navigator.vibrate) navigator.vibrate(3);
    noteDown(event, key);
}

Controller.onNoteColor.useProxy().listen(event => {
    const { channel, midiIndex, color } = event;
    if (props.channel != channel) return
    if ((midiIndex - 12) >= pianoKeys.value.length || (midiIndex - 12) < 0) return;
    pianoKeys.value[(midiIndex - 12)].color = color;
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
        <template v-slot:name>Keyboard Ch. {{ props.channel ?? 0 }}</template>
        <div class="keyboard" @pointerup="pointerUp" @pointerleave="pointerUp">
            <div class="keys">
                <div
                    v-for="key in pianoKeys"
                    class="key"
                    :class="{ sharp: key.sharp, keydown: key.isActive }"
                    :style="{ '--key-width': `50px`, '--color-key': key.color }"
                    @pointerdown="pointerDown($event, key)"
                    @pointermove="pointerMove($event, key)"
                >
                    <div class="note-content">
                        <div class="label">{{ key.key }}{{ key.octave }}</div>
                    </div>
                </div>
            </div>
        </div>
    </ModuleBox>
</template>

<style scoped lang="scss">
.keyboard {
    display: flex;
    flex-direction: column;
    height: 100%;

    .scrollbar {
        height: 24px;
        background-color: #0000004f;
    }

    .keys {
        flex: 1 1 auto;
        overflow-x: scroll;
        position: relative;
        display: flex;
        touch-action: none;

        .key {
            --color-key: #eeeeee;
            width: var(--key-width);
            min-width: var(--key-width);
            background-color: var(--color-key);
            color: #000000;
            font-size: 12px;
            user-select: none;
            touch-action: none;
            height: calc(100% - 8px);
            border-radius: 0 0 4px 4px;
            box-shadow: 0 8px #424242, inset 0 0 0 2px #ffffff7f;
            margin-right: 2px;
            transition:
                0.1s linear margin-top,
                0.1s linear box-shadow,
                0.1s linear height;

            &.sharp {
                --color-key: #141414;
                color: #ffffff;
                margin-left: calc(0px - var(--key-width) * 0.5);
                margin-right: calc(0px - var(--key-width) * 0.5);
                margin-top: 2px;
                border-radius: 4px;
                z-index: 1;
                height: 60%;
                box-shadow: 0 8px #0707077f, 0 8px var(--color-key), inset 0 0 0 2px #0808089f;
            }

            &.keydown {
                background-color: #ff8e43;
                box-shadow: 0 4px #a0501c, 0 4px #a0501c, inset 0 0 0 2px #ffbb7b;
                height: calc(100% - 4px);
                
                transition:
                    0s linear margin-top,
                    0s linear box-shadow,
                    0s linear height;

                &.sharp {
                    background-color: #f17d2f;
                    height: 60%;
                    margin-top: 6px;
                }
            }

            .note-content {
                position: relative;
                height: 100%;

                .label {
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    translate: -50% 0;
                }
            }
        }

        &::-webkit-scrollbar {
            height: 20px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: #8f8f8f;

            &:active {
                background-color: #efefef;
            }
        }
    }
}
</style>