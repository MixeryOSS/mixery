<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { ContextMenuEntry } from './ContextMenuEntry';
import { traverse } from '@/utils';

const props = defineProps<{
    x: number,
    y: number,
    menu: ContextMenuEntry[]
}>();
const emits = defineEmits(["close-menu"]);
const root = ref<HTMLDivElement>();
const submenuRef = ref<ContextMenuEntry[]>();
const submenuX = ref(0);
const submenuY = ref(0);

function entryClicked(event: PointerEvent | MouseEvent, entry: ContextMenuEntry) {
    const traversed = traverse(event.target as HTMLElement, v => v.classList.contains("entry"), v => v.parentElement);

    if (entry.submenu) {
        const rootBox = root.value?.getBoundingClientRect();
        submenuX.value = (rootBox?.width ?? 0) - 4;
        submenuY.value = (traversed?.getBoundingClientRect().top ?? 0) - (rootBox?.top ?? 0) - 4;
        submenuRef.value = entry.submenu;
    } else {
        if (entry.onClick) entry.onClick();
        emits("close-menu", true);
    }
}

function document$pointerDown(event: PointerEvent) {
    const traversed = traverse(
        event.target as HTMLElement,
        v => v == root.value || v == document.body || v.classList.contains("context-menu"),
        v => v.parentElement);
    if (traversed == root.value) return;
    if (traversed == document.body) emits("close-menu", true);
    if (traversed?.parentElement == root.value) return;
    emits("close-menu", false);
}

onMounted(() => {
    document.addEventListener("pointerdown", document$pointerDown);
});

onUnmounted(() => {
    document.removeEventListener("pointerdown", document$pointerDown);
});
</script>

<template>
    <div class="context-menu" ref="root" :style="{ left: `${props.x}px`, top: `${props.y}px` }">
        <div class="content">
            <div class="entry" v-for="entry in props.menu" :class="{ submenu: !!entry.submenu }">
                <div class="label" @click="entryClicked($event, entry)">{{ entry.label }}</div>
            </div>
        </div>
        <ContextMenu
            :x="submenuX"
            :y="submenuY"
            :menu="submenuRef"
            @close-menu="submenuRef = undefined; if ($event) emits('close-menu', true);"
            v-if="submenuRef"
        />
    </div>
</template>

<style scoped lang="scss">
.context-menu {
    position: absolute;
    user-select: none;

    .content {
        display: flex;
        flex-direction: column;
        background-color: var(--color-background);
        border-radius: 8px;
        border: 1px solid #050505;
        padding: 4px;
        box-shadow: 0 0 12px #000000;

        &:last-child {
            border: 1px solid var(--color-accent);
        }

        .entry {
            height: 20px;
            padding: 3px 6px;
            line-height: 1.6;
            border-radius: 4px;
            transition: 0.1s background-color;
            white-space: pre;
            position: relative;

            &:hover {
                background-color: #ffffff1f;
            }

            &.submenu {
                padding-right: 16px;

                &::after {
                    content: '';
                    position: absolute;
                    right: 4px; top: 50%;
                    translate: 0 -50%;
                    border-left: 6px solid #ffffff;
                    border-top: 6px solid transparent;
                    border-bottom: 6px solid transparent;
                }
            }
        }
    }
}
</style>