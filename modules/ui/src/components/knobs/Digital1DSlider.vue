<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTrackableXY } from '../composes';

const props = defineProps<{
    name: string,
    modelValue: number,
    displayMode?: "decimal" | "time",
    min?: number,
    max?: number
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
    get() { return +props.modelValue; },
    set(v) { emit("update:modelValue", v); }
});
const displayValue = computed(() => {
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

function lockPointer(event: PointerEvent) {
    root.value!.requestPointerLock();
}

function unlockPointer(event: PointerEvent) {
    document.exitPointerLock();
}
</script>

<template>
    <div class="digital-1d-slider" ref="root" @pointerdown="lockPointer" @pointerup="unlockPointer">
        <div class="value">{{ displayValue }}</div>
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