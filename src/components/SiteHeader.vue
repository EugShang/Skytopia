<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

import ntuLight from '../assets/branding/ntu-light.png';
import ntuDark from '../assets/branding/ntu-transparent.png';
import iclWhite from '../assets/branding/ICL-white.png';
import iclBlack from '../assets/branding/ICL-black.png';
import xgrids from '../assets/branding/xgrids-transparent.png';
const expanded = ref(false);
const scrolled = ref(false);
const active = ref('top');
const toggle = ref(null);
const links = [
  { id: 'project-film', label: 'Video' },
  { id: 'research', label: 'Abstract' },
  { id: 'insight', label: 'Insight' },
  { id: 'platform', label: 'Platform' },
  { id: 'learning', label: 'Learning' },
  { id: 'deployment', label: 'Flight' },
  { id: 'results', label: 'Results' },
  { id: 'citation', label: 'Citation', outlined: true },
];
let cleanup = () => {};
function closeOnEscape(event) {
  if (event.key === 'Escape' && expanded.value) {
    expanded.value = false;
    toggle.value?.focus();
  }
}
onMounted(() => {
  let frame = 0;
  const sections = links.map(link => document.getElementById(link.id));
  const update = () => {
    frame = 0;
    scrolled.value = window.scrollY > 40;
    active.value = 'top';
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= 120) active.value = links[index].id;
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const resize = () => { if (window.innerWidth > 900) expanded.value = false; schedule(); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('keydown', closeOnEscape);
  update();
  cleanup = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', closeOnEscape);
  };
});
onBeforeUnmount(() => cleanup());
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled, 'menu-open': expanded }">
    <div class="header-identity">
      <a class="brand" href="#top" aria-label="SKYTOPIA home" @click="expanded = false">SKYTOPIA</a>
      <div class="header-affiliations" aria-label="Research affiliations">
        <img :src="scrolled ? ntuLight : ntuDark" alt="Nanyang Technological University" class="nav-ntu">
        <img :src="xgrids" alt="XGRIDS" class="nav-xgrids">
        <img :src="scrolled ? iclBlack : iclWhite" alt="Intelligent Cybernetics Lab" class="nav-icl">
      </div>
    </div>
    <button ref="toggle" type="button" class="menu-toggle" :aria-expanded="expanded" aria-controls="site-navigation" :aria-label="expanded ? 'Close navigation' : 'Open navigation'" @click="expanded = !expanded"><span></span><span></span></button>
    <nav id="site-navigation" class="site-nav" :class="{ open: expanded }" aria-label="Primary navigation">
      <a v-for="link in links" :key="link.id" :href="'#' + link.id" :class="{ outlined: link.outlined }" :aria-current="active === link.id ? 'location' : undefined" @click="expanded = false">{{ link.label }}<span v-if="link.outlined" aria-hidden="true"> ↗</span></a>
    </nav>
  </header>
</template>

<style scoped>
.site-header{position:fixed;inset:0 0 auto;z-index:100;min-height:66px;padding:0 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid transparent;background:linear-gradient(180deg,#050914b8,#05091400);color:#fff;transition:background-color .18s,border-color .18s}
.header-identity{display:flex;align-items:center;min-width:0}
.brand{font-size:15px;font-weight:800;letter-spacing:-.04em;color:inherit;text-decoration:none}
.header-affiliations{display:flex;align-items:center;gap:20px;height:40px;margin-left:24px;padding-left:24px;border-left:1px solid #ffffff42}
.header-affiliations img{object-fit:contain}
.nav-ntu{width:92px;height:34px}.nav-icl{width:49px;height:29px}.nav-xgrids{width:33px;height:34px}
.site-nav{display:flex;align-items:center;gap:20px;font-size:13px;font-weight:600}
.site-nav a{color:inherit;opacity:.78;text-decoration:none;white-space:nowrap}
.site-nav a:hover,.site-nav a[aria-current]{opacity:1}
.site-nav a[aria-current]{text-decoration:underline;text-underline-offset:6px}
.site-nav .outlined{padding:8px 11px;border:1px solid #ffffff8a;border-radius:4px;opacity:1}
.is-scrolled{background:#f4f6f8f0;color:#162033;border-bottom-color:#16203324;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.is-scrolled .header-affiliations{border-left-color:#1620332e}
.is-scrolled .outlined{border-color:#162033}
.menu-toggle{display:none;width:40px;height:40px;padding:0;border:0;background:transparent;color:inherit;cursor:pointer}
.menu-toggle span{display:block;width:22px;height:1px;margin:6px auto;background:currentColor}
a:focus-visible,button:focus-visible{outline:2px solid #78a9f3;outline-offset:5px}
@media(min-width:901px) and (max-width:1280px){.header-affiliations{display:none}}
@media(max-width:900px){
  .site-header{padding:0 18px}.menu-toggle{display:block;flex-shrink:0}
  .header-affiliations{gap:10px;margin-left:14px;padding-left:14px}
  .nav-ntu{width:68px;height:28px}.nav-icl{width:41px;height:24px}.nav-xgrids{width:25px;height:30px}
  .site-nav{display:none;position:absolute;top:65px;left:0;right:0;padding:16px 24px 24px;background:#0b111bf5;border-bottom:1px solid #ffffff20;flex-direction:column;align-items:stretch;gap:4px;max-height:calc(100svh - 66px);overflow:auto}
  .site-nav.open{display:flex}.site-nav a{padding:12px}.site-nav .outlined{margin-top:8px}
  .is-scrolled .site-nav{background:#f4f6f8fa;border-bottom-color:#16203324}
  .menu-open .menu-toggle span:first-child{transform:translateY(3.5px) rotate(45deg)}
  .menu-open .menu-toggle span:last-child{transform:translateY(-3.5px) rotate(-45deg)}
}
@media(max-width:440px){.site-header{padding:0 12px}.header-affiliations{gap:7px;margin-left:9px;padding-left:9px}.nav-ntu{width:54px}.nav-icl{width:33px}.nav-xgrids{width:22px}}
@media(prefers-reduced-motion:reduce){.site-header{transition:none}}
</style>
