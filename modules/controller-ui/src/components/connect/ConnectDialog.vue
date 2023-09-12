<script setup lang="ts">
import { Controller } from '@/Controller';
import { computed, ref } from 'vue';

const updateHandle = ref(0);
const midiInput = computed(() => (updateHandle.value, Controller.getCurrentMidiInput()));
const midiOutput = computed(() => (updateHandle.value, Controller.getCurrentMidiOutput()));

const midiAccess = await Controller.getMidiAccess();
const inputDevices = [...midiAccess.inputs.keys()].map(v => midiAccess.inputs.get(v));
const outputDevices = [...midiAccess.outputs.keys()].map(v => midiAccess.outputs.get(v));

async function useDevice(dev: MIDIPort) {
    await Controller.useMidiPort(dev);
    updateHandle.value++;
}
</script>

<template>
    <div class="connect-dialog">
        <div class="section">
            <div class="title">MIDI devices</div>
            <div class="midi-view">
                <div class="midi-device">
                    <div class="label">{{ (midiInput?.name ?? midiInput?.id) || "Not selected" }}</div>
                    <div class="label small">{{ midiInput?.manufacturer }}</div>
                    <div class="label small comment">{{ midiInput?.id || "Select device below" }}</div>
                </div>
                <div class="arrow"></div>
                <div class="midi-controller">Controller</div>
                <div class="arrow"></div>
                <div class="midi-device">
                    <div class="label">{{ (midiOutput?.name ?? midiOutput?.id) || "Not selected" }}</div>
                    <div class="label small">{{ midiOutput?.manufacturer }}</div>
                    <div class="label small comment">{{ midiOutput?.id || "Select device below" }}</div>
                </div>
            </div>
            <div class="section">
                <div class="title">Inputs</div>
                <div class="midi-device" v-for="dev in inputDevices" @click="useDevice(dev!)">
                    <div class="label">{{ (dev?.name ?? dev?.id) || "Unknown device" }}</div>
                    <div class="label small">{{ dev?.manufacturer }}</div>
                    <div class="label small comment">{{ dev?.id }}</div>
                </div>
            </div>
            <div class="section">
                <div class="title">Outputs</div>
                <div class="midi-device" v-for="dev in outputDevices" @click="useDevice(dev!)">
                    <div class="label">{{ (dev?.name ?? dev?.id) || "Unknown device" }}</div>
                    <div class="label small">{{ dev?.manufacturer }}</div>
                    <div class="label small comment">{{ dev?.id }}</div>
                </div>
            </div>
        </div>
        <div class="section">
            <div class="title">Mixery Controller</div>
            <div class="label">Connect to Mixery Controller host over network.</div>
            <div class="section">
                <div class="title">Host mode</div>
                <div class="label">Scan QR code from your phone: TODO</div>
            </div>
            <div class="section">
                <div class="title">Controller mode</div>
                <div class="label">Click here to scan QR code: TODO</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.connect-dialog {
    position: absolute;
    width: 400px;
    top: 36px; left: 8px;
    z-index: 1;
    padding: 8px;
    background-color: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: 6px;
    box-shadow: 0 0 8px #000000;

    .section {
        padding: 12px 12px 5px 12px;
        border: 2px solid #4c4c4c;
        border-radius: 8px;
        margin-top: 12px;
        position: relative;

        &:first-child {
            margin-top: 4px;
        }

        .title {
            position: absolute;
            top: -10px;
            left: 8px;
            font-size: 12px;
            background-color: var(--color-background);
            height: 18px;
            padding: 0 4px;
        }

        .label {
            &.comment { color: #7f7f7f; font-style: italic; }
            &.small { font-size: 12px; }
        }
    }
}

.midi-device {
    flex: 1 1 auto;
    padding: 4px 0;

    .label {
        line-height: 1.2;
    }
}

.midi-view {
    display: flex;
    flex-direction: row;

    .midi-device, .midi-controller {
        border: 2px solid #7f7f7f;
        border-radius: 8px;
        margin: 4px;
        transition: 0.1s linear border;

        &:hover {
            border: 2px solid #efefef;
        }
    }

    .midi-controller {
        align-self: center;
        padding: 2px 6px;
    }

    .arrow {
        width: 0;
        height: 0;
        border-left: 6px solid #efefef;
        border-top: 12px solid transparent;
        border-bottom: 12px solid transparent;
        align-self: center;
    }

    .midi-device {
        padding: 6px 8px;
    }
}
</style>