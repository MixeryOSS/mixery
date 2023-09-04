<template>
    <div class="toolsbar-button">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.toolsbar-button {
    user-select: none;
    align-self: center;
    height: fit-content;
    touch-action: none;
    height: 24px;
    padding: 2px 12px;
    border-radius: 4px;
    transition: 0.1s linear background-color;
    
    &:active {
        background-color: #070707;
    }
}
</style>