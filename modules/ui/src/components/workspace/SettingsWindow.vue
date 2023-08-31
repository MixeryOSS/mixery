<script setup lang="ts">
import MixeryWindow from '../windows/MixeryWindow.vue';
import TitlebarButton from '../windows/TitlebarButton.vue';
import WindowToolsbar from '../windows/WindowToolsbar.vue';
import MixeryIcon from '../icons/MixeryIcon.vue';
import Digital1DSlider from '../knobs/Digital1DSlider.vue';
import Switch from '../knobs/Switch.vue';
import { computed, ref, watch } from 'vue';
import { MixeryUI } from "@/handling/MixeryUI";
import { RenderingHelper } from '@/canvas/RenderingHelper';

const props = defineProps<{
    workspaceId: string,
    visible: boolean
}>();
const emits = defineEmits(["update:visible"]);

const settings = ref(MixeryUI.workspaces.get(props.workspaceId)!.settings);

function redrawAll() {
    MixeryUI.workspaces.get(props.workspaceId)!.rendering.redrawRequest(RenderingHelper.Keys.All);
}

function updateAccentColor() {
    document.body.style.setProperty("--color-accent", `hsl(${settings.value.accentColor[0]}deg, ${settings.value.accentColor[1]}%, ${settings.value.accentColor[2]}%)`);
    redrawAll();
}
</script>

<template>
    <MixeryWindow title="Settings" :width="300" :height="500" :visible="props.visible" resizable>
        <template v-slot:title-right>
            <TitlebarButton is-icon @click="emits('update:visible', !props.visible)"><MixeryIcon type="close" /></TitlebarButton>
        </template>
        <div class="entry">
            <div class="label">Detailed Rendering</div>
            <Switch v-model="settings.fancyRendering" @on-update="redrawAll()" />
        </div>
        <div class="entry" @pointerup="updateAccentColor" @pointermove="updateAccentColor">
            <div class="label">Accent Color</div>
            <Digital1DSlider name="Hue" v-model="settings.accentColor[0]" :min="0" :max="360" />
            <Digital1DSlider name="Sat" v-model="settings.accentColor[1]" :min="0" :max="100" />
            <Digital1DSlider name="Light" v-model="settings.accentColor[2]" :min="0" :max="100" />
        </div>
        <div class="entry">
            <div class="label">Double click timing</div>
            <Digital1DSlider name="Milliseconds" v-model="settings.doubleClickSpeed" :min="50" :max="1000"></Digital1DSlider>
        </div>
    </MixeryWindow>
</template>

<style scoped lang="scss">
.entry {
    display: flex;
    padding: 6px 12px;

    &:hover {
        background-color: #0000005f;
    }

    .label {
        flex: 1 1 auto;
    }
}
</style>