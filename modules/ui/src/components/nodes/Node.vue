<script setup lang="ts">
import type { INode, IPort } from '@mixery/engine';
import { computed, onMounted, ref } from 'vue';
import NodePort from './NodePort.vue';
import { useTrackableXY } from '../composes';

const props = defineProps<{
    node: INode<any, any>
}>();

const nodeName = computed({
    get() { return props.node.nodeName ?? props.node.nodeId; },
    set(v) { props.node.nodeName = v; }
});

const moveHandle = ref<HTMLDivElement>();
const nodeX = ref(0);
const nodeY = ref(0);

onMounted(() => {
    useTrackableXY(moveHandle.value!, nodeX, nodeY);
});
</script>

<template>
    <div class="node" :style="{ left: `${nodeX}px`, top: `${nodeY}px` }">
        <div class="node-name" ref="moveHandle">{{ nodeName }}</div>
        <div class="node-ports-in" v-for="port in props.node.getInputPorts()">
            <NodePort type="input" :port="port" />
        </div>
        <div class="node-ports-out" v-for="port in props.node.getOutputPorts()">
            <NodePort type="output" :port="port" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.node {
    position: absolute;
    width: 150px;
    background-color: #1f1f1f;
    border-radius: 4px;
    box-shadow: 0 1px 3px #000000;

    .node-name {
        height: 20px;
        line-height: 1.6;
        background-color: #58371c;
        border-radius: 4px 4px 0 0;
        padding: 0 12px;
        border-bottom: 2px solid #161616;
        cursor: move;
    }
}
</style>