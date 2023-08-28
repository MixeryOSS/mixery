<script setup lang="ts">
import Workspace from "./components/workspace/Workspace.vue";
import { MixeryUI } from "./handling/MixeryUI";
</script>

<template>
    <Workspace class="workspace" :workspace-id="MixeryUI.defaultWorkspace.id" />
</template>

<style scoped lang="scss">
.workspace {
    width: 100vw;
    height: 100vh;
}
</style>
