// Makes the app icon (build/icon.png) so no picture files are needed in this repo.
const fs = require('fs');
const zlib = require('zlib');

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function makeIcon(size) { // purple square with a white chat bubble
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const inTri = (px, py, a, b, c) => {
    const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
    const P = [px, py], d1 = s(P, a, b), d2 = s(P, b, c), d3 = s(P, c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        const u = (x + (sx + 0.5) / 2) / size, v = (y + (sy + 0.5) / 2) / size;
        const dx = (u - 0.5) / 0.27, dy = (v - 0.45) / 0.21;
        let white = dx * dx + dy * dy <= 1 || inTri(u, v, [0.32, 0.58], [0.32, 0.72], [0.46, 0.64]);
        for (const cx of [0.40, 0.50, 0.60]) if ((u - cx) ** 2 + (v - 0.45) ** 2 <= 0.032 ** 2) white = false;
        sum += white ? 1 : 0;
      }
      const w = sum / 4, o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = Math.round(88 + (255 - 88) * w); raw[o + 1] = Math.round(101 + (255 - 101) * w); raw[o + 2] = Math.round(242 + (255 - 242) * w); raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/icon.png', makeIcon(512));
console.log('Wrote build/icon.png');
