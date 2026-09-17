<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { createForestScene } from './forest-scene';

const canvas = ref(null);
let cleanup = () => {};
onMounted(() => { cleanup = createForestScene(canvas.value); });
onBeforeUnmount(() => cleanup());
</script>

<template>
  <div class="hero-forest" aria-hidden="true">
    <canvas ref="canvas" class="forest-canvas"></canvas>
    <div class="reading-shade"></div>
  </div>
</template>

<style scoped>
.hero-forest { position: absolute; inset: 0; pointer-events: none; }
.forest-canvas { display: block; width: 100%; height: 100%; }
.reading-shade { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 43%, #080e19a8 0%, #080e1970 34%, #080e1908 78%); }
</style>
