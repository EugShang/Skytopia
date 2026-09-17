import { generateForestCloud } from './forest-cloud';
import { createForestCloudRenderer } from './forest-cloud-renderer';

// Homepage-only procedural point-cloud forest.
export function createForestScene(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const points = generateForestCloud();
  const renderer = createForestCloudRenderer(points);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const path = depth => Math.sin(depth * 0.115) * 1.4;
  let width = 0, height = 0, frame = 0, last = 0;
  let z = 8, visible = true;
  const draw = () => {
    if (!width || !height) return;
    const eyeX = path(z + 1) * 0.6 + 1;
    const eye = [eyeX, 3.0, z - 8];
    const target = [path(z + 1) * 0.7, 2.0, z + 4];
    const focal = Math.min(width * 0.62, height * 0.83);
    const bg = context.createRadialGradient(width * 0.5, height * 0.3, 0, width * 0.5, height * 0.5, Math.max(width, height));
    bg.addColorStop(0, '#111e30');
    bg.addColorStop(1, '#060a13');
    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    if (renderer?.draw(context, width, height, eye, target, focal, 1, ratio)) return;
    // Sparse fallback on devices without WebGL.
    const forward = target.map((v, i) => v - eye[i]);
    const n = Math.hypot(...forward);
    for (let i = 0; i < 3; i++) forward[i] /= n;
    const right = [forward[2], 0, -forward[0]];
    const rn = Math.hypot(...right);
    for (let i = 0; i < 3; i++) right[i] /= rn;
    const up = [forward[1] * right[2], forward[2] * right[0] - forward[0] * right[2], -forward[1] * right[0]];
    for (let i = 0; i < points.length; i += width < 700 ? 15 : 9) {
      const point = points[i], delta = point.p.map((v, axis) => v - eye[axis]);
      const depth = delta[0] * forward[0] + delta[1] * forward[1] + delta[2] * forward[2];
      if (depth < 1 || depth > 65) continue;
      const px = width * 0.5 + (delta[0] * right[0] + delta[1] * right[1] + delta[2] * right[2]) * focal / depth;
      const py = height * 0.46 - (delta[0] * up[0] + delta[1] * up[1] + delta[2] * up[2]) * focal / depth;
      if (px < 0 || px > width || py < 0 || py > height) continue;
      const size = point.size * Math.max(0.6, Math.min(2.5, 17 / depth));
      context.globalAlpha = point.alpha * Math.min(1, (depth - 1) / 2) * Math.exp(-depth * 0.033);
      context.fillStyle = 'rgb(' + point.rgb.map(v => Math.round(v * 255)).join(',') + ')';
      context.beginPath();
      context.ellipse(px, py, size * 0.6, size * 0.45, point.variation * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
  const tick = now => {
    frame = 0;
    if (!visible || document.hidden || motion.matches) return;
    if (last) z += Math.min((now - last) / 1000, 0.045) * 0.8;
    if (z > 62) z = 8;
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    stop();
    draw();
    if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
  };
  const resize = new ResizeObserver(() => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  });
  resize.observe(canvas);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  return () => {
    stop();
    resize.disconnect();
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
    renderer?.destroy();
  };
}
