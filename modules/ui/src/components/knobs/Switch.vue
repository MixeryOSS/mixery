<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
}>();
const emits = defineEmits(["update:modelValue"]);
</script>

<template>
    <div class="switch" @click="emits('update:modelValue', !props.modelValue)">
        <div class="handle" :class="{ activated: props.modelValue, unactivated: !props.modelValue }"></div>
    </div>
</template>

<style scoped lang="scss">
.switch {
    width: 60px;
    height: 24px;
    border-radius: 1000px;
    position: relative;
    background-color: #0000007f;
    box-shadow: inset 0 0 0 2px #0000007f;

    .handle {
        position: absolute;
        top: 50%;
        translate: 0 -50%;
        height: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 1000px;
        background-color: #ffffff;
        left: 0;

        &.unactivated {
            animation: 0.3s switch-off ease-out;
            box-shadow: inset 0 0 0 2px #0000007f, inset 0 0 0 100px #7f7f7f;
        }
        
        &.activated {
            animation: 0.3s switch-on ease-out;
            left: calc(100% - 24px);
            box-shadow: inset 0 0 0 2px #0000007f, inset 0 0 0 100px var(--color-accent);
        }
        
        @keyframes switch-on {
            0% {
                left: 0;
                aspect-ratio: 1 / 1;
                box-shadow: inset 0 0 0 2px #0000007f, inset 0 0 0 100px #7f7f7f;
            }
            50% {
                left: 12%;
                height: 70%;
                aspect-ratio: 2 / 1;
            }
            100% {
                left: calc(100% - 24px);
                aspect-ratio: 1 / 1;
                box-shadow: inset 0 0 0 2px #0000007f, inset 0 0 0 100px var(--color-accent);
            }
        }
        
        @keyframes switch-off {
            0% {
                left: calc(100% - 24px);
                aspect-ratio: 1 / 1;
                box-shadow: inset 0 0 0 2px #0000007f, inset 0 0 0 100px var(--color-accent);
            }
            50% {
                left: calc(70% - 24px);
                height: 70%;
                aspect-ratio: 2 / 1;
            }
            100% {
                left: 0;
                aspect-ratio: 1 / 1;
                box-shadow: inset 0 0 0 2px #0000007f, inset 0 0 0 100px #7f7f7f;
            }
        }
    }
}
</style>