/**
 * Renders the fire flipbooks (src/scene/fireSheets.ts) to public/assets/textures/fx/flames_<kind>.png,
 * so the game loads them as ordinary images instead of painting them in the browser.
 * Usage: npm run gen:fire (node runs the TypeScript directly)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { flameSheetPixels } from '../src/scene/fireSheets.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'textures', 'fx');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
/** A minimal RGBA PNG encoder (no filtering beyond "none"). */
function png(width: number, height: number, rgba: Uint8ClampedArray): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', new Uint8Array())]);
}

mkdirSync(OUT, { recursive: true });
for (const kind of ['warm', 'ink'] as const) {
  const { width, height, data } = flameSheetPixels(kind);
  const file = join(OUT, `flames_${kind}.png`);
  writeFileSync(file, png(width, height, data));
  console.log(`${file} ${width}x${height}`);
}
