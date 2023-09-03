<script setup lang="ts">
import { useParentState, useTrackableXYv2 } from '@/components/composes';
import { DoubleClickHandler } from '@/handling/DoubleClickHandler';
import { ref } from 'vue';

const props = defineProps<{
    modelValue: number
}>();
const emits = defineEmits(["update:modelValue"]);

const value = useParentState<number>("modelValue", props, emits);
const textMode = ref(false);

const trackPosition = useTrackableXYv2(value, undefined, {
    scale: 0.1,
    shiftScale: 0.01,
    ctrlScale: 1
});

const doubleclick = new DoubleClickHandler(() => 500, () => {
    textMode.value = true;
});

function onPointerDown(event: PointerEvent) {
    trackPosition(event);
    doubleclick.mouseDown(event);
}

function onInput(event: Event) {
    const content = (event.target as HTMLDivElement).textContent;
    if (content != null && content.trim().length > 0) value.value = +content;
}

function formatDecimal(d: number) {
    let v = d.toFixed(2);
    while (v.endsWith("0")) v = v.substring(0, v.length - 1);
    if (v.endsWith(".")) v = v.substring(0, v.length - 1);
    return v;
}
</script>

<template>
    <div
        class="slider"
        @pointerdown="onPointerDown"
        @blur="textMode = false"
        @input="onInput"
        :contenteditable="textMode"
    >{{ formatDecimal(value) }}</div>
</template>

<style scoped lang="scss">
.slider {
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    display: inline-block;
    outline: none;
    height: 24px;
    padding: 0 4px;
    transition: 0.1s background-color, 0.1s border;
    font-size: 14px;
    user-select: none;
    touch-action: none;
    cursor: grab;

    &:hover {
        background-color: #ffffff0f;
        border: 1px solid #ffffff1f;
    }

    &:active {
        cursor: grabbing;
    }
}
</style>