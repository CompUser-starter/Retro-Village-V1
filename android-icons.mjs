// Builds proper Android launcher icons from one square PNG (no extra npm packages,
// only Node's built-in zlib). Writes, for every density:
//   ic_launcher.png            legacy icon with rounded corners (Android 7)
//   ic_launcher_round.png      round legacy icon
//   ic_launcher_foreground.png adaptive-icon foreground (Android 8+), art inside the safe zone
// plus values/ic_launcher_background.xml (colour taken from the icon's edge) and
// the mipmap-anydpi-v26 adaptive icon XML files.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* ------------------------------ PNG codec ------------------------------ */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function decodePng(buf) {
  const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!SIG.every((b, i) => buf[i] === b)) throw new Error("not a PNG file");
  let pos = 8;
  let w = 0, h = 0, depth = 0, ctype = 0, interlace = 0;
  let palette = null, trns = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      ctype = data[9];
      interlace = data[12];
    } else if (type === "PLTE") palette = data;
    else if (type === "tRNS") trns = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (interlace !== 0) throw new Error("interlaced PNG not supported");
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  if (!channels || !(depth === 8 || (depth === 16 && ctype !== 3))) throw new Error(`unsupported PNG (type ${ctype}, depth ${depth})`);
  const bpp = channels * (depth / 8);
  const stride = w * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0;
      const b = y > 0 ? px[dst - stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[dst + x] = v & 0xff;
    }
  }
  const out = new Uint8ClampedArray(w * h * 4);
  const step = depth / 8; // 16-bit: use the high byte
  for (let i = 0; i < w * h; i++) {
    const s = i * bpp;
    const o = i * 4;
    if (ctype === 6) {
      out[o] = px[s]; out[o + 1] = px[s + step]; out[o + 2] = px[s + 2 * step]; out[o + 3] = px[s + 3 * step];
    } else if (ctype === 2) {
      out[o] = px[s]; out[o + 1] = px[s + step]; out[o + 2] = px[s + 2 * step]; out[o + 3] = 255;
    } else if (ctype === 0) {
      out[o] = out[o + 1] = out[o + 2] = px[s]; out[o + 3] = 255;
    } else if (ctype === 4) {
      out[o] = out[o + 1] = out[o + 2] = px[s]; out[o + 3] = px[s + step];
    } else {
      const k = px[s];
      out[o] = palette[k * 3]; out[o + 1] = palette[k * 3 + 1]; out[o + 2] = palette[k * 3 + 2];
      out[o + 3] = trns && k < trns.length ? trns[k] : 255;
    }
  }
  return { w, h, data: out };
}

export function encodePng(img) {
  const { w, h, data } = img;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type, "ascii"), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(tb));
    return Buffer.concat([len, tb, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------ image ops ------------------------------ */
/** Area-average resize (premultiplied alpha). */
export function resize(img, tw, th) {
  const out = { w: tw, h: th, data: new Uint8ClampedArray(tw * th * 4) };
  for (let ty = 0; ty < th; ty++) {
    const y0 = Math.floor((ty * img.h) / th);
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * img.h) / th));
    for (let tx = 0; tx < tw; tx++) {
      const x0 = Math.floor((tx * img.w) / tw);
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * img.w) / tw));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (y * img.w + x) * 4;
          const al = img.data[o + 3];
          r += img.data[o] * al; g += img.data[o + 1] * al; b += img.data[o + 2] * al; a += al; n++;
        }
      }
      const o = (ty * tw + tx) * 4;
      if (a > 0) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
      out.data[o + 3] = a / n;
    }
  }
  return out;
}

/** Multiplies alpha by a shape mask (rounded square or circle) with a soft 1px edge. */
function mask(img, shape) {
  const { w, h, data } = img;
  const r = shape === "circle" ? w / 2 : w * 0.18;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5, py = y + 0.5;
      let d;
      if (shape === "circle") d = Math.hypot(px - w / 2, py - h / 2) - w / 2;
      else {
        const qx = Math.max(r - px, 0, px - (w - r));
        const qy = Math.max(r - py, 0, py - (h - r));
        d = Math.hypot(qx, qy) - r;
      }
      const cover = Math.max(0, Math.min(1, 0.5 - d));
      data[(y * w + x) * 4 + 3] *= cover;
    }
  }
  return img;
}

/** Centres img on a transparent size×size canvas; its border fades out so it melts into the background colour. */
function placeCentered(img, size, feather = 0.1) {
  const out = { w: size, h: size, data: new Uint8ClampedArray(size * size * 4) };
  const ox = Math.round((size - img.w) / 2);
  const oy = Math.round((size - img.h) / 2);
  const f = Math.max(1, img.w * feather);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const s = (y * img.w + x) * 4;
      const o = ((y + oy) * size + x + ox) * 4;
      const d = Math.min(x, y, img.w - 1 - x, img.h - 1 - y);
      const t = Math.min(1, d / f);
      out.data[o] = img.data[s];
      out.data[o + 1] = img.data[s + 1];
      out.data[o + 2] = img.data[s + 2];
      out.data[o + 3] = img.data[s + 3] * t * t * (3 - 2 * t);
    }
  }
  return out;
}

/** Average colour of the outer 2px ring of the icon (used as adaptive background). */
function edgeColor(img) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (x > 1 && y > 1 && x < img.w - 2 && y < img.h - 2) continue;
      const o = (y * img.w + x) * 4;
      r += img.data[o]; g += img.data[o + 1]; b += img.data[o + 2]; n++;
    }
  }
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

/* ------------------------------ Android output ------------------------------ */
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const ADAPTIVE = (fg) => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/${fg}"/>
</adaptive-icon>
`;

/** Writes all launcher icons into an Android res/ folder. Returns the background colour. */
export function writeAndroidIcons(resDir, iconFile) {
  let src = decodePng(fs.readFileSync(iconFile));
  // square-crop just in case the icon is not square
  if (src.w !== src.h) {
    const s = Math.min(src.w, src.h);
    const ox = Math.floor((src.w - s) / 2), oy = Math.floor((src.h - s) / 2);
    const sq = { w: s, h: s, data: new Uint8ClampedArray(s * s * 4) };
    for (let y = 0; y < s; y++) sq.data.set(src.data.subarray(((y + oy) * src.w + ox) * 4, ((y + oy) * src.w + ox + s) * 4), y * s * 4);
    src = sq;
  }
  // pre-shrink once to 512px: faster and cleaner for all the small sizes
  if (src.w > 512) src = resize(src, 512, 512);

  for (const [name, k] of Object.entries(DENSITIES)) {
    const dir = path.join(resDir, `mipmap-${name}`);
    fs.mkdirSync(dir, { recursive: true });
    const legacy = Math.round(48 * k);
    fs.writeFileSync(path.join(dir, "ic_launcher.png"), encodePng(mask(resize(src, legacy, legacy), "rounded")));
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), encodePng(mask(resize(src, legacy, legacy), "circle")));
    // adaptive foreground: 108dp canvas; the launcher shows roughly the central 72dp,
    // so the art is 80dp with a soft edge that blends into the background colour
    const fg = Math.round(108 * k);
    const art = Math.round(80 * k);
    fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), encodePng(placeCentered(resize(src, art, art), fg)));
  }

  const bg = edgeColor(src);
  const values = path.join(resDir, "values");
  fs.mkdirSync(values, { recursive: true });
  fs.writeFileSync(
    path.join(values, "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${bg}</color>\n</resources>\n`
  );
  const any = path.join(resDir, "mipmap-anydpi-v26");
  fs.mkdirSync(any, { recursive: true });
  fs.writeFileSync(path.join(any, "ic_launcher.xml"), ADAPTIVE("ic_launcher_foreground"));
  fs.writeFileSync(path.join(any, "ic_launcher_round.xml"), ADAPTIVE("ic_launcher_foreground"));
  return bg;
}
