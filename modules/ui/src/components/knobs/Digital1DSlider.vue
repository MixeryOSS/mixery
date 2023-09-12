<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useParentState, useTrackableXY } from '../composes';
import { DoubleClickHandler } from '@/handling/DoubleClickHandler';

const props = defineProps<{
    name: string,
    modelValue: number,
    displayMode?: "decimal" | "time",
    min?: number,
    max?: number,
    doubleClickSpeed?: number
}>();

const emit = defineEmits(['update:modelValue']);

const value = useParentState<number>("modelValue", props, emit);
const initialValue = ref<number>(value.value);
const manualMode = ref(false);
const valueRef = ref<HTMLDivElement>();
const manualText = ref("");

const doubleclick = new DoubleClickHandler(() => props.doubleClickSpeed ?? 500, () => {
    initialValue.value = value.value;
    manualText.value = (value.value / (props.displayMode == "time"? 1000 : 1)).toFixed(props.displayMode == "time"? 3 : 2);
    manualMode.value = true;
    nextTick(() => valueRef.value?.focus());
});

function clamp(v: number) {
    if (!v) v = initialValue.value;
    if (props.min != undefined) v = Math.max(props.min, v);
    if (props.max != undefined) v = Math.min(props.max, v);
    return v;
}

function onBeforeInput(event: KeyboardEvent) {
    if (!manualMode.value) return;
    event.stopPropagation();

    if (event.key == "Enter" || event.key == "Escape") {
        event.preventDefault();
        manualMode.value = false;
    }
}

function onInput(event: Event) {
    const content = (event.target as HTMLDivElement).textContent;
    manualText.value = content ?? "";
    if (content != null && content.trim().length > 0) value.value = clamp((+content) * (props.displayMode == "time"? 1000 : 1));
}

const displayValue = computed(() => {
    if (manualMode.value) return manualText.value;
    if (props.displayMode == "time") {
        const totalMs = value.value;
        const ms = totalMs % 1000;
        const totalSeconds = Math.floor(totalMs / 1000);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = totalMinutes % 60;
        const totalHours = Math.floor(totalMinutes / 60);

        if (totalHours > 0) return `${totalHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${Math.floor(ms).toString().padStart(3, "0")}`;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${Math.floor(ms).toString().padStart(3, "0")}`;
    }

    return value.value.toFixed(2);
});

const root = ref<HTMLDivElement>();

onMounted(() => {
    useTrackableXY(root.value!, value, undefined, {
        scale: props.displayMode == "time"? 50 : 0.1,
        shiftScale: props.displayMode == "time"? 10 : 0.01,
        ctrlScale: props.displayMode == "time"? 200 : 1,
        minX: props.min,
        maxX: props.max,
        minY: props.min,
        maxY: props.max
    });

    root.value?.addEventListener("wheel", event => {
        event.preventDefault();
        const divisions = props.displayMode == "time"? 1 : 100;
        const min = props.min ?? Number.NEGATIVE_INFINITY;
        const max = props.max ?? Number.POSITIVE_INFINITY;
        value.value = Math.max(Math.min(value.value + (-event.deltaY - event.deltaX) / divisions, max), min);
    });
});

function pointerDown(event: PointerEvent) {
    doubleclick.mouseDown(event);
    if (!manualMode.value) root.value!.requestPointerLock();
}

function unlockPointer(event: PointerEvent) {
    document.exitPointerLock();
}
</script>

<template>
    <div class="digital-1d-slider" ref="root" @pointerdown="pointerDown" @pointerup="unlockPointer">
        <div class="value"
            :contenteditable="manualMode"
            @blur="manualMode = false"
            @keydown="onBeforeInput"
            @input="onInput"
            ref="valueRef"
        >{{ displayValue }}</div>
        <div class="name">{{ props.name }}</div>
    </div>
</template>

<style scoped lang="scss">
.digital-1d-slider {
    display: inline-block;
    position: relative;
    height: 40px;
    cursor: ew-resize;
    font-size: 14px;
    padding: 0 6px;
    touch-action: none;
    user-select: none;

    * {
        display: block;
        height: 20px;
        text-align: center;
        user-select: none;
    }

    .name {
        color: #b6b6b6;
        line-height: 1.4;
    }

    .value {
        outline: none;
    }

    &::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 50%;
        translate: 0 -50%;
        border-right: 5px solid #ffffff4f;
        border-top: 0px solid transparent;
        border-bottom: 0px solid transparent;
        border-left: 5px solid transparent;
        opacity: 0;
        transition: 0.3s border-top, 0.3s border-bottom, 0.3s opacity, 0.3s border-right;
    }

    &:hover::before {
        opacity: 1;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
    }

    &:active::before {
        opacity: 1;
        border-right: 5px solid var(--color-accent);
        border-top: 15px solid transparent;
        border-bottom: 15px solid transparent;
    }

    &::after {
        content: '';
        position: absolute;
        right: -10px;
        top: 50%;
        translate: 0 -50%;
        border-left: 5px solid #ffffff4f;
        border-top: 0px solid transparent;
        border-bottom: 0px solid transparent;
        border-right: 5px solid transparent;
        opacity: 0;
        transition: 0.3s border-top, 0.3s border-bottom, 0.3s opacity, 0.3s border-left;
    }

    &:hover::after {
        opacity: 1;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
    }

    &:active::after {
        opacity: 1;
        border-left: 5px solid var(--color-accent);
        border-top: 15px solid transparent;
        border-bottom: 15px solid transparent;
    }
}
</style>