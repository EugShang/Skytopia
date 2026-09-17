<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { projectFilm } from '../../project-media';

const frame = ref(null);
const mount = ref(null);
const playbackBlocked = ref(false);
const failed = ref(false);
const youtubeUrl = 'https://www.youtube.com/watch?v=' + projectFilm.youtubeId;
let player = null;
let ready = false;
let inView = false;
let disposed = false;
let cleanup = () => {};
let youtubeApiPromise;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      youtubeApiPromise = null;
      reject(new Error('YouTube player API unavailable'));
    };
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

function play(manual = false) {
  if (!ready || !player || failed.value) return;
  playbackBlocked.value = false;
  if (!manual) player.mute();
  player.playVideo();
}

function syncPlayback() {
  if (!ready || !player) return;
  if (inView && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  else player.pauseVideo();
}
onMounted(async () => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.intersectionRatio >= 0.5;
    syncPlayback();
  }, { threshold: [0, 0.5, 1] });
  observer.observe(frame.value);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', syncPlayback);
  cleanup = () => {
    disposed = true;
    observer.disconnect();
    document.removeEventListener('visibilitychange', syncPlayback);
    motion.removeEventListener('change', syncPlayback);
    player?.destroy();
  };
  try {
    const YT = await loadYouTubeApi();
    if (disposed || !mount.value) return;
    player = new YT.Player(mount.value, {
      videoId: projectFilm.youtubeId,
      width: '100%',
      height: '100%',
      playerVars: { controls: 1, playsinline: 1, rel: 0, origin: window.location.origin },
      events: {
        onReady: (event) => {
          if (disposed) return;
          player = event.target;
          ready = true;
          const iframe = player.getIframe();
          iframe.title = 'SKYTOPIA project film';
          iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
          iframe.setAttribute('allowfullscreen', '');
          player.mute();
          syncPlayback();
        },
        onAutoplayBlocked: () => { playbackBlocked.value = true; },
        onError: () => { failed.value = true; },
      },
    });
  } catch {
    if (!disposed) failed.value = true;
  }
});
onBeforeUnmount(() => cleanup());
</script>

<template>
  <section id="project-film" class="film-section" aria-labelledby="film-title">
    <header class="film-heading"><span class="section-index">01 / PROJECT FILM</span><h2 id="film-title">SKYTOPIA in motion.</h2></header>
    <div ref="frame" class="film-frame">
      <div ref="mount" class="youtube-player"></div>
      <button v-if="playbackBlocked && !failed" type="button" class="play-button" @click="play(true)">Play film</button>
      <p v-if="failed" class="film-error" role="status">The embedded video could not be loaded. <a :href="youtubeUrl" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></p>
    </div>
    <div class="film-footer"><span>Plays muted on scroll · Use player controls for sound</span><a href="#research">Explore the research ↓</a></div>
  </section>
</template>

<style scoped>
.film-section{box-sizing:border-box;min-height:100svh;padding:64px max(24px, calc((100% - 1180px)/2));display:flex;flex-direction:column;justify-content:center;background:linear-gradient(#080d14,#0d1520 50%,#080d14);color:#d8e1ed;color-scheme:dark;scroll-margin-top:0}
.film-heading{margin-bottom:24px}
.section-index{font-size:10px;letter-spacing:.19em;font-weight:700;color:#9aaec7}
.film-heading h2{font:500 clamp(28px,3vw,42px)/1.2 Newsreader,Georgia,serif;color:#edf3fc;margin:10px 0 0}
.film-frame{position:relative;aspect-ratio:16/9;width:100%;min-height:200px;max-height:72svh;border:1px solid #ffffff20;border-radius:18px;overflow:hidden;background:#060a10;box-shadow:0 24px 70px #0005}
.youtube-player,.film-frame :deep(iframe){display:block;width:100%;height:100%;border:0}
.film-footer{display:flex;justify-content:space-between;gap:16px;margin-top:20px;font-size:12px;color:#a0afc1}
.film-footer a,.film-error a{color:#a5caff;text-decoration:none}
.play-button,.film-error{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:1px solid #ffffff30;border-radius:12px;padding:15px 24px;background:#172334;color:#dceaff;text-align:center;z-index:2}
.play-button{cursor:pointer}
@media(max-width:700px){.film-section{padding:48px 18px;min-height:85svh}.film-frame{border-radius:12px}.film-footer{flex-direction:column}.film-heading{margin-bottom:20px}}
</style>
