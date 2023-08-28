<!--
    A fancy scrollbar.
    Initially I wanted to render preview of the piano roll/patterns.
-->
<script setup lang="ts">
import { useTrackableXY } from '@/components/composes';
import { Units } from '@mixery/engine';
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{
    leftbarWidth: number,
    scrollbarHeight: number,
    scrollX: number,
    zoomX: number,
    unitsCount: number,
    seek: number,
    bpm: number
}>();
const emits = defineEmits(["update:leftbarWidth", "update:scrollbarHeight", "update:scrollX", "update:zoomX", "update:seek"]);

const leftbarWidth = computed({
    get() { return props.leftbarWidth; },
    set(v) { emits("update:leftbarWidth", v); }
});
const scrollbarHeight = computed({
    get() { return props.scrollbarHeight; },
    set(v) { emits("update:scrollbarHeight", v); }
});
const scrollX = computed({
    get() { return props.scrollX; },
    set(v) { emits("update:scrollX", v); }
});
const zoomX = computed({
    get() { return props.zoomX; },
    set(v) { emits("update:zoomX", v); }
});
const seek = computed({
    get() { return Units.msToUnits(props.bpm, props.seek); },
    set(v) { emits("update:seek", Units.unitsToMs(props.bpm, v)); }
});
const seekPixel = computed({
    get() { return (seek.value - scrollX.value) * zoomX.value / 96; },
    set(v) { seek.value = Math.max(v * 96 / zoomX.value + scrollX.value, 0); }
});

const innerRoot = ref<HTMLDivElement>();
const resizer = ref<HTMLDivElement>();
const seekHandle = ref<HTMLDivElement>();
const scrollHandle = ref<HTMLDivElement>();

const innerWidth = ref(100);
const unitsPerView = computed(() => {
    return innerWidth.value * 96 / zoomX.value;
});
const totalUnits = computed(() => {
    const maxUnits = props.unitsCount;
    return Math.max(maxUnits, scrollX.value + unitsPerView.value);
});
const scrollbarWidth = computed(() => {
    const maxWidth = innerWidth.value;
    return maxWidth * (unitsPerView.value / totalUnits.value);
});
const scrollbarX = computed({
    get() {
        const maxWidth = innerWidth.value;
        if ((scrollX.value + unitsPerView.value) < props.unitsCount) {
            const progress = scrollX.value / props.unitsCount;
            return maxWidth * progress;
        }

        return maxWidth - scrollbarWidth.value;
    },
    set(v) {
        const maxWidth = innerWidth.value;
        if ((scrollX.value + unitsPerView.value) < props.unitsCount) {
            scrollX.value = (v * props.unitsCount) / maxWidth;
            return;
        }

        const a = (maxWidth - v) / maxWidth;
        const b = unitsPerView.value / a;
        scrollX.value = b - unitsPerView.value; // TODO prevent scrolling to infinity
    }
});
const scrollbarWidthPercentage = computed(() => (scrollbarWidth.value / innerWidth.value) * 100);

onMounted(() => {
    useTrackableXY(resizer.value!, leftbarWidth, scrollbarHeight, {
        minX: 70,
        minY: 40,
    });
    useTrackableXY(seekHandle.value!, seekPixel, undefined);
    useTrackableXY(scrollHandle.value!, scrollbarX, undefined, {
        minX: 0
    });

    let observer = new ResizeObserver(() => {
        innerWidth.value = innerRoot.value?.offsetWidth ?? 100;
    });
    observer.observe(innerRoot.value!);
});

function onEmptySpacePointer(event: PointerEvent) {
    if (event.target != innerRoot.value) return;
    seek.value = (event.offsetX / zoomX.value * 96) + scrollX.value;
}
</script>

<template>
    <div class="fancy-scrollbar" :style="{ height: `${props.scrollbarHeight}px`, minHeight: `${props.scrollbarHeight}px` }">
        <div class="resizer" :style="{ width: `${leftbarWidth - 2}px` }" ref="resizer"></div>
        <div class="inner" ref="innerRoot" @pointerdown="onEmptySpacePointer">
            <div class="seek-handle" :style="{ left: `${seekPixel}px` }" ref="seekHandle"></div>
            <div class="scroll-handle" :style="{
                width: `calc(${scrollbarWidthPercentage}% - 2px)`,
                left: `${scrollbarX}px`
            }" ref="scrollHandle"></div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.fancy-scrollbar {
    display: flex;
    border-bottom: 1px solid #0000007f;
    user-select: none;

    .resizer {
        cursor: grab;
        border-right: 2px solid #0000007f;
        transition: 0.1s linear background-color;
        touch-action: none;

        &:hover {
            background-color: #0000007f;
        }

        &:active {
            cursor: grabbing;
        }
    }

    .inner {
        position: relative;
        flex: 1 1 auto;
        overflow: hidden;

        .seek-handle {
            position: absolute;
            width: 2px;
            height: 100%;
            background-color: var(--color-accent);
            cursor: grab;
            touch-action: none;

            &:active {
                cursor: grabbing;
            }

            &::before {
                content: '';
                position: absolute;
                background-color: var(--color-accent);
                top: 0;
                left: 1px;
                width: 16px;
                height: 16px;
                border-radius: 4px;
                translate: -50% 0;
                border: 1px solid #0000007f;
            }

            &::after {
                content: '';
                position: absolute;
                background-color: #0000007f;
                top: 4px;
                left: 1px;
                width: 2px;
                height: 10px;
                translate: -50% 0;
                box-shadow: -3px 0 #0000007f, 3px 0 #0000007f;
            }
        }

        .scroll-handle {
            position: absolute;
            height: calc(100% - 20px);
            top: 20px;
            background-color: #ffffff1f;
            border: 1px solid #ffffff1f;
            border-radius: 4px;
            cursor: ew-resize;
            touch-action: none;

            &:hover {
                background-color: #ffffff3f;
                border: 1px solid #ffffff3f;
            }
        }
    }
}
</style>