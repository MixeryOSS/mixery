<script setup lang="ts">
import ExplorerPane from "./ExplorerPane.vue";
import WindowsContainer from "../windows/WindowsContainer.vue";
import Digital1DSlider from "../knobs/Digital1DSlider.vue";
import WorkspaceToolsbarButton from "./WorkspaceToolsbarButton.vue";
import MixeryIcon from "../icons/MixeryIcon.vue";
import PianoRoll from "./PianoRoll.vue";
import PatternEditor from "./PatternEditor.vue";
import ExplorerEntry from "../workspace/explorer/ExplorerEntry.vue";
import NodesEditor from "./NodesEditor.vue";
import SettingsWindow from "./SettingsWindow.vue";
import ContextMenu from "../contextmenus/ContextMenu.vue";

import { computed, ref, watch } from "vue";
import type { ContextMenuEntry } from "../contextmenus/ContextMenuEntry";
import { traverse } from "@/utils";
import { MixeryUI } from "@/handling/MixeryUI";
import { RenderingHelper } from "@/canvas/RenderingHelper";

const props = defineProps<{
    workspaceId: string
}>();

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }

function sliders$changeBpm(bpm: number) {
    const ws = getWorkspace();
    if (ws.player.isPlaying) return; // Can't change BPM while playing
    ws.project.bpm = bpm;
}

const root = ref<HTMLDivElement>();
const contextMenu = ref<ContextMenuEntry[]>();
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// TODO: sync BPM and time to project
const time = ref(0);
const sharedSeekPointer = ref(0);

const pianoRollVisible = ref(true);
const patternEditorVisible = ref(true);
const nodesEditorVisible = ref(true);
const settingsWindowVisible = ref(false);

watch(sharedSeekPointer, () => getWorkspace().rendering.redrawRequest(
    RenderingHelper.Keys.SeekPointer
));

function openToolsbarContextMenu(event: MouseEvent, menu: ContextMenuEntry[]) {
    const traversed = traverse(event.target as HTMLElement, v => v.classList.contains("toolsbar-button"), v => v.parentElement);

    if (traversed) {
        const box = traversed.getBoundingClientRect();
        const rootBox = root.value!.getBoundingClientRect();
        contextMenuX.value = box.left - rootBox.left;
        contextMenuY.value = box.top - rootBox.top + box.height;
    }

    contextMenu.value = menu;
}

function openUrl(url: string) {
    window.open(url);
}

document.fonts.ready.then(() => {
    console.log("Fonts loaded, redrawing...");
    getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.All);
});
</script>

<template>
    <div class="workspace" ref="root">
        <div class="toolsbar">
            <WorkspaceToolsbarButton
                is-icon accent
                @click="openToolsbarContextMenu($event, [
                    {
                        label: 'Settings',
                        // @ts-ignore
                        onClick() { settingsWindowVisible = true; }
                    }
                ])"
            ><MixeryIcon type="mixery" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton>File</WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton
                @click="openToolsbarContextMenu($event, [
                    {
                        label: 'Issues Tracker',
                        onClick() { openUrl('https://github.com/MixeryOSS/issues-tracker/issues'); },
                    },
                    {
                        label: 'Source Code',
                        onClick() { openUrl('https://github.com/MixeryOSS'); },
                    },
                    {
                        label: 'About'
                    }
                ])"
            >
                Help
            </WorkspaceToolsbarButton>
            <div class="separator"></div>
            <WorkspaceToolsbarButton is-icon><MixeryIcon type="metronome-left" /></WorkspaceToolsbarButton>
            <Digital1DSlider
                name="BPM"
                display-mode="decimal"
                :model-value="getWorkspace().project.bpm"
                @update:model-value="sliders$changeBpm($event); $forceUpdate()"
                :min=10 :max=1000
            />
            <div class="separator"></div>
            <WorkspaceToolsbarButton is-icon><MixeryIcon type="play" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton is-icon><MixeryIcon type="stop" /></WorkspaceToolsbarButton>
            <Digital1DSlider name="Time" display-mode="time" v-model="time" :min=0 />
            <div class="separator"></div>
            <WorkspaceToolsbarButton @pointerdown="patternEditorVisible = !patternEditorVisible" :highlight="patternEditorVisible" is-icon><MixeryIcon type="pattern" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton @pointerdown="pianoRollVisible = !pianoRollVisible" :highlight="pianoRollVisible" is-icon><MixeryIcon type="piano" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton @pointerdown="nodesEditorVisible = !nodesEditorVisible" :highlight="nodesEditorVisible" is-icon><MixeryIcon type="nodes" /></WorkspaceToolsbarButton>
        </div>
        <div class="vertical-flex">
            <ExplorerPane>
                <ExplorerEntry>
                    <template v-slot:icon><MixeryIcon type="mixery" /></template>
                    Mango
                </ExplorerEntry>
                <ExplorerEntry draggable>Sech</ExplorerEntry>
                <ExplorerEntry>EZ</ExplorerEntry>
            </ExplorerPane>
            <WindowsContainer class="wcontainer">
                <PatternEditor
                    v-model:visible="patternEditorVisible"
                    :workspace-id="props.workspaceId"
                    v-model:seek-pointer="sharedSeekPointer" />
                <PianoRoll
                    v-model:visible="pianoRollVisible"
                    :workspace-id="props.workspaceId"
                    v-model:seek-pointer="sharedSeekPointer" />
                <NodesEditor
                    v-model:visible="nodesEditorVisible"
                    :workspace-id="props.workspaceId"
                    v-model:context-menu="contextMenu"
                    v-model:context-menu-x="contextMenuX"
                    v-model:context-menu-y="contextMenuY" />
                <SettingsWindow :workspace-id="props.workspaceId" v-model:visible="settingsWindowVisible" />
            </WindowsContainer>
        </div>
        <ContextMenu
            :x="contextMenuX"
            :y="contextMenuY"
            :menu="contextMenu"
            @close-menu="contextMenu = undefined"
            v-if="contextMenu" />
    </div>
</template>

<style scoped lang="scss">
.workspace {
    display: flex;
    flex-direction: column;

    .toolsbar {
        display: flex;
        height: 40px;
        padding: 8px;
        background-color: #ffffff0f;
        border-bottom: 2px solid #070707;

        .separator {
            width: 2px;
            background-color: #ffffff1f;
            margin: 0 6px;
        }
    }

    .vertical-flex {
        display: flex;
        height: calc(100% - 58px);

        .wcontainer {
            flex: 1 1 auto;
        }
    }
}
</style>