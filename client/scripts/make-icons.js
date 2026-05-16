// Generates icon-192.png and icon-512.png using only Node.js built-ins.
// Produces solid-colour PNGs (purple #4B0082) — replace with real artwork if desired.

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size, r, g, b) {
  const scanline = Buffer.alloc(1 + size * 3);
  scanline[0] = 0; // filter: None
  for (let x = 0; x < size; x++) {
    scanline[1 + x * 3] = r;
    scanline[1 + x * 3 + 1] = g;
    scanline[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => scanline));
  const compressed = zlib.deflateSync(raw, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, '..', 'public');
// #4B0082 = rgb(75, 0, 130)
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), makePng(192, 75, 0, 130));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), makePng(512, 75, 0, 130));
console.log('Icons written: icon-192.png, icon-512.png');
