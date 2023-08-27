<script setup lang="ts">
const props = defineProps<{
    draggable?: boolean
}>();
</script>

<template>
    <div class="entry" :class="{ draggable: props.draggable }">
        <div class="icon">
            <slot name="icon"></slot>
        </div>
        <div class="entry-text">
            <slot></slot>
        </div>
        <div class="drag-handle" v-if="props.draggable"></div>
    </div>
</template>

<style scoped lang="scss">
.entry {
    display: flex;
    height: 48px;
    border-bottom: 2px solid #0000005f;
    user-select: none;

    .icon {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
    }

    .entry-text {
        flex: 1 1 auto;
        align-self: center;
        padding-left: 8px;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .drag-handle {
        width: 24px;
        position: relative;
        cursor: grab;

        &::before {
            content: '';
            position: absolute;
            left: calc((100% - 10px) / 2);
            top: calc((100% - 16px) / 2);
            width: 4px;
            height: 4px;
            border-radius: 1000px;
            --color: #ffffff3f;
            background-color: var(--color);
            box-shadow: 6px 0 var(--color),
                0 6px var(--color), 6px 6px var(--color),
                0 12px var(--color), 6px 12px var(--color);
        }

        &:active {
            cursor: grabbing;
        }
    }
}
</style>

<style lang="scss">
.entry > .icon > svg {
    width: 48px;
    height: 48px;
}
</style>