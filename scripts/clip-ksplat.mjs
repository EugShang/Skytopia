import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { SplatBuffer } from '@mkkellogg/gaussian-splats-3d';

const [sourcePath, outputPath, ...rawBounds] = process.argv.slice(2);
if (!sourcePath || !outputPath || rawBounds.length !== 6) {
  throw new Error('Usage: node scripts/clip-ksplat.mjs input.ksplat output.ksplat minX maxX minY maxY minZ maxZ');
}

const bounds = rawBounds.map(Number);
if (bounds.some((value) => !Number.isFinite(value)) ||
    bounds[0] >= bounds[1] || bounds[2] >= bounds[3] || bounds[4] >= bounds[5]) {
  throw new Error('Bounds must be six finite numbers with each minimum below its maximum.');
}
if (path.resolve(sourcePath) === path.resolve(outputPath)) {
  throw new Error('Input and output must be different paths.');
}

const source = fs.readFileSync(sourcePath);
const sourceData = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const splats = new SplatBuffer(sourceData);
if (splats.sections.length !== 1 || splats.compressionLevel < 1) {
  throw new Error('This lossless bucket clipping script expects one compressed KSplat section.');
}

const section = splats.sections[0];
const keep = new Uint8Array(splats.getSplatCount());
const center = new THREE.Vector3();
let retainedCount = 0;
for (let i = 0; i < keep.length; i++) {
  splats.getSplatCenter(i, center);
  if (center.x >= bounds[0] && center.x <= bounds[1] &&
      center.y >= bounds[2] && center.y <= bounds[3] &&
      center.z >= bounds[4] && center.z <= bounds[5]) {
    keep[i] = 1;
    retainedCount++;
  }
}
if (retainedCount === 0) throw new Error('The bounds remove every splat.');

const buckets = [];
let firstSplat = 0;
for (let bucketIndex = 0; bucketIndex < section.bucketCount; bucketIndex++) {
  const length = bucketIndex < section.fullBucketCount
    ? section.bucketSize
    : section.partiallyFilledBucketLengths[bucketIndex - section.fullBucketCount];
  let retained = 0;
  for (let i = firstSplat; i < firstSplat + length; i++) retained += keep[i];
  if (retained > 0) buckets.push({ bucketIndex, firstSplat, length, retained });
  firstSplat += length;
}
if (firstSplat !== keep.length) throw new Error('Bucket index mapping does not match the splat count.');

// Keep each compressed splat's bytes and original bucket center unchanged.
// All surviving buckets become partial buckets so their new lengths remain valid.
const headerBytes = SplatBuffer.HeaderSizeBytes + SplatBuffer.SectionHeaderSizeBytes;
const bucketMetadataBytes = buckets.length * 4;
const bucketCentersBytes = buckets.length * SplatBuffer.BucketStorageSizeBytes;
const dataStart = headerBytes + bucketMetadataBytes + bucketCentersBytes;
const output = Buffer.alloc(dataStart + retainedCount * section.bytesPerSplat);
source.copy(output, 0, 0, headerBytes);

output.writeUInt32LE(retainedCount, 12); // global max splat count
output.writeUInt32LE(retainedCount, 16); // global loaded splat count
output.writeUInt32LE(retainedCount, SplatBuffer.HeaderSizeBytes);
output.writeUInt32LE(retainedCount, SplatBuffer.HeaderSizeBytes + 4);
output.writeUInt32LE(buckets.length, SplatBuffer.HeaderSizeBytes + 12);
output.writeUInt32LE(output.length - headerBytes, SplatBuffer.HeaderSizeBytes + 28);
output.writeUInt32LE(0, SplatBuffer.HeaderSizeBytes + 32); // full buckets
output.writeUInt32LE(buckets.length, SplatBuffer.HeaderSizeBytes + 36); // partial buckets

let outputSplat = 0;
for (let b = 0; b < buckets.length; b++) {
  const bucket = buckets[b];
  output.writeUInt32LE(bucket.retained, headerBytes + b * 4);
  for (let axis = 0; axis < 3; axis++) {
    output.writeFloatLE(section.bucketArray[bucket.bucketIndex * 3 + axis],
      headerBytes + bucketMetadataBytes + b * 12 + axis * 4);
  }
  for (let i = bucket.firstSplat; i < bucket.firstSplat + bucket.length; i++) {
    if (!keep[i]) continue;
    source.copy(output, dataStart + outputSplat * section.bytesPerSplat,
      section.dataBase + i * section.bytesPerSplat,
      section.dataBase + (i + 1) * section.bytesPerSplat);
    outputSplat++;
  }
}
if (outputSplat !== retainedCount) throw new Error('Output splat count mismatch.');

const verified = new SplatBuffer(output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength));
if (verified.getSplatCount() !== retainedCount) throw new Error('Output KSplat validation failed.');
for (let i = 0; i < retainedCount; i++) {
  verified.getSplatCenter(i, center);
  if (center.x < bounds[0] || center.x > bounds[1] ||
      center.y < bounds[2] || center.y > bounds[3] ||
      center.z < bounds[4] || center.z > bounds[5]) {
    throw new Error(`Output splat ${i} is outside the selected bounds.`);
  }
}

fs.writeFileSync(outputPath, output, { flag: 'wx' });
console.log(JSON.stringify({
  inputSplats: keep.length,
  outputSplats: retainedCount,
  removedSplats: keep.length - retainedCount,
  inputBytes: source.length,
  outputBytes: output.length,
  bounds,
}, null, 2));
