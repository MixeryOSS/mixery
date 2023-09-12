<script setup lang="ts">
import Toolsbar from './components/Toolsbar.vue';
import ToolsbarButton from './components/ToolsbarButton.vue';
import ModulesContainer from './components/modules/ModulesContainer.vue';
import KeyboardModule from './components/modules/KeyboardModule.vue';
import { ref } from 'vue';
import type { Modules } from './components/Modules';
import { Controller } from './Controller';
import DrumPadModule from './components/modules/DrumPadModule.vue';
import { ModulesCollision } from './ModulesCollision';
import ConnectDialog from './components/connect/ConnectDialog.vue';

// TODO load layout from user storage
const modules = ref<Modules.Module[]>([]);
modules.value.push({
    type: "keyboard",
    x: 2, y: 0, width: 5, height: 2,
    channel: 0
});
modules.value.push({
    type: "drumpad",
    x: 0, y: 0, width: 2, height: 2,
    channel: 0,
    matrix: [4, 4]
});

function updateCollision(target: Modules.Module) {
    ModulesCollision.process(modules, target);
}

const connectDialog = ref(false);
</script>

<template>
    <div class="parent">
        <Toolsbar>
            <ToolsbarButton @click="connectDialog = !connectDialog">Connect</ToolsbarButton>
            <ToolsbarButton>Add</ToolsbarButton>
        </Toolsbar>
        <ModulesContainer class="modules-container">
            <template v-for="m in modules">
                <KeyboardModule
                    v-if="m.type == 'keyboard'"
                    v-model:x="m.x"
                    v-model:y="m.y"
                    v-model:width="m.width"
                    v-model:height="m.height"
                    v-model:channel="m.channel"
                    @update-collision="updateCollision(m)"
                />
                <DrumPadModule
                    v-if="m.type == 'drumpad'"
                    v-model:x="m.x"
                    v-model:y="m.y"
                    v-model:width="m.width"
                    v-model:height="m.height"
                    v-model:channel="m.channel"
                    v-model:matrix="m.matrix"
                    @update-collision="updateCollision(m)"
                >
                    <template v-slot:pad-1-1>
                        Drum
                    </template>
                </DrumPadModule>
            </template>
        </ModulesContainer>
        <Suspense v-if="connectDialog"><ConnectDialog /></Suspense>
    </div>
</template>

<style scoped lang="scss">
.parent {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    user-select: none;
    overscroll-behavior: none;

    .modules-container {
        flex: 1 1 auto;
    }
}
</style>
