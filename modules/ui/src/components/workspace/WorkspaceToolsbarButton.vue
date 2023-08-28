<script setup lang="ts">
const props = defineProps<{
    isIcon?: boolean,
    highlight?: boolean,
    accent?: boolean
}>();
</script>

<template>
    <div class="toolsbar-button" :class="{ icon: props.isIcon, highlight: props.highlight, accent: props.accent }">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.toolsbar-button {
    padding: 2px 6px;
    align-self: center;
    user-select: none;
    cursor: pointer;
    border-radius: 6px;
    transition: 0.1s background-color, 0.1s color, 0.2s box-shadow;
    margin: 0 1px;

    &:first-child {
        margin: 0;
    }

    &.icon {
        padding: 0;
        width: 40px;
        height: 40px;
    }

    &:hover {
        background-color: #0000007f;

        &.accent {
            color: var(--color-accent);
        }
    }

    &:active, &.highlight {
        background-color: #000000af;

        &.accent {
            color: var(--color-accent);
        }
    }

    &.highlight {
        box-shadow: inset 0 0 0 1.2px #9f9f9f;

        &.accent {
            box-shadow: inset 0 0 0 1.2px var(--color-accent);
        }
    }
}
</style>

<style lang="scss">
.toolsbar-button.icon > svg {
    width: 40px;
    height: 40px;
}
</style>