import fs from 'node:fs';
import path from 'node:path';
import { SplatBuffer } from '@mkkellogg/gaussian-splats-3d';

// Losslessly copies selected compressed splats and their original bucket centers.
// Each spatial bucket keeps a deterministic, opacity-weighted sample so coverage
// stays more even than a single global alpha threshold.
const [sourcePath, outputPath, rawRatio] = process.argv.slice(2);
const ratio = Number(rawRatio);
if (!sourcePath || !outputPath || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) {
  throw new Error('Usage: node scripts/reduce-ksplat.mjs input.ksplat output.ksplat retention-ratio');
}
if (path.resolve(sourcePath) === path.resolve(outputPath)) {
  throw new Error('Input and output must be different paths.');
}

const source = fs.readFileSync(sourcePath);
const sourceData = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const splats = new SplatBuffer(sourceData);
if (splats.sections.length !== 1 || splats.compressionLevel < 1) {
  throw new Error('This reducer expects a compressed, single-section KSplat.');
}

const section = splats.sections[0];
const alphaOffset = SplatBuffer.CompressionLevels[splats.compressionLevel].ColorOffsetBytes + 3;
const selected = new Uint8Array(splats.getSplatCount());
const buckets = [];
let firstSplat = 0;
let retainedCount = 0;

const deterministicRandom = (index) => {
  let value = Math.imul(index ^ 0x9e3779b9, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
};

for (let bucketIndex = 0; bucketIndex < section.bucketCount; bucketIndex++) {
  const length = bucketIndex < section.fullBucketCount
    ? section.bucketSize
    : section.partiallyFilledBucketLengths[bucketIndex - section.fullBucketCount];
  const ranked = [];
  for (let i = firstSplat; i < firstSplat + length; i++) {
    const alpha = source[section.dataBase + i * section.bytesPerSplat + alphaOffset];
    const weight = 0.25 + 0.75 * (alpha / 255);
    const random = Math.max(deterministicRandom(i), Number.EPSILON);
    ranked.push({ index: i, score: Math.log(random) / weight });
  }
  ranked.sort((a, b) => b.score - a.score);
  const retained = Math.max(1, Math.round(length * ratio));
  for (let i = 0; i < retained; i++) selected[ranked[i].index] = 1;
  buckets.push({ bucketIndex, firstSplat, length, retained });
  retainedCount += retained;
  firstSplat += length;
}
if (firstSplat !== selected.length) throw new Error('Bucket index mapping does not match the splat count.');

// All output buckets are marked partial, with explicit lengths. The splat bytes
// are copied unchanged: no re-quantization of color, scale, rotation or position.
const headerBytes = SplatBuffer.HeaderSizeBytes + SplatBuffer.SectionHeaderSizeBytes;
const metadataBytes = buckets.length * 4;
const centersBytes = buckets.length * SplatBuffer.BucketStorageSizeBytes;
const dataStart = headerBytes + metadataBytes + centersBytes;
const output = Buffer.alloc(dataStart + retainedCount * section.bytesPerSplat);
source.copy(output, 0, 0, headerBytes);
output.writeUInt32LE(retainedCount, 12);
output.writeUInt32LE(retainedCount, 16);
output.writeUInt32LE(retainedCount, SplatBuffer.HeaderSizeBytes);
output.writeUInt32LE(retainedCount, SplatBuffer.HeaderSizeBytes + 4);
output.writeUInt32LE(buckets.length, SplatBuffer.HeaderSizeBytes + 12);
output.writeUInt32LE(output.length - headerBytes, SplatBuffer.HeaderSizeBytes + 28);
output.writeUInt32LE(0, SplatBuffer.HeaderSizeBytes + 32);
output.writeUInt32LE(buckets.length, SplatBuffer.HeaderSizeBytes + 36);

let outputSplat = 0;
for (let b = 0; b < buckets.length; b++) {
  const bucket = buckets[b];
  output.writeUInt32LE(bucket.retained, headerBytes + b * 4);
  for (let axis = 0; axis < 3; axis++) {
    output.writeFloatLE(section.bucketArray[bucket.bucketIndex * 3 + axis],
      headerBytes + metadataBytes + b * 12 + axis * 4);
  }
  for (let i = bucket.firstSplat; i < bucket.firstSplat + bucket.length; i++) {
    if (!selected[i]) continue;
    source.copy(output, dataStart + outputSplat * section.bytesPerSplat,
      section.dataBase + i * section.bytesPerSplat,
      section.dataBase + (i + 1) * section.bytesPerSplat);
    outputSplat++;
  }
}
if (outputSplat !== retainedCount) throw new Error('Output splat count mismatch.');

const parsedOutput = new SplatBuffer(output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength));
if (parsedOutput.getSplatCount() !== retainedCount ||
    parsedOutput.sections[0].bucketCount !== buckets.length) {
  throw new Error('Output KSplat validation failed.');
}

fs.writeFileSync(outputPath, output, { flag: 'wx' });
console.log(JSON.stringify({ sourcePath, outputPath, inputSplats: selected.length,
  outputSplats: retainedCount, inputBytes: source.length, outputBytes: output.length }));
