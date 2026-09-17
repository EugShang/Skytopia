<script lang="ts" setup>

import HeroField from './HeroField.vue'
import skytopiaLogo from '../../assets/branding/skytopia-logo.png'
import { Document, Film } from '@element-plus/icons-vue'

const institutionLogos = [
  { name: 'Nanyang Technological University', src: new URL('../../assets/branding/ntu-transparent.png', import.meta.url).href, className: 'institution-logo--ntu' },
  { name: 'XGRIDS', src: new URL('../../assets/branding/xgrids-transparent.png', import.meta.url).href, className: 'institution-logo--xgrids' },
  { name: 'Intelligent Cybernetics Lab', src: new URL('../../assets/branding/ICL-white.png', import.meta.url).href, className: 'institution-logo--icl' },
]
// 标题
const title = 'SKYTOPIA: MONOCULAR DRONE NAVIGATION WITH ACTION-CONDITIONED LATENT WORLD MODELS'

// 作者清单（姓名、地址序号、共一/通讯作者标记）
const authors = [
  { name: "Yuhang Zhang", address_flag: "1", equalContribution: true },
  { name: "Rangya Zhang", address_flag: "1", equalContribution: true },
  { name: "Yujing Shang", address_flag: "1" },
  { name: "Zhuoyuan Yu", address_flag: "1" },
  { name: "Weiying Wang", address_flag: "2" },
  { name: "Steven Yang", address_flag: "2" },
  { name: "Qingsong Yan", address_flag: "3" },
  { name: "Chao Yan", address_flag: "" },
  { name: "Mir Feroskhan", address_flag: "1", corresponding: true },
]

// 地址清单（地址序号、名称）
const addresses = [
  { address_flag: "1", name: "Nanyang Technological University, Singapore" },
  { address_flag: "2", name: "Autel US" },
  { address_flag: "3", name: "XGRIDS" },
]

// 共一和通讯作者提示
const con_and_corresponding_author =
  "*: Equal contribution. †: Corresponding author."


// 提供引导资料链接
const buttons = [
  {
    disabled: false,
    name: "Resources",
     link: "#citation",
    component: Document,
  },
  {
    disabled: false,
    name: "Video",
    link: "#project-film",
    component: Film,
  },
]

</script>

<template>
<section class="sky-hero" aria-labelledby="project-title">
  <HeroField />
  <div class="hero-content">
    <h1 id="project-title" :aria-label="title"><img class="wordmark" :src="skytopiaLogo" alt="" aria-hidden="true"><span class="subtitle">Monocular Drone Navigation with<br class="desktop-break"> Action-Conditioned Latent World Models</span></h1>
    <div class="authors">
      <div v-for="(row, index) in [authors.slice(0,5), authors.slice(5)]" :key="index" class="author-row">
        <span v-for="author in row" :key="author.name">{{ author.name }}<sup v-if="author.address_flag || author.corresponding || author.equalContribution">{{ author.address_flag }}<template v-if="author.equalContribution">*</template><template v-if="author.corresponding">†</template></sup></span>
      </div>
    </div>
    <div class="affiliations"><span v-for="address in addresses" :key="address.name"><sup>{{ address.address_flag }}</sup> {{ address.name }}</span></div>
    <p class="corresponding">{{ con_and_corresponding_author }}</p>
    <div class="logos"><span v-for="institution in institutionLogos" :key="institution.name" class="institution-logo" :class="institution.className"><img :src="institution.src" :alt="institution.name"></span></div>
    <nav class="hero-links" aria-label="Project resources"><a v-for="button in buttons" :key="button.name" :href="button.link" :class="{ primary: button.name === 'Video' }"><component :is="button.component" aria-hidden="true" />{{ button.name === 'Video' ? 'Watch the film ↗' : button.name }}</a></nav>
  </div>
  <a class="scroll-cue" href="#project-film"><span>SCROLL TO EXPLORE</span><span aria-hidden="true">↓</span></a>
</section>
</template>
<style scoped>
.sky-hero{position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px 24px;background:radial-gradient(ellipse at 50% 18%,#172334 0%,#0b111b 60%,#080d14 100%);color:#d8e1ed}
.hero-content{position:relative;width:100%;max-width:1180px;text-align:center}
h1{margin:0}
.wordmark{display:block;width:min(920px,100%);height:auto;margin:0 auto;object-fit:contain}
.subtitle{display:block;margin:26px auto 0;max-width:1000px;font-family:Newsreader,Georgia,serif;font-size:clamp(25px,2.7vw,38px);font-weight:500;line-height:1.2;letter-spacing:-.025em;color:#e0e7f1}
.authors{margin-top:32px;display:grid;gap:10px}
.author-row{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 30px}
.author-row span{color:#91bdff;font-size:24px;font-weight:700;line-height:1.5}
.author-row sup,.affiliations sup{font-size:0.6em;font-weight:700;color:#a1afc1}
.affiliations{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 28px;margin-top:20px;font-size:16px;font-weight:600}
.corresponding{margin:6px 0 0;font-size:12px;color:#a1afc1}
.logos{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:24px 32px;margin:20px 0}
.institution-logo{position:relative;display:block;flex:none}
.logos img{object-fit:contain;display:block;width:100%;height:100%}
.institution-logo--ntu{width:185px;height:70px}
.institution-logo--icl{width:109px;height:64px}
.institution-logo--xgrids{width:76px;height:80px}
.hero-links{display:flex;gap:12px;justify-content:center}
.hero-links a{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;background:#ffffff08;border:1px solid #ffffff30;border-radius:999px;color:#e0e7f1;text-decoration:none;font-size:14px;font-weight:600;transition:transform .2s,box-shadow .2s}
.hero-links a.primary{background:#dceaff;color:#132640;border-color:#dceaff}
.hero-links a:hover{transform:translateY(-2px);box-shadow:0 8px 28px #0005}
.hero-links svg{width:17px;height:17px}
.scroll-cue{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;margin-top:30px;color:#a5b6cc;text-decoration:none}
.scroll-cue span:first-child{font-size:9px;font-weight:600;letter-spacing:.22em}
.scroll-cue span:last-child{font-size:23px;animation:drift 2.4s ease-in-out infinite}
a:focus-visible{outline:3px solid #5588dc;outline-offset:5px}
@keyframes drift{50%{transform:translateY(5px)}}
@media(min-height:950px){.hero-content{margin:auto 0}}
@media(max-width:700px){
.sky-hero{padding:44px 18px 100px}.subtitle{font-size:27px;margin-top:20px}.desktop-break{display:none}.authors{margin-top:26px}.author-row{gap:8px 18px}.author-row span{font-size:19px;line-height:1.55}.affiliations{font-size:14px;gap:4px 16px}.logos{gap:14px 20px}.institution-logo--ntu{width:130px;height:58px}.institution-logo--icl{width:85px;height:50px}.institution-logo--xgrids{width:49px;height:60px}
}
@media(prefers-reduced-motion:reduce){.scroll-cue span:last-child{animation:none}.hero-links a{transition:none}}
@media(max-width:700px){.sky-hero{padding-top:100px}}
</style>
