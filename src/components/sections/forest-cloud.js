export function generateForestCloud() {
  let seed = 173;
  const rand = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  const path = z => Math.sin(z * 0.115) * 1.4;
  const points = [];
  const add = (x, y, z, color, rgb, brightness = 1) => {
    const variation = rand();
    // Mostly fine grains, with a small tail of larger, softer splats.
    const size = 0.6 + Math.pow(rand(), 2.2) * 1.5 + (rand() > 0.975 ? 1.1 : 0);
    const alpha = (0.35 + rand() * 0.57) * brightness;
    points.push({ p: [x, y, z], color, rgb, size, alpha, variation });
  };
  for (let row = 0; row < 42; row++) for (const side of [-1, 1]) {
    const tz = row * 2.08 - 7 + rand() * 1.1;
    const tx = path(tz) + side * (3.7 + rand() * 6.0);
    const height = 4.5 + rand() * 4.2, radius = 1.15 + rand() * 1.25;
    const leanX = (rand() - 0.5) * 0.8, leanZ = (rand() - 0.5) * 0.6;
    const trunkRadius = 0.12 + rand() * 0.14, phase = rand() * Math.PI * 2;
    const trunk = t => [tx + leanX * t + Math.sin(t * 4 + phase) * t * 0.12, height * t, tz + leanZ * t];
    for (let i = 0; i < 720; i++) {
      const t = rand() * 0.85, a = rand() * Math.PI * 2;
      const r = trunkRadius * (1 - t * 0.7) * (1 + Math.exp(-t * 30) * 1.5) * (1 + Math.sin(a * 9 + t * 24) * 0.13);
      const p = trunk(t), light = 0.64 + (Math.cos(a + 1) + 1) * 0.18 + rand() * 0.1;
      add(p[0] + Math.cos(a) * r, p[1], p[2] + Math.sin(a) * r, 1, [0.69 * light, 0.66 * light, 0.60 * light]);
    }
    const lobes = [];
    for (let branch = 0; branch < 8; branch++) {
      const a = phase + branch * 2.3999, level = 0.46 + branch * 0.049;
      const reach = radius * (0.6 + rand() * 0.5), start = trunk(level);
      const end = [start[0] + Math.cos(a) * reach, height * (level + 0.16 + rand() * 0.08), start[2] + Math.sin(a) * reach];
      for (let i = 0; i < 65; i++) {
        const t = rand(), angle = rand() * Math.PI * 2, r = trunkRadius * 0.45 * (1 - t * 0.8);
        add(start[0] + (end[0] - start[0]) * t + Math.cos(angle) * r,
          start[1] + (end[1] - start[1]) * t - Math.sin(t * Math.PI) * 0.16,
          start[2] + (end[2] - start[2]) * t + Math.sin(angle) * r, 1, [0.43, 0.57, 0.63]);
      }
      lobes.push({ center: end, rx: radius * (0.5 + rand() * 0.3), ry: radius * (0.38 + rand() * 0.28), rz: radius * (0.48 + rand() * 0.3), tint: rand() });
    }
    lobes.push({ center: trunk(0.92), rx: radius * 0.7, ry: radius * 0.52, rz: radius * 0.7, tint: rand() });
    for (let i = 0; i < 2350; i++) {
      const lobe = lobes[Math.floor(rand() * lobes.length)];
      const a = rand() * Math.PI * 2, ny = rand() * 2 - 1, latitude = Math.sqrt(1 - ny * ny);
      const nx = Math.cos(a) * latitude, nz = Math.sin(a) * latitude;
      const shell = rand() < 0.74 ? 0.78 + rand() * 0.24 : Math.cbrt(rand()) * 0.85;
      const irregularity = 1 + 0.12 * Math.sin(a * 5 + phase) * Math.sin(ny * 7);
      const px = lobe.center[0] + nx * lobe.rx * shell * irregularity;
      const py = lobe.center[1] + ny * lobe.ry * shell;
      const pz = lobe.center[2] + nz * lobe.rz * shell * irregularity;
      const light = 0.58 + Math.max(0, ny * 0.5 - nx * 0.45 - nz * 0.3) * 0.5 + rand() * 0.15;
      const hue = lobe.tint;
      add(px, py, pz, 0, [(0.32 + hue * 0.13) * light, (0.64 + hue * 0.1) * light, (0.63 + hue * 0.21) * light]);
    }
    // Surface roots anchor each tree instead of ending in floating vertical lines.
    for (let root = 0; root < 5; root++) {
      const a = phase + root * 1.256;
      for (let i = 0; i < 38; i++) {
        const t = rand(), reach = trunkRadius * 5 * t;
        add(tx + Math.cos(a) * reach + (rand() - 0.5) * 0.06, 0.2 * (1 - t) ** 2, tz + Math.sin(a) * reach, 1, [0.37, 0.49, 0.51], 0.72);
      }
    }
  }
  // Dappled, uneven forest floor, with a softer clearing through the centre.
  for (let i = 0; i < 52000; i++) {
    const z = rand() * 88 - 7, x = (rand() - 0.5) * 28;
    const clearing = Math.abs(x - path(z)) < 2.5;
    const y = Math.sin(x * 0.9 + z * 0.35) * 0.07 + rand() * 0.08;
    const light = 0.65 + rand() * 0.65;
    add(x, y, z, 2, clearing ? [0.31 * light, 0.40 * light, 0.43 * light] : [0.23 * light, 0.47 * light, 0.45 * light], clearing ? 0.38 : 0.58);
  }
  for (let shrub = 0; shrub < 280; shrub++) {
    const z = rand() * 82 - 4, x = path(z) + (rand() < 0.5 ? -1 : 1) * (2.9 + rand() * 7.5);
    const height = 0.2 + rand() * 0.65;
    for (let i = 0; i < 65; i++) {
      const a = rand() * Math.PI * 2, t = rand(), radius = Math.sin(t * Math.PI) * height;
      add(x + Math.cos(a) * radius, t * height, z + Math.sin(a) * radius, 0, [0.3, 0.6, 0.54], 0.65);
    }
  }
  return points;
}
