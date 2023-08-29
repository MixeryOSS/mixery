<script setup lang="ts">
import { traverse } from '@/utils';
import type { IFileResource, IFolderResource, IResource } from '@mixery/engine';
import { computed, ref, toRaw, watch } from 'vue';
import MixeryIcon from '@/components/icons/MixeryIcon.vue';
import { MixeryUI } from '@/handling/MixeryUI';

interface ResourceHolder {
    label?: string;
    resource: IResource;
}

const props = defineProps<{
    workspaceId: string,
    res: ResourceHolder
}>();

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }

const expanded = ref(false);
const content = ref<ResourceHolder[]>([]);
const main = ref<HTMLDivElement>();
const icon = computed(() => {
    if (props.res.resource.isFolder) {
        return expanded.value? "folder-open" : "folder-close";
    } else {
        switch (props.res.resource.blob.type) {
            case "application/x.mixery.noteclips": return "piano";
            case "audio/wav":
            case "audio/mp3":
            case "audio/ogg":
                return "mixery"; // TODO
            default: return "mixery";
        }
    }
});

watch(expanded, async () => {
    if (expanded.value) {
        let arr: ResourceHolder[] = [];
        const res = toRaw(props.res.resource);
        if (res.isFolder) {
            const folder = res as IFolderResource;
            const children = folder.children;
            for (let i = 0; i < children.length; i++) {
                arr.push({
                    label: children[i],
                    resource: await res.store.getResource({
                        namespace: res.path.namespace,
                        path: [...res.path.path, children[i]]
                    })
                });
            }
        }

        content.value = arr;
    } else {
        content.value = [];
    }
});

function onClick(event: PointerEvent) {
    const traversed = traverse(event.target as HTMLElement, v => v == main.value, v => v.parentElement);
    if (traversed != main.value) return;

    if (props.res.resource.isFolder) {
        expanded.value = !expanded.value;
    } else if (props.res.resource.isFile) {
        if (props.res.resource.blob.type.startsWith("audio/")) {
            props.res.resource.getAudioBuffer().then(async buffer => {
                const audioCtx = getWorkspace().workspace.audio;
                if (audioCtx instanceof AudioContext && audioCtx.state != "running") await audioCtx.resume();

                const bufferNode = audioCtx.createBufferSource();
                bufferNode.buffer = buffer;
                bufferNode.connect(audioCtx.destination);
                bufferNode.start();
            });
        }
    }
}

let fileUrl: string | undefined;

function onDragHandleStart(event: DragEvent) {
    if (props.res.resource.isFolder) return;

    if (event.dataTransfer) {
        const name = props.res.label ?? props.res.resource.path.path[props.res.resource.path.path.length - 1];
        const res = toRaw(props.res.resource) as IFileResource;
        if (!fileUrl) fileUrl = URL.createObjectURL(res.blob);
        event.dataTransfer.setData("DownloadURL", `${res.blob.type}:${name}:${fileUrl}`);
        event.dataTransfer.setData("application/x.mixery.resource", JSON.stringify({
            workspaceId: props.workspaceId,
            path: res.path
        }));
        event.dataTransfer.effectAllowed = "all";
        if (main.value) event.dataTransfer.setDragImage(main.value, 0, 0);
    }
}

function onDragHandleEnd(event: DragEvent) {
    if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        fileUrl = undefined;
    }
}

function onDragOver(event: DragEvent) {
    if (!props.res.resource.isFolder) return;
    
    if (event.dataTransfer) {
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            const item = event.dataTransfer.items[i];

            if (item.kind == "file") {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                return;
            }

            if (item.kind == "string" && item.type == "application/x.mixery.resource") {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                return;
            }
        }
    }
}

function onDrop(event: DragEvent) {
    if (!props.res.resource.isFolder) return;
    event.preventDefault();
    
    if (event.dataTransfer) {
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            const item = event.dataTransfer.items[i];

            if (item.kind == "file") {
                const file = item.getAsFile()!;
                const folder = toRaw(props.res.resource) as IFolderResource;
                folder.store.putResource({
                    namespace: folder.path.namespace,
                    path: [...folder.path.path, file.name]
                }, file)
                .then(resource => {
                    content.value.push({
                        label: file.name,
                        resource
                    });
                });
            }
        }
    }
}
</script>

<template>
    <div class="entry" :class="{ file: props.res.resource.isFile }" @pointerdown="onClick">
        <div class="main" ref="main" @dragover="onDragOver" @drop="onDrop">
            <div class="icon"><MixeryIcon :type="icon" /></div>
            <div class="entry-text">{{ props.res.label ?? props.res.resource.path.path[props.res.resource.path.path.length - 1] }}</div>
            <div class="drag-handle" v-if="props.res.resource.isFile" @dragstart="onDragHandleStart" @dragend="onDragHandleEnd" draggable="true"></div>
        </div>
        <div class="child" v-if="expanded">
            <Suspense>
                <ExplorerEntry v-for="entry in content" :res="entry" :workspace-id="props.workspaceId" />
            </Suspense>
        </div>
    </div>
</template>

<style scoped lang="scss">
.entry {
    display: flex;
    flex-direction: column;
    user-select: none;
    --size: 36px;
    padding-left: 8px;

    .main {
        display: flex;
        height: var(--size);
        border-bottom: 2px solid #0000005f;

        .icon {
            width: var(--size);
            height: var(--size);
            min-width: var(--size);
            min-height: var(--size);
        }

        .entry-text {
            flex: 1 1 auto;
            align-self: center;
            padding-left: 8px;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .drag-handle {
            width: 24px;
            position: relative;
            cursor: grab;

            &::before {
                content: '';
                position: absolute;
                left: calc((100% - 10px) / 2);
                top: calc((100% - 16px) / 2);
                width: 3px;
                height: 3px;
                border-radius: 1000px;
                --color: #ffffff3f;
                background-color: var(--color);
                box-shadow: 6px 0 var(--color),
                    0 6px var(--color), 6px 6px var(--color),
                    0 12px var(--color), 6px 12px var(--color);
            }

            &:active {
                cursor: grabbing;
            }
        }
    }

    .child {
        display: flex;
        flex-direction: column;
        background-color: #0000003f;
        padding-left: 12px;
    }
}
</style>

<style lang="scss">
.entry > .main > .icon > svg {
    width: var(--size);
    height: var(--size);
}
</style>