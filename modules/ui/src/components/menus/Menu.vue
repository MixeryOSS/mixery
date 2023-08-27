<script setup lang="ts">
import { ref } from 'vue';

const root = ref<HTMLDivElement>();
const visible = ref(false);

defineExpose({
    openToolbarMenu(event: MouseEvent) {
        root.value!.style.left = `${(event.target as HTMLElement).offsetLeft}px`;
        root.value!.style.top = `${(event.target as HTMLElement).offsetTop + (event.target as HTMLElement).offsetHeight}px`;
        visible.value = true;
    },
    close() {
        visible.value = false;
    }
});
</script>

<template>
    <div class="menu" ref="root" v-show="visible">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.menu {
    position: absolute;
    flex-direction: column;
    user-select: none;
    background-color: #111111;
    box-shadow: 0px 2px 12px #000000;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #050505;
    display: flex;
    padding: 4px;
    z-index: 1;
}
</style>