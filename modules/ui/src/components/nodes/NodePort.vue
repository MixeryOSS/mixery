<script setup lang="ts">
import type { INode, IPort } from '@mixery/engine';

const props = defineProps<{
    type: "input" | "output",
    port: IPort<any>
}>();
</script>

<template>
    <div class="node-port" :class="{ right: props.type == 'output' }">
        <div class="port-name">{{ props.port.portName ?? props.port.portId }}</div>
        <div class="port-symbol midi" v-if="props.port.type == 'mixery:midi'"></div>
        <div class="port-symbol unknown" v-else></div>
    </div>
</template>

<style scoped lang="scss">
.node-port {
    position: relative;
    width: 150px;
    height: 24px;

    &:hover {
        background-color: #ffffff1f;
    }

    .port-name {
        padding: 0 12px;
    }

    .port-symbol {
        position: absolute;
        top: 50%;
        translate: -50% -50%;
        border: 2px solid #0e0e0e;
        width: 8px;
        height: 8px;

        &:hover {
            border: 2px solid #ffffff;
        }

        &.midi {
            background-color: #ffb444;
            rotate: 45deg;
        }

        &.unknown {
            background-color: #ff6044;
        }
    }

    &.right > .port-symbol {
        right: -12px;
    }
}
</style>