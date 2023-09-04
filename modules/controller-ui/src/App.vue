<script setup lang="ts">
import Toolsbar from './components/Toolsbar.vue';
import ToolsbarButton from './components/ToolsbarButton.vue';
import ModulesContainer from './components/modules/ModulesContainer.vue';
import KeyboardModule from './components/modules/KeyboardModule.vue';
import { ref } from 'vue';
import type { Modules } from './components/Modules';
import { LocalControllerConnection } from '@mixery/controller';
import { Controller } from './Controller';
import DrumPadModule from './components/modules/DrumPadModule.vue';
import { ModulesCollision } from './ModulesCollision';

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

const connectState = ref<"disconnected" | "connecting" | "connected">("disconnected");

async function connect() {
    const { client, host } = LocalControllerConnection.createPair(3000);
    Controller.connection = client;
    connectState.value = "connecting";

    try {
        await client.whenConnected;
        connectState.value = "connected";
        host.listenForMessages(console.log);
    } catch (e) {
        connectState.value = "disconnected";
    }
}

function updateCollision(target: Modules.Module) {
    ModulesCollision.process(modules, target);
}
</script>

<template>
    <div class="parent">
        <Toolsbar>
            <ToolsbarButton
                class="connect-button"
                :class="{
                    connecting: connectState == 'connecting',
                    connected: connectState == 'connected'
                }"
                @click="connect"
            >{{ connectState[0].toUpperCase() }}{{ connectState.substring(1) }}</ToolsbarButton>
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

    .connect-button {
        --color-indicator: #ff7f7f;
        color: var(--color-indicator);
        transition: 0.5s linear color;

        &::before {
            content: '';
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 1000px;
            background-color: var(--color-indicator);
            margin-right: 8px;
            transition: 0.5s linear background-color;
        }

        &.connecting { --color-indicator: #ffff7f; }
        &.connected { --color-indicator: #7fff7f; }

        &.connecting::before, &.connected::before {
            @keyframes tetherAnimation {
                0% {
                    box-shadow: 0 0 0 0 var(--color-indicator);
                }
                50% {
                    box-shadow: 0 0 0 8px transparent;
                }
                100% {
                    box-shadow: 0 0 0 8px transparent;
                }
            }

            animation: 2s infinite linear tetherAnimation;
        }
    }
}
</style>
