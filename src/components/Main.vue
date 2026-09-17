<script setup>
import Title from './sections/Title.vue';
import SiteHeader from './SiteHeader.vue';
import YouTubeVideo from './sections/YouTubeVideo.vue';
import ResearchStory from './sections/ResearchStory.vue';
</script>

<template>
  <SiteHeader />
  <Title id="top" />
  <YouTubeVideo />
  <ResearchStory />
</template>

<style scoped>
:deep([id]) { scroll-margin-top: 84px; }
:deep(.sky-hero) { padding-top: 100px; }
</style>
