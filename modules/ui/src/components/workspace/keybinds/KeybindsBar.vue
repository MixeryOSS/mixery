<script setup lang="ts">
import type { Keybind as Keybind2 } from '@/handling/KeyboardHandler';
import Keybind from './Keybind.vue';

const props = defineProps<{
    keybinds: Keybind2[]
}>();
</script>

<template>
    <div class="keybinds-bar">
        <div class="keybind" v-for="keybind in props.keybinds">
            <Keybind :keybind="keybind.currentKeybind ?? keybind.defaultKeybind" />
            <div class="label">{{ keybind.name ?? keybind.id }}</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.keybinds-bar {
    min-height: 24px;
    height: 24px;
    border-top: 2px solid #070707;
    background-color: #ffffff0f;
    display: flex;
    user-select: none;
    
    .keybind {
        font-size: 12px;
        padding: 0 8px;
        
        > * {
            height: 24px;
            vertical-align: top;
        }

        .label {
            display: inline-block;
            margin-left: 8px;
        }
    }
}
</style>