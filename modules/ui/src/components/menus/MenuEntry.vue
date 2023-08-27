<template>
    <div class="menu-entry" ref="root">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.menu-entry {
    padding: 0 6px;
    user-select: none;
    cursor: pointer;
    border-radius: 8px;
    transition: 0.1s background-color, 0.5s opacity;

    &.icon {
        padding: 0;
        width: 40px;
        height: 40px;
    }

    &:hover {
        background-color: #0000007f;
    }

    &:active {
        background-color: #000000af;
    }
}
</style>