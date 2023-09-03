<script setup lang="ts">
import { useParentState, useTrackableXYv2 } from '@/components/composes';

const props = defineProps<{
    modelValue: number
}>();
const emits = defineEmits(["update:modelValue"]);

const value = useParentState<number>("modelValue", props, emits);
const onPointerDown = useTrackableXYv2(value, undefined, {
    scale: 0.1,
    shiftScale: 0.01,
    ctrlScale: 1
});
</script>

<template>
    <div class="slider" @pointerdown="onPointerDown">{{ value.toFixed(2) }}</div>
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