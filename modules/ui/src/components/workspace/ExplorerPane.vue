<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTrackableXY } from '../composes';
import ExplorerEntry from './explorer/ExplorerEntry.vue';
import { MixeryUI } from '@/handling/MixeryUI';
import type { IResource } from '@mixery/engine';

const props = defineProps<{
    workspaceId: string,
    updateHandle: number
}>();

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }

interface ResourceHolder {
    label?: string;
    resource: IResource;
}

const width = ref(300);
const root = ref<HTMLDivElement>();
const resizer = ref<HTMLDivElement>();
const content = ref<ResourceHolder[]>([]);
const updateHandle = computed(() => props.updateHandle)

async function setExplorerContent() {
    content.value = [
        {
            label: "Project Resources",
            resource: await getWorkspace().project.projectResources.getResource({namespace: "project", path: []})
        }
    ];
}

watch(width, v => root.value!.style.width = `${v}px`);
watch(updateHandle, () => {
    content.value = [];
    nextTick(() => setExplorerContent());
});
setExplorerContent();

onMounted(() => {
    root.value!.style.width = `${width.value}px`;
    useTrackableXY(resizer.value!, width, undefined, { minX: 8, maxX: 1000 });
});
</script>

<template>
    <div class="explorer-pane" ref="root">
        <div class="container">
            <div class="searchbox" contenteditable></div>
            <slot name="header"></slot>
            <div class="content">
                <template v-for="entry in content"><ExplorerEntry :res="entry" :workspace-id="props.workspaceId" /></template>
            </div>
        </div>
        <div class="resizer" ref="resizer"></div>
    </div>
</template>

<style scoped lang="scss">
.explorer-pane {
    .container {
        display: inline-block;
        width: calc(100% - 8px);
        height: 100%;
        vertical-align: top;
        overflow-x: hidden;

        .searchbox {
            height: 24px;
            border-bottom: 2px solid #0000007f;
            overflow-x: scroll;
            overflow-y: hidden;
            padding: 12px 18px;
            outline: none;
            white-space: nowrap;

            &::-webkit-scrollbar {
                display: none;
            }

            &:empty::before {
                content: 'Search...';
                display: inline;
                color: #ffffff7f;
            }
        }

        .content {
            height: calc(100% - 50px);
            overflow-y: scroll;
        }
    }

    .resizer {
        display: inline-block;
        position: relative;
        width: 8px;
        height: 100%;
        vertical-align: top;
        cursor: ew-resize;
        background-color: #ffffff07;
        transition: 0.3s background-color;
        touch-action: none;
        user-select: none;

        &::before {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 1000px;
            background-color: #ffffff3f;
            opacity: 0;
            top: 50%;
            left: 0;
            translate: 0 -50%;
            transition: 0.3s opacity, 0.3s height;
            transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        &:hover {
            background-color: #ffffff1f;

            &::before {
                opacity: 1;
                height: 128px;
            }
        }
    }
}
</style>