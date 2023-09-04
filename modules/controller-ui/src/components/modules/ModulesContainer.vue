<script setup lang="ts">
import { computed, ref } from 'vue';

const screenWidth = ref(window.innerWidth - 12);
window.addEventListener("resize", () => screenWidth.value = (window.innerWidth - 12));
const moduleSize = computed(() => screenWidth.value / Math.floor(screenWidth.value / 100));
</script>

<template>
    <div class="modules-container" :style="{ '--tile-size': `${moduleSize}px` }">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.modules-container {
    position: relative;
    overflow: scroll;
    background-size: var(--tile-size) var(--tile-size);
    background-image:
        linear-gradient(to right, #ffffff2f, transparent 1px),
        linear-gradient(to bottom, #ffffff2f, transparent 1px);
    background-attachment: local;
}
</style>