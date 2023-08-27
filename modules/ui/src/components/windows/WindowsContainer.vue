<script setup lang="ts">
import { onMounted, ref } from 'vue';

const containerSlot = ref<HTMLDivElement>();

function traverse<T>(key: T | null, predicate: (value: T) => boolean, traverseFunc: (value: T) => T | null): T | null {
    do {
        if (key == null) return null;
        if (predicate(key)) return key;
        key = traverseFunc(key);
    } while (true);
}

onMounted(() => {
    containerSlot.value?.addEventListener("mousedown", event => {
        const window = traverse(
            event.target as HTMLElement,
            v => v.classList.contains("window") || v == containerSlot.value,
            v => v.parentElement
        );

        if (window == containerSlot.value || window == null) return;
        if (containerSlot.value?.lastElementChild == window) return;
        containerSlot.value?.appendChild(window);
    });
});
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