<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`;

const degreesToRadians = (degrees) => degrees * (Math.PI / 180);

const quaternionFromEulerDegrees = (x, y, z) => {
  const halfX = degreesToRadians(x) / 2;
  const halfY = degreesToRadians(y) / 2;
  const halfZ = degreesToRadians(z) / 2;

  const sinX = Math.sin(halfX);
  const cosX = Math.cos(halfX);
  const sinY = Math.sin(halfY);
  const cosY = Math.cos(halfY);
  const sinZ = Math.sin(halfZ);
  const cosZ = Math.cos(halfZ);

  return [
    sinX * cosY * cosZ - cosX * sinY * sinZ,
    cosX * sinY * cosZ + sinX * cosY * sinZ,
    cosX * cosY * sinZ - sinX * sinY * cosZ,
    cosX * cosY * cosZ + sinX * sinY * sinZ,
  ];
};

const sceneCases = [
  {
    key: 'case-1',
    label: 'Indoor',
    path: assetPath('3dgs/c-web.ksplat'),
    cameraPosition: [0, -1.5, 13],
    cameraLookAt: [0, -1.5, 0],
    controlLimits: {
      minPolarAngle: Math.PI * 0.48,
      maxPolarAngle: Math.PI * 0.5,
      minAzimuthAngle: -Math.PI / 30,
      maxAzimuthAngle: Math.PI / 30,
      minDistance: 10,
      maxDistance: 16,
      minZoom: 0.9,
      maxZoom: 1.4,
      enablePan: false,
    },
    sceneOptions: {
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: true,
      progressiveLoad: true,
      position: [0, 0, 0],
      rotation: quaternionFromEulerDegrees(0, 0, 0),
      scale: [1, 1, 1],
      format: GaussianSplats3D.SceneFormat.KSplat,
    },
  },
  {
    key: 'case-2',
    label: 'Urban',
    path: assetPath('3dgs/temple-web.ksplat'),
    cameraPosition: [0, -1.0, 15],
    cameraLookAt: [0, -1.0, 0],
    controlLimits: {
      minPolarAngle: Math.PI * 0.3,
      maxPolarAngle: Math.PI * 0.5,
      minAzimuthAngle: -Math.PI / 5,
      maxAzimuthAngle: Math.PI / 5,
      minDistance: 6,
      maxDistance: 20,
      minZoom: 0.8,
      maxZoom: 2.4,
    },
    sceneOptions: {
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: true,
      progressiveLoad: true,
      position: [0, 0, 0],
      rotation: quaternionFromEulerDegrees(0, 0, 0),
      scale: [1, 1, 1],
      format: GaussianSplats3D.SceneFormat.KSplat,
    },
  },
  {
    key: 'case-3',
    label: 'Vegetation',
    path: assetPath('3dgs/tree-web.ksplat'),
    cameraPosition: [20, -1, -20],
    cameraLookAt: [20, -1, -20],
    controlLimits: {
      minPolarAngle: Math.PI * 0.3,
      maxPolarAngle: Math.PI * 0.5,
      minAzimuthAngle: -Math.PI / 5,
      maxAzimuthAngle: Math.PI / 5,
      minDistance: 8,
      maxDistance: 30,
      minZoom: 0.8,
      maxZoom: 2.4,
    },
    sceneOptions: {
      splatAlphaRemovalThreshold: 1,
      showLoadingUI: true,
      progressiveLoad: true,
      position: [0, 0, 0],
      rotation: quaternionFromEulerDegrees(0, 0, 0),
      scale: [1, 1, 1],
      format: GaussianSplats3D.SceneFormat.KSplat,
    },
  },
];

const containerRef = ref(null);
const activeCaseKey = ref(sceneCases[0].key);
const isSwitching = ref(false);
const isViewerBusy = ref(false);
const loadError = ref('');
const activeCaseLabel = computed(
  () => sceneCases.find((item) => item.key === activeCaseKey.value)?.label,
);

let viewer = null;
let viewerMountElement = null;
let viewerStarted = false;
let loadSequence = 0;
let busyStateFrameId = null;
let loadObserver = null;

const controlLimits = {
  minPolarAngle: Math.PI * 0.3,
  maxPolarAngle: Math.PI * 0.5,
  minAzimuthAngle: -Math.PI / 5,
  maxAzimuthAngle: Math.PI / 5,
  minDistance: 3.2,
  maxDistance: 6.5,
  minZoom: 0.8,
  maxZoom: 2.4,
};

const removeNodeIfPresent = (node) => {
  if (node?.parentNode) {
    node.parentNode.removeChild(node);
  }
};

const disposeViewer = async () => {
  if (!viewer) {
    removeNodeIfPresent(viewerMountElement);
    viewerMountElement = null;
    return;
  }

  const currentViewer = viewer;
  const currentMountElement = viewerMountElement;

  viewer = null;
  viewerMountElement = null;
  viewerStarted = false;

  const downloadPromises = Object.values(currentViewer.splatSceneDownloadPromises || {});
  for (const downloadPromise of downloadPromises) {
    try {
      downloadPromise.abort?.('Scene disposed');
    } catch (error) {
      console.warn(error);
    }
  }

  currentViewer.stop?.();
  currentViewer.orthographicControls?.dispose?.();
  currentViewer.perspectiveControls?.dispose?.();
  currentViewer.orthographicControls = null;
  currentViewer.perspectiveControls = null;
  currentViewer.controls = null;
  currentViewer.splatMesh?.dispose?.();
  currentViewer.splatMesh = null;
  currentViewer.sceneHelper?.dispose?.();
  currentViewer.sceneHelper = null;

  if (currentViewer.resizeObserver && currentViewer.rootElement) {
    currentViewer.resizeObserver.unobserve(currentViewer.rootElement);
    currentViewer.resizeObserver = null;
  }

  currentViewer.disposeSortWorker?.();
  currentViewer.removeEventHandlers?.();

  currentViewer.loadingSpinner?.removeAllTasks?.();
  currentViewer.loadingSpinner?.setContainer?.(null);
  currentViewer.loadingProgressBar?.hide?.();
  currentViewer.loadingProgressBar?.setContainer?.(null);
  currentViewer.infoPanel?.setContainer?.(null);

  if (currentViewer.renderer) {
    removeNodeIfPresent(currentViewer.renderer.domElement);
    currentViewer.renderer.dispose?.();
    currentViewer.renderer = null;
  }

  currentViewer.camera = null;
  currentViewer.threeScene = null;
  currentViewer.splatRenderReady = false;
  currentViewer.initialized = false;
  currentViewer.disposed = true;
  currentViewer.disposing = false;
  currentViewer.disposePromise = null;

  removeNodeIfPresent(currentMountElement);
};

const disableClickToFocus = (currentViewer) => {
  currentViewer.checkForFocalPointChange = () => {};
  currentViewer.onMouseClick = () => {};
};

const waitForNextFrame = () => new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

const getViewerBusyState = () => {
  if (!viewer) return false;
  return Boolean(viewer.isLoadingOrUnloading?.()) || Boolean(viewer.isDisposingOrDisposed?.());
};

const syncViewerBusyState = () => {
  isViewerBusy.value = getViewerBusyState();
  busyStateFrameId = window.requestAnimationFrame(syncViewerBusyState);
};

const clearViewerBusyStateLoop = () => {
  if (busyStateFrameId !== null) {
    window.cancelAnimationFrame(busyStateFrameId);
    busyStateFrameId = null;
  }
};

const isSceneBusy = computed(() => isSwitching.value || isViewerBusy.value);

const createViewer = (sceneCase) => {
  const containerElement = containerRef.value;
  if (!containerElement) return null;

  const mountElement = document.createElement('div');
  mountElement.className = 'gs-mount';
  containerElement.appendChild(mountElement);
  viewerMountElement = mountElement;

  const nextViewer = new GaussianSplats3D.Viewer({
    rootElement: mountElement,
    cameraUp: [0, -1, 0],
    initialCameraPosition: sceneCase.cameraPosition,
    initialCameraLookAt: sceneCase.cameraLookAt,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: false,
    maxScreenSpaceSplatSize: 128,
    sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
  });
  disableClickToFocus(nextViewer);

  const limits = sceneCase.controlLimits || controlLimits;
  for (const controls of [nextViewer.perspectiveControls, nextViewer.orthographicControls]) {
    if (!controls) continue;
    controls.minPolarAngle = limits.minPolarAngle;
    controls.maxPolarAngle = limits.maxPolarAngle;
    controls.minAzimuthAngle = limits.minAzimuthAngle;
    controls.maxAzimuthAngle = limits.maxAzimuthAngle;
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.minZoom = limits.minZoom;
    controls.maxZoom = limits.maxZoom;
    controls.enablePan = limits.enablePan ?? true;    controls.update();
  }

  return nextViewer;
};

const applySceneView = (currentViewer, sceneCase) => {
  const [cameraX, cameraY, cameraZ] = sceneCase.cameraPosition;
  const [targetX, targetY, targetZ] = sceneCase.cameraLookAt;

  currentViewer.camera.position.set(cameraX, cameraY, cameraZ);
  currentViewer.perspectiveCamera?.position.set(cameraX, cameraY, cameraZ);
  currentViewer.orthographicCamera?.position.set(cameraX, cameraY, cameraZ);

  for (const controls of [currentViewer.perspectiveControls, currentViewer.orthographicControls]) {
    if (!controls) continue;
    controls.target.set(targetX, targetY, targetZ);
    controls.update();
    controls.saveState();
  }
};

const loadScene = async (sceneCase) => {
  const currentSequence = ++loadSequence;
  isSwitching.value = true;
  loadError.value = '';

  try {
    await disposeViewer();
    await waitForNextFrame();

    if (currentSequence !== loadSequence) return;

    const nextViewer = createViewer(sceneCase);
    if (!nextViewer) return;

    viewer = nextViewer;

    if (!viewerStarted) {
      nextViewer.start();
      nextViewer.perspectiveControls.stopListenToKeyEvents();
      nextViewer.orthographicControls.stopListenToKeyEvents();
      viewerStarted = true;
    }

    await nextViewer.addSplatScene(sceneCase.path, {
      ...sceneCase.sceneOptions,
      showLoadingUI: true,
    });

    if (currentSequence !== loadSequence) {
      await disposeViewer();
      return;
    }

    applySceneView(nextViewer, sceneCase);
    activeCaseKey.value = sceneCase.key;
  } catch (error) {
    if (currentSequence === loadSequence) {
      await disposeViewer();
      loadError.value = error instanceof Error ? error.message : 'Failed to load the 3DGS scene.';
      console.error(error);
    }
  } finally {
    if (currentSequence === loadSequence) {
      isSwitching.value = false;
    }
  }
};

const handleCaseChange = async (key) => {
  if (isSceneBusy.value || key === activeCaseKey.value) return;
  const nextCase = sceneCases.find((item) => item.key === key);
  if (!nextCase) return;
  loadObserver?.disconnect();
  loadObserver = null;
  await loadScene(nextCase);
};

onMounted(() => {
  syncViewerBusyState();
  if (!window.IntersectionObserver || !containerRef.value) {
    void loadScene(sceneCases[0]);
    return;
  }

  loadObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    loadObserver?.disconnect();
    loadObserver = null;
    void loadScene(sceneCases[0]);
  }, { rootMargin: '700px 0px' });
  loadObserver.observe(containerRef.value);
});

onBeforeUnmount(() => {
  loadSequence += 1;
  loadObserver?.disconnect();
  loadObserver = null;
  clearViewerBusyStateLoop();
  void disposeViewer();
});
</script>

<template>
  <section class="paper-section paper-section--alternate">
    <el-row justify="center">
      <h3 class="section-title">One Platform, Three Environment Types</h3>
    </el-row>

    <el-row justify="center" class="case-row">
      <el-col :xs="24" :sm="22" :md="20" :lg="24" :xl="24">
        <div class="scene-switcher">
          <button
            v-for="sceneCase in sceneCases"
            :key="sceneCase.key"
            type="button"
            class="scene-button"
            :class="{ 'scene-button-active': activeCaseKey === sceneCase.key }"
            :aria-pressed="activeCaseKey === sceneCase.key"
            :disabled="isSceneBusy"
            @click="handleCaseChange(sceneCase.key)"
          >
            {{ sceneCase.label }}
          </button>
        </div>
      </el-col>
    </el-row>

    <el-row justify="center">
      <el-col :xs="24" :sm="22" :md="20" :lg="24" :xl="24">
        <div ref="containerRef" class="gs-container" role="img" :aria-label="activeCaseLabel + ' — interactive 3DGS viewer'"></div>
        <p class="case-status">{{ activeCaseLabel }}<span v-if="isSceneBusy"> · switching…</span></p>
        <p v-if="loadError" class="case-error">{{ loadError }}</p>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.case-row {
  margin-bottom: 1rem;
}

.scene-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: center;
}

.scene-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  border: 1px solid var(--paper-border);
  border-radius: var(--paper-radius);
  padding: 0.65rem 1rem;
  background: var(--paper-raised);
  color: var(--paper-text);
  font-family: var(--paper-body);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.scene-button:hover {
  border-color: var(--paper-accent);
  color: var(--paper-accent-bright);
  transform: translateY(-2px);
}

.scene-button:disabled {
  cursor: wait;
  opacity: 0.7;
  transform: none;
}

.scene-button-active {
  border-color: var(--paper-accent);
  background: #ecf5ff;
  color: var(--paper-accent);
}

.gs-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--paper-border);
  border-radius: var(--paper-radius-lg);
  background: #ffffff;
  box-shadow: var(--paper-shadow);
  overflow: hidden;
}

.case-status {
  margin: 0.9rem auto 0;
  color: var(--paper-muted);
  font-size: 0.875rem;
  text-align: center;
}

.case-error {
  margin: 0.5rem auto 0;
  color: #d03050;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 600px) {
  .scene-button {
    width: 100%;
  }
}
</style>

<style>
.gs-mount {
  width: 100%;
  height: 100%;
}

.spinnerPrimary0 {
  display: none !important;
}

.spinnerOuterContainer0 {
  height: 100% !important;
  margin: 0 auto !important;
  top: 0 !important;
  left: 0 !important;
}

.spinnerContainerPrimary0 {
  padding-top: 0% !important;
  position: relative !important;
  transform: none !important;
  width: fit-content !important;
  margin: 0 auto !important;
  left: 0 !important;
  padding: 10px 20px !important;
}

.messageContainerPrimary0 {
  padding-top: 0% !important;
}
</style>
