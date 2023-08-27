<script setup lang="ts">
const props = defineProps<{
    isIcon?: boolean,
    highlight?: boolean
}>();
</script>

<template>
    <div class="titlebar-button" :class="{ icon: props.isIcon, hightlight: props.highlight }">
        <slot>???</slot>
    </div>
</template>

<style scoped lang="scss">
.titlebar-button {
    padding: 0 6px;
    font-size: 14px;
    border-radius: 8px;
    transition: 0.1s background-color, 0.2s box-shadow, 0.2s color;
    margin: 0 1px;

    &:first-child {
        margin-left: 0;
    }

    &:last-child {
        margin-right: 0;
    }

    &.icon {
        padding: 2px;
    }

    &:hover {
        background-color: #0000007f;
    }

    &:active, &.hightlight {
        background-color: #000000ff;
    }

    &.hightlight {
        box-shadow: inset 0 0 0 1.2px var(--color-accent);
        color: var(--color-accent);
    }
}
</style>

<style lang="scss">
.titlebar-button.icon > svg {
    width: 20px;
    height: 20px;
}
</style>