<script setup lang="ts">
const props = defineProps<{
    keybind: string
}>();
</script>

<template>
    <div class="key">{{ props.keybind }}</div>
</template>

<style scoped lang="scss">
.key {
    display: inline-block;
    font-size: 12px;
    user-select: none;
    line-height: 1;
    padding: 2px 4px;
    height: 12px !important;
    background-color: #3c3c3c;
    border: 1px solid #7f7f7f;
    border-radius: 3px;
    box-shadow: 0 3px #070707;
    margin-top: 2px;
}
</style>