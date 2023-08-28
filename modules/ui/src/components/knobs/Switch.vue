<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
}>();
const emits = defineEmits(["update:modelValue", "onUpdate"]);
</script>

<template>
    <div class="switch" @click="emits('update:modelValue', !props.modelValue); emits('onUpdate')">
        <div class="handle" :class="{ activated: props.modelValue }"></div>
    </div>
</template>

<style scoped lang="scss">
.switch {
    width: 50px;
    height: 24px;
    border-radius: 1000px;
    position: relative;
    background-color: #ffffff0f;
    box-shadow: inset 0 0 0 2px #0000009f;

    .handle {
        position: absolute;
        top: 50%;
        translate: 0 -50%;
        height: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 1000px;
        background-color: #242424;
        left: 0;
        border: 2px solid #3f3f3f;
        box-shadow: inset 0 0 0 2px #0000007f;
        transition: 0.2s background-color, 0.2s border, 0.2s left, 0.2s box-shadow;

        &.activated {
            background-color: var(--color-accent);
            border: 2px solid var(--color-accent);
            left: calc(100% - 24px);
            box-shadow: inset 0 0 0 2px #0000007f;
        }
    }
}
</style>