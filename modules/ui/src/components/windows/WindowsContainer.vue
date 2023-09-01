<script setup lang="ts">
import { ref } from 'vue';

const containerSlot = ref<HTMLDivElement>();
</script>

<template>
    <div class="container" ref="containerSlot">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.container {
    position: relative;
    overflow: scroll;
}
</style>