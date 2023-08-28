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

import * as engine from "@mixery/engine";
import { onMounted, ref, watch } from "vue";
import { GlobalRenderers } from "@/canvas/GlobalRenderers";
import type { ContextMenuEntry } from "../contextmenus/ContextMenuEntry";

const props = defineProps<{
    workspaceId: string
}>();

const contextMenu = ref<ContextMenuEntry[]>();
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// TODO: sync BPM and time to project
const bpm = ref(120);
const time = ref(0);
const sharedSeekPointer = ref(0);

const pianoRollVisible = ref(true);
const patternEditorVisible = ref(true);
const nodesEditorVisible = ref(true);

watch(sharedSeekPointer, () => GlobalRenderers.sendRedrawRequest());
</script>

<template>
    <div class="workspace">
        <div class="toolsbar">
            <WorkspaceToolsbarButton is-icon accent><MixeryIcon type="mixery" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton>File</WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton>Help</WorkspaceToolsbarButton>
            <div class="separator"></div>
            <Digital1DSlider name="BPM" display-mode="decimal" v-model="bpm" :min=10 :max=1000 />
            <Digital1DSlider name="Time" display-mode="time" v-model="time" :min=0 />
            <div class="separator"></div>
            <WorkspaceToolsbarButton @pointerdown="patternEditorVisible = !patternEditorVisible" :highlight="patternEditorVisible" is-icon><MixeryIcon type="pattern" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton @pointerdown="pianoRollVisible = !pianoRollVisible" :highlight="pianoRollVisible" is-icon><MixeryIcon type="piano" /></WorkspaceToolsbarButton>
            <WorkspaceToolsbarButton @pointerdown="nodesEditorVisible = !nodesEditorVisible" :highlight="nodesEditorVisible" is-icon><MixeryIcon type="nodes" /></WorkspaceToolsbarButton>
            <div class="separator"></div>
            <WorkspaceToolsbarButton>Project Name</WorkspaceToolsbarButton>
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
                <SettingsWindow :workspace-id="props.workspaceId" :visible="false" />
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