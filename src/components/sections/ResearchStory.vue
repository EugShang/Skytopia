<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import GaussianSplats3D from './GaussianSplats3D.vue';
import comparison from '../../assets/paper/fig02_world_models_0916.png';
import framework from '../../assets/paper/fig03_framework_0917.png';
import platform from '../../assets/paper/fig07_platform_without_logo.png';
import geometry from '../../assets/paper/fig06a_geometry.png';
import cost from '../../assets/paper/fig06b_cost.png';
import trajectories from '../../assets/paper/fig04_trajectories.png';
import realFlight from '../../assets/paper/fig5_0916.png';
import horizon from '../../assets/paper/fig10_horizon.png';
import perturbations from '../../assets/paper/fig11_perturbations.png';

const videoPath = (name) => `${import.meta.env.BASE_URL}videos/${name}`;

const abstractText = [
  'Monocular drone navigation is difficult because a single forward-facing camera does not directly reveal depth or scale.',
  'SKYTOPIA asks how a policy can learn the geometry of flight from the visual changes caused by its own actions.',
  'We build a 94-scene 3D Gaussian Splatting platform with photorealistic rendering and rigid-body physics, then train an action-conditioned latent world model on aerial demonstrations.',
  'A forward objective predicts the next latent observation from motion-related action tokens, while an inverse objective recovers executed commands from the predicted transition. Together, they discourage a prediction shortcut that ignores the action.',
  'A separate control pathway generates actions without consuming predicted states, allowing the auxiliary dynamics heads to be removed after training.',
  'On held-out simulated scenes, one policy reaches 57.8%, 66.0%, and 49.0% success in point-goal, image-goal, and goal-free navigation, respectively. Removing the auxiliary branch reduces inference FLOPs by 59.4% relative to the full model.',
  'The simulation-trained policy also flies a physical drone without fine-tuning in indoor, open outdoor, and woodland environments.',
].join(' ');
const modes = [
  { id: 'point', name: 'Point-Goal', video: videoPath('point_goal.mp4'), input: 'A metric goal vector', description: 'Reach a specified goal using monocular RGB observations, proprioceptive state, and a metric goal vector.', simulation: '57.8%', real: '55.0%', scope: 'Indoor real-world evaluation; motion capture supplies the metric goal.' },
  { id: 'image', name: 'Image-Goal', video: videoPath('image_goal.mp4'), input: 'Spatial features from a goal image', description: 'Navigate toward visual subgoals while preserving local correspondences between the current and target views.', simulation: '66.0%', real: '56.7%', scope: 'Mean across indoor, open outdoor, and woodland sites. Real-world subgoal images come from a prior flight.' },
  { id: 'free', name: 'Goal-Free', video: videoPath('goal_free.mp4'), input: 'No goal specification', description: 'Generate navigation actions from the current view and proprioceptive state without receiving a target. A hidden evaluation goal is used only to measure performance.', simulation: '49.0%', real: '41.7%', scope: 'Mean across three physical sites; arrival is judged by an operator.' },
];
const selectedMode = ref('point');
const activeMode = computed(() => modes.find(mode => mode.id === selectedMode.value));
const demoRef = ref(null);
const videoRef = ref(null);
let demoVisible = false;
let demoObserver;
let reducedMotion;

function syncDemoPlayback() {
  const video = videoRef.value;
  if (!video) return;
  if (demoVisible && !document.hidden && !reducedMotion?.matches) {
    video.muted = true;
    void video.play().catch(() => {});
  } else {
    video.pause();
  }
}

watch(selectedMode, syncDemoPlayback, { flush: 'post' });

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  demoObserver = new IntersectionObserver(([entry]) => {
    demoVisible = entry.intersectionRatio >= 0.4;
    syncDemoPlayback();
  }, { threshold: [0, 0.4] });
  demoObserver.observe(demoRef.value);
  document.addEventListener('visibilitychange', syncDemoPlayback);
  reducedMotion.addEventListener('change', syncDemoPlayback);
});

onBeforeUnmount(() => {
  demoObserver?.disconnect();
  document.removeEventListener('visibilitychange', syncDemoPlayback);
  reducedMotion?.removeEventListener('change', syncDemoPlayback);
});
const results = [
  ['BC', '16.8', '9.8', '7.8'],
  ['ACT', '23.3', '34.3', '14.3'],
  ['NoMaD', '23.2', '35.7', '16.2'],
  ['ViNT', '19.8', '27.3', '15.2'],
  ['OmniVLA', '42.5', '46.8', '32.7'],
  ['NWM', '38.3', '39.3', '22.3'],
  ['NavMorph', '27.2', '33.3', '20.2'],
  ['SKYTOPIA', '57.8', '66.0', '49.0'],
];
const ablations = [
  ['Action objective only', '37.5', '42.8', '29.2'],
  ['+ Forward dynamics', '51.3', '56.7', '43.3'],
  ['+ Inverse dynamics', '42.7', '51.5', '35.8'],
  ['SKYTOPIA', '57.8', '66.0', '49.0'],
];
</script>

<template>
  <main class="research-story">
    <section id="research" class="story-section abstract-section">
      <p class="eyebrow">THE OVERVIEW</p>
      <h2>Abstract</h2>
      <p class="abstract-text">{{ abstractText }}</p>
    </section>

    <section id="insight" class="story-section">
      <p class="eyebrow">KEY INSIGHT</p>
      <h2>The Action Must Explain<br>the Next View.</h2>
      <p class="lead">In mostly static scenes, a drone's motion creates depth-dependent changes in its camera view. SKYTOPIA makes that action–view relationship a training signal, then uses the learned representation for direct flight.</p>
      <div class="insight-grid">
        <article><span class="step">01 · GEOMETRY</span><h3>Motion makes depth visible</h3><p>Nearby structures shift more than distant ones as the drone moves. Reconstructed 3DGS scenes and physics-based demonstrations provide varied first-person motion and paired command labels.</p></article>
        <article><span class="step">02 · ACTION</span><h3>Prediction must use the command</h3><p>A forward head predicts future latent states from motion-related action tokens. An inverse head recovers executed commands from the predicted transitions, discouraging shortcuts that ignore action.</p></article>
        <article><span class="step">03 · CONTROL</span><h3>Fly from learned features</h3><p>Separate control tokens generate actions without reading predicted states. Training-only dynamics branches are removed, while the same policy serves point-goal, image-goal, and goal-free navigation.</p></article>
      </div>
      <h3 id="framework" class="subheading framework-heading">The SKYTOPIA Framework</h3>
      <p class="framework-intro">The 3DGS platform supplies action-labelled flight data. A Qwen3-VL-2B backbone produces separate prediction and control tokens. The forward head predicts frozen V-JEPA 2 latent targets; the inverse head recovers executed commands from the predicted transitions. Independently, control tokens condition a flow-matching head that generates seven-command action chunks.</p>
      <figure><img :src="framework" loading="lazy" alt="SKYTOPIA architecture, showing the training-only forward and inverse heads and the deployed backbone and action head."><figcaption>Training uses action, forward, and inverse objectives. Deployment retains only the backbone and flow-matching action head.</figcaption></figure>
    </section>

    <section id="platform" class="story-section">
      <p class="eyebrow">01 · GEOMETRY</p>
      <h2>Motion Reveals Geometry</h2>
      <p class="lead">A moving monocular camera sees nearby and distant structures shift differently. SKYTOPIA's reconstructed flight environments supply the varied views and actions needed to learn from that cue.</p>
      <div class="stats"><div><strong>94</strong><span>Reconstructed scenes</span></div><div><strong>32.5M</strong><span>Rendered frames</span></div><div><strong>94,000</strong><span>Expert trajectories</span></div></div>
      <p>LiDAR–camera capture supplies metric geometry and RGB images. 3D Gaussian Splatting reproduces appearance; a reconstructed mesh and a 10 cm signed distance field support collision and clearance queries. Isaac Sim supplies rigid-body dynamics for demonstration collection. The 3DGS scenes are the training environment, not the policy's latent predictor.</p>
      <figure><img :src="platform" loading="lazy" alt="Capture-to-simulation pipeline and examples of 18 indoor, 48 urban outdoor, and 28 vegetation scenes."><figcaption>18 indoor spaces · 48 urban outdoor sites · 28 vegetation environments. Five scenes are held out for OOD evaluation.</figcaption></figure>
      <GaussianSplats3D id="scenes" />
      <p class="note">The viewer above currently shows placeholder captures from the reconstruction pipeline. Representative indoor, urban, and vegetation scenes from the full 94-scene dataset will replace them here.</p>
    </section>

    <section id="learning" class="story-section">
      <p class="eyebrow">02 · ACTION</p>
      <h2>Make Prediction Depend<br>on the Action</h2>
      <p class="lead">A plausible next state is not enough. The predicted visual change should remain informative about the command that caused it.</p>
      <h3 class="subheading">Why predict in both directions?</h3>
      <p>A frozen video encoder provides fixed targets for forward latent prediction. But preceding states may still let the model predict without attending to action. SKYTOPIA therefore asks an inverse head to recover executed commands from the <em>predicted</em> transition, and randomly drops preceding states during inverse-head training to reduce that shortcut.</p>
      <h3 class="subheading">Evidence for geometry-aware features</h3>
      <p>Forward and inverse objectives together give the strongest overall navigation results in the reported ablation. Linear probes on frozen backbone features also find depth and camera displacement more accessible. These probes support, but do not by themselves prove, an explicit 3D reconstruction inside the policy.</p>
      <div class="evidence-grid">
        <figure><img :src="geometry" loading="lazy" alt="Depth and displacement probe errors are lowest with both dynamics objectives."><figcaption>Geometry probes: lower errors with joint dynamics supervision. Error bars cover four episode splits.</figcaption></figure>
        <div class="table-wrap" tabindex="0" aria-label="Dynamics ablation success rates">
          <table><caption>Success rate (%) · Dynamics objectives</caption><thead><tr><th scope="col">Training objective</th><th scope="col">Point</th><th scope="col">Image</th><th scope="col">Free</th></tr></thead><tbody><tr v-for="row in ablations" :key="row[0]" :class="{ ours: row[0] === 'SKYTOPIA' }"><th scope="row">{{ row[0] }}</th><td v-for="(value, index) in row.slice(1)" :key="index">{{ value }}</td></tr></tbody></table>
          <p class="note">The inverse-only variant still uses the forward head to produce transitions; only its forward loss is removed.</p>
        </div>
      </div>
    </section>

    <section id="deployment" class="story-section">
      <p class="eyebrow">03 · CONTROL</p>
      <h2>Keep the Representation,<br>Not the Forecast</h2>
      <p class="lead">The dynamics objectives shape the shared backbone during training. The deployed policy acts without generating or consuming a predicted future state.</p>
      <h3 class="subheading">What remains at deployment</h3>
      <p>Neither predicted states nor recovered commands condition the action head. The target video encoder, forward head, and inverse head are discarded; the backbone and flow-matching action head still generate control commands.</p>
      <div class="deployment"><div><span>TRAIN</span><strong>Backbone + action head + dynamics supervision</strong></div><span aria-hidden="true">↓</span><div><span>DEPLOY</span><strong>Backbone + flow-matching action head</strong></div></div>
      <figure class="comparison-figure"><div class="comparison-frame"><img :src="comparison" loading="lazy" alt="Diagram contrasting forecast-consuming navigation designs with SKYTOPIA's separate training-only dynamics branch and direct action pathway."></div><figcaption>The distinction in SKYTOPIA's architecture: predicted states supervise training, but never enter its deployed action pathway. This diagram does not imply every world model predicts at inference.</figcaption></figure>
      <figure class="compact-figure"><img :src="cost" loading="lazy" alt="Inference cost plot: GFLOPs per step versus latency for SKYTOPIA and seven baselines, with SKYTOPIA's full model and predictor-free deployment both marked."><figcaption>Removing the auxiliary branch cuts SKYTOPIA's inference cost by 59.4% in GFLOPs and 52% in latency per step, while the deployed model still outperforms every baseline in success rate.</figcaption></figure>
    </section>

    <section id="results" class="story-section">
      <p class="eyebrow">EVALUATION</p>
      <h2>One Policy, Three Navigation Modes</h2>
      <p class="lead">Point goals, image goals, or no goal input—with the same simulation-trained policy.</p>
      <div class="mode-switcher" role="group" aria-label="Navigation mode">
        <button v-for="mode in modes" :key="mode.id" type="button" :aria-pressed="selectedMode === mode.id" @click="selectedMode = mode.id">{{ mode.name }}</button>
      </div>
      <div class="mode-panel" aria-live="polite">
        <div><p class="eyebrow">{{ activeMode.input }}</p><h3>{{ activeMode.name }} Navigation</h3><p>{{ activeMode.description }}</p></div>
        <div class="mode-score"><strong>{{ activeMode.simulation }}</strong><span>Simulation success rate</span></div>
      </div>
      <figure ref="demoRef" class="simulation-demo">
        <video v-if="activeMode.video" :key="activeMode.id" ref="videoRef" :src="activeMode.video" controls muted loop playsinline preload="none" :aria-label="activeMode.name + ' simulated flight video'">Your browser does not support HTML video.</video>
        <div v-else class="demo-placeholder" role="status">{{ activeMode.name }} · New simulation video pending</div>
        <figcaption v-if="activeMode.video">{{ activeMode.name }} simulation</figcaption>
      </figure>
      <h3 class="subheading">Navigation in unseen simulated environments</h3>
      <p>SKYTOPIA achieves the highest success rate across all three modes against seven baselines retrained on the same data. Each mode uses 200 episodes per seed over three seeds.</p>
      <figure><img :src="trajectories" loading="lazy" alt="Representative SKYTOPIA and baseline trajectories for point-goal, image-goal, and goal-free navigation."><figcaption>Representative trajectories on an OOD scene. Crosses mark collisions; the red curve denotes SKYTOPIA.</figcaption></figure>
      <div class="table-wrap" tabindex="0" aria-label="Simulation success rates">
        <table><caption>OOD navigation · Success rate (%) ↑</caption><thead><tr><th scope="col">Method</th><th scope="col">Point-Goal</th><th scope="col">Image-Goal</th><th scope="col">Goal-Free</th></tr></thead><tbody><tr v-for="row in results" :key="row[0]" :class="{ ours: row[0] === 'SKYTOPIA' }"><th scope="row">{{ row[0] }}</th><td v-for="(value, index) in row.slice(1)" :key="index">{{ value }}</td></tr></tbody></table>
      </div>
      <h3 class="subheading">Zero-Shot Real-World Flight</h3>
      <p>The simulation-trained policy transfers without fine-tuning to unseen indoor, open outdoor, and woodland environments.</p>
      <figure><img :src="realFlight" loading="lazy" alt="First-person real-world flight sequences for point-goal, image-goal, and goal-free navigation."><figcaption>Representative real-world flights. The overlays indicate commanded directions, not predicted future observations.</figcaption></figure>
      <div class="real-grid"><article v-for="mode in modes" :key="mode.id"><h4>{{ mode.name }}</h4><strong>{{ mode.real }}</strong><p>{{ mode.scope }}</p></article></div>
      <p class="note">20 trials per evaluated setting. A DJI Tello streams observations to a ground RTX 3090 computer for inference at approximately 7 Hz; this is not onboard model inference. The policy also uses proprioceptive state.</p>
      <h3 class="subheading">Robustness and Longer Routes</h3>
      <div class="robustness-grid">
        <figure><img :src="horizon" loading="lazy" alt="Success and path efficiency across increasing planner path lengths."><figcaption>Higher success and path efficiency across the evaluated route lengths, averaged over three navigation modes.</figcaption></figure>
        <figure><img :src="perturbations" loading="lazy" alt="Navigation success under illumination changes, image noise, and motion blur."><figcaption>Highest success under each tested visual perturbation. Motion blur remains the strongest perturbation for SKYTOPIA.</figcaption></figure>
      </div>
      <p class="note">Current scope: the policy lacks persistent spatial memory. Longer-horizon navigation with memory and dynamic environments remain future work.</p>
    </section>

    <section id="citation" class="story-section resource-section">
      <p class="eyebrow">RESOURCES</p>
      <h2>Paper, Code &amp; Citation</h2>
      <p>SKYTOPIA: Monocular Drone Navigation with Action-Conditioned Latent World Models</p>
      <div class="resource-list"><span>Paper link · Pending</span><span>Code release · Pending</span><span>BibTeX · Pending publication details</span></div>
      <p class="note">Public links and citation metadata will be added when confirmed.</p>
    </section>
  </main>
</template>

<style scoped>
.research-story{background:#fff;color:#243247}
.story-section{max-width:1120px;margin:0 auto;padding:100px 28px;border-bottom:1px solid #e8edf3}
.eyebrow{margin:0 0 26px;color:#245c9d;font-size:17px;font-weight:800;letter-spacing:.08em;line-height:1.45;text-align:center;text-transform:uppercase}
.story-section>.eyebrow::after{content:"";display:block;width:44px;height:3px;margin:14px auto 0;border-radius:3px;background:#4b86c6}
h2{font-family:var(--paper-display);font-size:clamp(34px,3.8vw,48px);font-weight:500;line-height:1.16;letter-spacing:-.035em;text-align:center;margin:0 auto 22px;max-width:920px;color:#182a40}
h3,h4{letter-spacing:0;color:#233b56}
h3{font-size:20px;line-height:1.4;margin:12px 0}h4{font-size:16px;margin:0 0 10px}
p{font-size:17px;line-height:1.85;margin:0 0 20px}
.lead{font-size:20px;text-align:center;max-width:790px;margin:0 auto 48px;color:#53677f}
.abstract-section{max-width:890px}.abstract-text{text-align:left;font-size:17px;line-height:1.95}
#insight{padding-top:76px;padding-bottom:76px}
.abstract-section{padding-bottom:76px}
.insight-grid,.stats,.real-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;margin:36px 0}
.insight-grid article{padding:20px 0;border-top:2px solid #dce8f5}
.insight-grid p,.real-grid p{font-size:15px;line-height:1.75}
.step{font-size:15px;font-weight:800;color:#3972ae}
figure{margin:32px 0 44px}figure img{display:block;width:100%;height:auto}
.comparison-figure{margin:24px 0 28px}
.comparison-frame{aspect-ratio:1500/426;overflow:hidden}
.comparison-frame img{height:100%;object-fit:cover;object-position:center}
figcaption{font-size:13px;line-height:1.7;color:#6b7a8b;max-width:860px;margin:16px auto 0;text-align:center}
.subheading{font-family:var(--paper-display);font-size:29px;font-weight:500;margin:48px 0 16px}
.framework-heading{margin:46px auto 16px;max-width:850px;color:#182a40;font-size:clamp(30px,3vw,36px);font-weight:600;line-height:1.2;letter-spacing:-.025em;text-align:center}
.framework-intro{max-width:860px;margin:0 auto 22px;text-align:center;line-height:1.8}
.stats{text-align:center;background:#f5f9fe;padding:30px 18px;border-radius:16px}
.stats strong,.real-grid strong{display:block;font-size:38px;line-height:1.3;color:#245c9d;letter-spacing:-.04em}
.stats span{font-size:13px;color:#5c7088}
.note{font-size:13px;color:#6b7a8b;line-height:1.75;margin:18px 0}
.evidence-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:32px;align-items:center}
.table-wrap{overflow-x:auto;max-width:100%;border:1px solid #e1e8f0;border-radius:12px;padding:12px 18px}
table{border-collapse:collapse;width:100%;font-size:14px}
caption{font-size:13px;font-weight:600;text-align:left;padding:8px 0 16px;color:#62758d}
th,td{padding:13px 10px;border-bottom:1px solid #e8edf3;text-align:right;white-space:nowrap}
th:first-child{text-align:left}thead th{font-size:12px;color:#62758d}tbody th{font-weight:500}
.ours{background:#edf5ff;color:#164c8c}.ours th,.ours td{font-weight:700}
.deployment{display:flex;flex-direction:column;align-items:center;gap:12px;margin:30px 0}
.deployment div{width:min(100%,680px);background:#f5f9fe;border:1px solid #dbe8f5;border-radius:12px;padding:20px;text-align:center}
.deployment span{display:block;font-size:11px;letter-spacing:.15em;color:#4778ac}.deployment strong{font-size:16px}
.compact-figure{max-width:860px;margin-left:auto;margin-right:auto}
.mode-switcher{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.mode-switcher button{padding:12px 22px;border:1px solid #d9e4f0;border-radius:999px;background:#fff;color:#45617f;font:600 14px var(--paper-body);cursor:pointer}
.mode-switcher button[aria-pressed="true"]{background:#214f86;border-color:#214f86;color:white}
.mode-panel{display:grid;grid-template-columns:1fr 190px;gap:24px;align-items:center;padding:30px;background:#f5f9fe;border-radius:16px;min-height:225px}
.mode-panel .eyebrow{text-align:left;margin:0;font-size:14px;letter-spacing:.05em}.mode-panel p{font-size:15px;margin-bottom:0}.mode-panel h3{margin:10px 0}
.mode-score{text-align:center}.mode-score strong{display:block;font-size:46px;line-height:1.2;letter-spacing:-.04em;color:#245c9d}.mode-score span{font-size:12px;color:#63778d}
.simulation-demo{margin:24px 0 44px}
.simulation-demo video{display:block;width:min(100%,680px);aspect-ratio:1/1;margin:0 auto;object-fit:contain;background:#111821;border:1px solid #e2e9f1;border-radius:14px}
.demo-placeholder{display:grid;place-items:center;width:min(100%,680px);aspect-ratio:1/1;margin:0 auto;border:1px solid #e2e9f1;border-radius:14px;background:#f5f9fe;color:#6b7a8b;font-size:15px;text-align:center}
.real-grid article{border-top:2px solid #dce8f5;padding-top:20px}.real-grid p{margin-top:14px}
.robustness-grid{display:grid;grid-template-columns:1fr;gap:12px}.robustness-grid figure{max-width:900px;margin:20px auto}
.resource-section{text-align:center;border:0;padding-bottom:100px}
.resource-list{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:24px 0}.resource-list span{padding:12px 18px;border:1px solid #dce5ef;border-radius:8px;font-size:13px;color:#6a7e95}
button:focus-visible,.table-wrap:focus-visible{outline:3px solid #7aa9e8;outline-offset:4px}
:deep(.paper-section){padding:20px 0;background:white}
:deep(.section-title){font-size:26px}
@media(max-width:700px){.story-section{padding:68px 20px}.abstract-section{padding-bottom:56px}#insight{padding-top:56px;padding-bottom:56px}.story-section>.eyebrow{font-size:15px;margin-bottom:22px}.story-section>.eyebrow::after{margin-top:12px}.insight-grid,.evidence-grid,.real-grid{grid-template-columns:1fr;gap:12px}.stats{gap:12px;padding:24px 10px}.stats strong{font-size:27px}.stats span{font-size:11px}.mode-panel{grid-template-columns:1fr;padding:24px;min-height:0}.mode-score{text-align:left}.lead{font-size:18px;margin-bottom:36px}.subheading{font-size:26px}.framework-heading{font-size:30px;margin-top:38px}p,.abstract-text{font-size:16px}.mode-switcher button{padding:10px 15px;font-size:13px}}
</style>
