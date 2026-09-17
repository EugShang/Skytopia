<script>

import Main from './components/Main.vue'

export default {
  components: {
    Main,
  }
}

</script>

<template>
  <div class="site-shell">
    <el-container>
      <el-main><Main/></el-main>
    </el-container>

    <!-- 回到顶部 -->
    <el-backtop :right="32" :bottom="32" />
  </div>
</template>

<style>
:root {
  color-scheme: light;
  --paper-accent: #1f5fbf;
  --paper-accent-bright: #15438a;
  --paper-text: #303133;
  --paper-muted: #444444;
  --paper-bg: #ffffff;
  --paper-surface: #f8fbff;
  --paper-raised: #f2f2f2;
  --paper-border: #e5e7eb;
  --paper-radius: 12px;
  --paper-radius-lg: 16px;
  --paper-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  --paper-display: "Newsreader", Georgia, "Times New Roman", serif;
  --paper-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  --el-bg-color: var(--paper-bg);
  --el-bg-color-overlay: var(--paper-raised);
  --el-fill-color-blank: var(--paper-raised);
  --el-border-color: var(--paper-border);
  --el-border-color-light: var(--paper-border);
  --el-text-color-primary: var(--paper-text);
  --el-text-color-regular: var(--paper-muted);
  --el-text-color-secondary: var(--paper-muted);
  --el-color-primary: var(--paper-accent);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  background: var(--paper-bg);
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--paper-bg);
  color: var(--paper-text);
  font-family: var(--paper-body);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app,
.site-shell,
.el-container {
  min-height: 100vh;
  background: var(--paper-bg);
}

.el-main {
  min-width: 0;
  padding: 0 !important;
  overflow: visible !important;
}

.paper-section {
  position: relative;
  padding: 3rem 1.5rem;
  background: var(--paper-bg);
  color: var(--paper-text);
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  animation: fade-in-up 0.55s ease-out both;
}

.paper-section--alternate {
  background: var(--paper-surface);
  border-color: var(--paper-border);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: #000000;
  font-family: var(--paper-display);
  letter-spacing: -0.01em;
}

h1.section-title,
.section-title {
  position: relative;
  margin: 0 0 2rem;
  padding-bottom: 1rem;
  color: #000000;
  font-family: var(--paper-display);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -0.01em;
  text-align: center;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 60px;
  height: 3px;
  border-radius: 2px;
  background: var(--paper-accent);
  transform: translateX(-50%);
}

p,
li {
  font-size: 1.05rem;
  line-height: 1.8;
}

a {
  color: var(--paper-accent);
  text-decoration: none;
  transition: color 0.25s ease;
}

a:hover {
  color: var(--paper-accent-bright);
}

.el-backtop {
  border: 1px solid var(--paper-border);
  background: var(--paper-raised) !important;
  color: var(--paper-accent-bright) !important;
  box-shadow: var(--paper-shadow) !important;
}

.media-blank {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--paper-border);
  border-radius: var(--paper-radius-lg);
  background: #ffffff;
  box-shadow: var(--paper-shadow);
}

::selection {
  background: var(--paper-accent);
  color: var(--paper-bg);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--paper-bg);
}

::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: var(--paper-border);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .paper-section {
    padding: 2rem 1rem;
  }

  h1.section-title,
  .section-title {
    font-size: 1.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .paper-section {
    animation: none;
  }
}

</style>
