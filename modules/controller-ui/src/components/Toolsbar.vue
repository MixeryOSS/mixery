<template>
    <div class="toolsbar">
        <slot></slot>
    </div>
</template>

<style scoped lang="scss">
.toolsbar {
    height: 36px;
    background-color: #252525;
    border-bottom: 2px solid #070707;
    padding: 4px 8px;
    display: flex;
    flex-direction: row;
}
</style>