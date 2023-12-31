<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useTrackableXYv2 } from "../composes";
import { traverse } from "@/utils";

const props = defineProps<{
    title: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    resizable: boolean,
    visible: boolean
}>();

const emits = defineEmits(["focused"]);

const visible = computed(() => props.visible);
const width = ref(props.width ?? 0);
const height = ref(props.height ?? 0);
const x = ref(props.x ?? 0);
const y = ref(props.y ?? 0);

const root = ref<HTMLDivElement>();
const title = ref<HTMLDivElement>();
const resizeHandle = ref<HTMLDivElement>();

const trackableWindowPosition = useTrackableXYv2(x, y, { minX: 0, minY: 0 });
const trackableResizeHandle = useTrackableXYv2(width, height, { minY: 64 });

function bringMeToTheTop() {
    if (!root.value) return;
    const traversed = traverse<HTMLElement>(root.value, v => v.classList.contains("container"), v => v.parentElement);
    if (traversed && traversed.lastElementChild != root.value) {
        traversed.append(root.value);
        emits("focused");
    }
}

function rootClick(event: PointerEvent) {
    bringMeToTheTop();
}

watch(visible, newVal => {
    if (!newVal) return;
    emits("focused");
    nextTick(() => bringMeToTheTop());
});

onMounted(() => {
    if (!root.value) return;
    const traversed = traverse<HTMLElement>(root.value, v => v.classList.contains("container"), v => v.parentElement);
    if (traversed && traversed.lastElementChild == root.value) emits("focused");

    let childrenObserver = new MutationObserver(() => {
        if (!root.value) return;
        const traversed = traverse<HTMLElement>(root.value, v => v.classList.contains("container"), v => v.parentElement);
        if (traversed && traversed.lastElementChild == root.value) emits("focused");
    });
    childrenObserver.observe(root.value.parentElement!, { childList: true });
});
</script>

<template>
    <div class="window" ref="root" v-if="props.visible" @pointerdown="rootClick" :style="{
        width: `${width}px`,
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`
    }">
        <div class="titlebar">
            <slot name="title-left"></slot>
            <div class="title" ref="title" @pointerdown="trackableWindowPosition">{{ props.title }}</div>
            <slot name="title-right"></slot>
        </div>
        <slot name="toolsbars"></slot>
        <div class="content">
            <slot></slot>
        </div>
        <div class="resize-handle" ref="resizeHandle" @pointerdown="trackableResizeHandle" v-if="resizable != undefined"></div>
    </div>
</template>

<style scoped lang="scss">
.window {
    position: absolute;
    flex-direction: column;
    user-select: none;
    background-color: #111111;
    box-shadow: 0px 2px 12px #000000;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #050505;
    display: flex;

    &:last-child {
        border: 1px solid var(--color-accent);
    }
    
    .titlebar {
        position: relative;
        height: 24px;
        display: flex;
        touch-action: none;
        background-color: #ffffff0f;
        border-radius: 6px 6px 0 0;
        padding: 4px;
    
        * {
            display: inline-block;
            transition: 0.1s background-color;

            &:hover {
                background-color: #0000007f;
            }

            &:active {
                background-color: #000000ff;
            }
        }
    
        .title {
            border-radius: 8px;
            padding: 0 6px;
            cursor: grab;
            font-size: 14px;
            flex: 1 1 auto;
            margin: 0 2px;

            &:active {
                cursor: grabbing;
            }
        }
    }
    
    .content {
        border-top: 2px solid #070707;
        display: block;
        position: relative;
        overflow: auto;
        height: calc(100% - 24px);
    }

    .resize-handle {
        position: relative;
        touch-action: none;
        
        &::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            right: 0;
            bottom: 0;

            border-left: 8px solid transparent;
            border-top: 8px solid transparent;
            border-right: 8px solid #ffffff0f;
            border-bottom: 8px solid #ffffff0f;

            cursor: nw-resize;
        }

        &:hover::before {
            border-right: 8px solid #ffffff4f;
            border-bottom: 8px solid #ffffff4f;
        }

        &:active::before {
            border-right: 8px solid var(--color-accent);
            border-bottom: 8px solid var(--color-accent);
        }
    }
}
</style>