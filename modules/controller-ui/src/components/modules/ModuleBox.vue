<script setup lang="ts">
import { useDraggable, useMapper, useParentRef, useSmoothSnapEffect } from '@/use';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    x: number,
    y: number,
    width: number,
    height: number
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

// Computed value for display
const moduleAnchorOffsetX = computed(() => Math.round(moduleX.value) - moduleX.value);
const moduleAnchorOffsetY = computed(() => Math.round(moduleY.value) - moduleY.value);
const moduleAnchorWidth = computed(() => Math.max(Math.round(moduleWidth.value), 1));
const moduleAnchorHeight = computed(() => Math.max(Math.round(moduleHeight.value), 1));

// Vibrate if module geometry changed
if (navigator.vibrate) {
    watch(computed(() => Math.round(moduleX.value)), () => navigator.vibrate(5));
    watch(computed(() => Math.round(moduleY.value)), () => navigator.vibrate(5));
    watch(computed(() => Math.round(moduleWidth.value)), () => navigator.vibrate(5));
    watch(computed(() => Math.round(moduleHeight.value)), () => navigator.vibrate(5));
}

const screenWidth = ref(window.innerWidth - 12);
window.addEventListener("resize", () => screenWidth.value = (window.innerWidth - 12));
const modulesPerRow = computed(() => Math.floor(screenWidth.value / 100));
const moduleSize = computed(() => screenWidth.value / modulesPerRow.value);

const dragging = ref(false);
const dragHandle = useDraggable(
    useMapper(moduleX, v => v * moduleSize.value, v => v / moduleSize.value),
    useMapper(moduleY, v => v * moduleSize.value, v => v / moduleSize.value)
);

function onDragHandlePointerDown(event: PointerEvent) {
    const id = event.pointerId;
    dragHandle.onPointerDown(event);
    dragging.value = true;

    document.addEventListener("pointerup", function onDragHandlePointerUp(event) {
        if (event.pointerId != id) return;
        moduleX.value = Math.max(Math.round(moduleX.value), 0);
        moduleY.value = Math.max(Math.round(moduleY.value), 0);
        dragging.value = false;
        if (navigator.vibrate) navigator.vibrate([5, 50, 5]);
        document.removeEventListener("pointerup", onDragHandlePointerUp);
        emits("updateCollision");
    });
}

const resizing = ref(false);
const resizeHandle = useDraggable(
    useMapper(moduleWidth, v => v * moduleSize.value, v => v / moduleSize.value),
    useMapper(moduleHeight, v => v * moduleSize.value, v => v / moduleSize.value)
);

function onResizeHandlePointerDown(event: PointerEvent) {
    const id = event.pointerId;
    resizeHandle.onPointerDown(event);
    resizing.value = true;

    document.addEventListener("pointerup", function onResizeHandlePointerUp(event) {
        if (event.pointerId != id) return;
        moduleWidth.value = Math.max(Math.round(moduleWidth.value), 1);
        moduleHeight.value = Math.max(Math.round(moduleHeight.value), 1);
        resizing.value = false;
        if (navigator.vibrate) navigator.vibrate([5, 50, 5]);
        document.removeEventListener("pointerup", onResizeHandlePointerUp);
        emits("updateCollision");
    });
}
</script>

<template>
    <div class="module" :class="{ dragging: dragging || resizing }" :style="{
        width: `${moduleWidth * moduleSize}px`,
        height: `${moduleHeight * moduleSize}px`,
        left: `${moduleX * moduleSize}px`,
        top: `${moduleY * moduleSize}px`
    }">
        <div class="anchor" :style="{
            width: `${moduleAnchorWidth * moduleSize}px`,
            height: `${moduleAnchorHeight * moduleSize}px`,
            left: `${moduleAnchorOffsetX * moduleSize}px`,
            top: `${moduleAnchorOffsetY * moduleSize}px`
        }"></div>
        <div class="inner">
            <div class="titlebar">
                <div class="drag-handle" @pointerdown="onDragHandlePointerDown"></div>
                <div class="label"><slot name="name"></slot></div>
            </div>
            <div class="content">
                <slot></slot>
            </div>
        </div>
        <div class="resizer" @pointerdown="onResizeHandlePointerDown"></div>
    </div>
</template>

<style scoped lang="scss">
.module {
    position: absolute;
    transition: 0.2s ease-out left, 0.2s ease-out top, 0.2s ease-out width, 0.2s ease-out height;

    .anchor {
        position: absolute;
        transition: 0.2s ease-out left, 0.2s ease-out top, 0.2s linear box-shadow;
        border-radius: 8px;
    }

    &.dragging {
        transition: none;
        z-index: 10;

        .inner, .resizer {
            opacity: 0.2;
        }

        .anchor {
            transition: 0.2s linear box-shadow;
            box-shadow: inset 0 0 0 2px var(--color-accent);
        }
    }

    .inner {
        position: relative;
        display: flex;
        flex-direction: column;
        width: calc(100% - 6px);
        height: calc(100% - 6px);
        border: 2px solid #0000007f;
        margin: 1px;
        border-radius: 6px;
        background-color: var(--color-background);
        transition: 0.2s linear opacity;

        .titlebar {
            background-color: #2f2f2f;
            height: 24px;
            border-radius: 4px 4px 0 0;
            border-bottom: 2px solid #000000cf;
            display: flex;

            .drag-handle {
                width: 24px;
                background-color: #ffffff0f;
                cursor: grab;
                touch-action: none;

                &:active {
                    cursor: grabbing;
                }
            }

            .label {
                padding: 0 4px 0 12px;
            }
        }

        .content {
            position: relative;
            flex: 1 1 auto;
            width: 100%;
            user-select: none;
            overscroll-behavior: none;
            touch-action: none;
        }
    }

    .resizer {
        position: absolute;
        width: 0;
        height: 0;
        border-right: 8px solid #ffffff7f;
        border-bottom: 8px solid #ffffff7f;
        border-top: 8px solid transparent;
        border-left: 8px solid transparent;
        right: 3px;
        bottom: 3px;
        touch-action: none;
        transition: 0.1s linear border, 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) box-shadow;

        &:hover {
            border-right: 8px solid var(--color-accent);
            border-bottom: 8px solid var(--color-accent);
        }
    }
}
</style>