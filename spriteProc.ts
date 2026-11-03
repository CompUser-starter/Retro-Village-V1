// Pure pixel helpers (no DOM access) that turn painted sprite sheets into small,
// crisp, game-ready sprites. Kept DOM-free so the exact same code can be tested
// outside the browser.

export interface Img {
  w: number;
  h: number;
  data: Uint8ClampedArray; // RGBA
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function makeImg(w: number, h: number): Img {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

/* ------------------------------------------------------------------ */
/* Background removal                                                 */
/* ------------------------------------------------------------------ */

/** The magenta key colour, including JPEG noise and dark-magenta edge blends. */
function isKey(r: number, g: number, b: number): boolean {
  const mx = Math.max(r, b);
  const mn = Math.min(r, b);
  return mx > 60 && mx - mn < 0.2 * mx + 12 && g < 0.38 * mn;
}

/** Pink/purple blend of the key colour with the art (only removed next to the background). */
function isPinkHalo(r: number, g: number, b: number): boolean {
  const mx = Math.max(r, b);
  return r - g > 40 && b - g > 40 && Math.abs(r - b) < 0.35 * mx;
}

/**
 * Makes the background transparent (mutates img):
 * 1. the magenta key colour anywhere in the image,
 * 2. pink halo pixels that touch the background,
 * 3. if the border is NOT magenta (e.g. a checkerboard or flat grey sheet was dropped in),
 *    a flood fill from the border over colours that look like the border.
 */
export function removeBackground(img: Img): void {
  const { w, h, data } = img;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (isKey(data[o], data[o + 1], data[o + 2])) data[o + 3] = 0;
  }

  for (let pass = 0; pass < 2; pass++) {
    const kill: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (data[o + 3] === 0 || !isPinkHalo(data[o], data[o + 1], data[o + 2])) continue;
        if (
          (x > 0 && data[o - 1] === 0) ||
          (x < w - 1 && data[o + 7] === 0) ||
          (y > 0 && data[o - w * 4 + 3] === 0) ||
          (y < h - 1 && data[o + w * 4 + 3] === 0)
        )
          kill.push(o);
      }
    }
    for (const o of kill) data[o + 3] = 0;
  }

  // border flood fill for non-magenta backgrounds
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  let keyed = 0;
  for (const i of border) if (data[i * 4 + 3] === 0) keyed++;
  if (keyed / border.length >= 0.6) return;

  const buckets = new Map<number, { r: number; g: number; b: number; c: number }>();
  for (const i of border) {
    const o = i * 4;
    if (data[o + 3] === 0) continue;
    const k = ((data[o] >> 4) << 8) | ((data[o + 1] >> 4) << 4) | (data[o + 2] >> 4);
    const bk = buckets.get(k) ?? { r: 0, g: 0, b: 0, c: 0 };
    bk.r += data[o];
    bk.g += data[o + 1];
    bk.b += data[o + 2];
    bk.c++;
    buckets.set(k, bk);
  }
  const nonKey = border.length - keyed;
  const bg: [number, number, number][] = [];
  let cum = 0;
  for (const bk of [...buckets.values()].sort((a, b) => b.c - a.c)) {
    bg.push([bk.r / bk.c, bk.g / bk.c, bk.b / bk.c]);
    cum += bk.c;
    if (cum >= nonKey * 0.85 || bg.length >= 8) break;
  }
  const nearBg = (o: number) =>
    bg.some(([r, g, b]) => Math.abs(data[o] - r) + Math.abs(data[o + 1] - g) + Math.abs(data[o + 2] - b) < 60);

  const seen = new Uint8Array(n);
  const q = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  for (const i of border) {
    if (seen[i]) continue;
    if (data[i * 4 + 3] === 0 || nearBg(i * 4)) {
      seen[i] = 1;
      q[qt++] = i;
    }
  }
  while (qh < qt) {
    const i = q[qh++];
    data[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (const j of nb) {
      if (j < 0 || seen[j]) continue;
      if (data[j * 4 + 3] === 0 || nearBg(j * 4)) {
        seen[j] = 1;
        q[qt++] = j;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Finding the individual sprites on a sheet                          */
/* ------------------------------------------------------------------ */

/** Tight bounding box of the opaque pixels inside a region. */
function tightBox(img: Img, x0: number, y0: number, x1: number, y1: number): Box | null {
  let minX = x1;
  let minY = y1;
  let maxX = -1;
  let maxY = -1;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Connected groups of opaque pixels (on a coarse grid, slightly dilated so that
 * nearly-touching parts of one sprite stay together). Tiny specks are dropped.
 */
export function findBlobs(img: Img, minFrac = 0.04, region?: Box): Box[] {
  const rg = region ?? { x: 0, y: 0, w: img.w, h: img.h };
  // ~4px cells on the sheets we use; parts closer than ~2 cells stay linked
  const cell = Math.max(2, Math.round(Math.sqrt(img.w * img.h) / 350));
  const gw = Math.ceil(rg.w / cell);
  const gh = Math.ceil(rg.h / cell);
  const cnt = new Uint16Array(gw * gh);
  for (let y = rg.y; y < rg.y + rg.h; y++) {
    const row = (((y - rg.y) / cell) | 0) * gw;
    for (let x = rg.x; x < rg.x + rg.w; x++)
      if (img.data[(y * img.w + x) * 4 + 3] !== 0) cnt[row + (((x - rg.x) / cell) | 0)]++;
  }
  const thr = Math.max(1, Math.floor(cell * cell * 0.15));
  const on = new Uint8Array(gw * gh);
  for (let i = 0; i < on.length; i++) on[i] = cnt[i] >= thr ? 1 : 0;

  const R = 1;
  const dil = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (!on[gy * gw + gx]) continue;
      for (let dy = -R; dy <= R; dy++) {
        const yy = gy + dy;
        if (yy < 0 || yy >= gh) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = gx + dx;
          if (xx >= 0 && xx < gw) dil[yy * gw + xx] = 1;
        }
      }
    }
  }

  const lab = new Int32Array(gw * gh).fill(-1);
  const found: { box: Box; area: number }[] = [];
  const q = new Int32Array(gw * gh);
  for (let s = 0; s < dil.length; s++) {
    if (!dil[s] || lab[s] >= 0) continue;
    const id = found.length;
    let qh = 0;
    let qt = 0;
    q[qt++] = s;
    lab[s] = id;
    let x0 = gw;
    let y0 = gh;
    let x1 = -1;
    let y1 = -1;
    let area = 0;
    while (qh < qt) {
      const c = q[qh++];
      const cx = c % gw;
      const cy = (c / gw) | 0;
      if (on[c]) {
        area++;
        if (cx < x0) x0 = cx;
        if (cx > x1) x1 = cx;
        if (cy < y0) y0 = cy;
        if (cy > y1) y1 = cy;
      }
      const nb = [cx > 0 ? c - 1 : -1, cx < gw - 1 ? c + 1 : -1, cy > 0 ? c - gw : -1, cy < gh - 1 ? c + gw : -1];
      for (const d of nb) {
        if (d >= 0 && dil[d] && lab[d] < 0) {
          lab[d] = id;
          q[qt++] = d;
        }
      }
    }
    if (x1 < 0) continue;
    const box = tightBox(
      img,
      rg.x + x0 * cell,
      rg.y + y0 * cell,
      Math.min(rg.x + rg.w, rg.x + (x1 + 1) * cell),
      Math.min(rg.y + rg.h, rg.y + (y1 + 1) * cell)
    );
    if (box) found.push({ box, area });
  }
  const maxArea = Math.max(0, ...found.map((f) => f.area));
  return found.filter((f) => f.area >= maxArea * minFrac).map((f) => f.box);
}

/** Groups boxes into rows (top to bottom), each row sorted left to right. */
export function groupRows(boxes: Box[]): Box[][] {
  const rows: { y0: number; y1: number; items: Box[] }[] = [];
  for (const b of [...boxes].sort((p, q) => p.y + p.h / 2 - (q.y + q.h / 2))) {
    const row = rows.find((r) => Math.min(r.y1, b.y + b.h) - Math.max(r.y0, b.y) > 0.25 * Math.min(r.y1 - r.y0, b.h));
    if (row) {
      row.items.push(b);
      row.y0 = Math.min(row.y0, b.y);
      row.y1 = Math.max(row.y1, b.y + b.h);
    } else rows.push({ y0: b.y, y1: b.y + b.h, items: [b] });
  }
  return rows.sort((a, b) => a.y0 - b.y0).map((r) => r.items.sort((a, b) => a.x - b.x));
}

/** For an evenly spaced grid: the union of the blobs found inside each cell. */
export function gridBoxes(img: Img, cols: number, rows: number): (Box | null)[][] {
  const out: (Box | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (Box | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const x0 = Math.round((c * img.w) / cols);
      const y0 = Math.round((r * img.h) / rows);
      const region = { x: x0, y: y0, w: Math.round(((c + 1) * img.w) / cols) - x0, h: Math.round(((r + 1) * img.h) / rows) - y0 };
      const blobs = findBlobs(img, 0.05, region);
      if (!blobs.length) {
        row.push(null);
        continue;
      }
      const bx0 = Math.min(...blobs.map((b) => b.x));
      const by0 = Math.min(...blobs.map((b) => b.y));
      const bx1 = Math.max(...blobs.map((b) => b.x + b.w));
      const by1 = Math.max(...blobs.map((b) => b.y + b.h));
      row.push({ x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 });
    }
    out.push(row);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Down-scaling                                                       */
/* ------------------------------------------------------------------ */

/**
 * Pixel-art friendly down-scale: every output pixel takes the most common colour
 * (coarsely bucketed) of its source block, so edges stay crisp instead of blurry.
 */
export function downscaleMode(src: Img, box: Box, scale: number): Img {
  const tw = Math.max(1, Math.round(box.w * scale));
  const th = Math.max(1, Math.round(box.h * scale));
  const out = makeImg(tw, th);
  const hist = new Int32Array(512 * 4);
  const touched: number[] = [];
  for (let ty = 0; ty < th; ty++) {
    const sy0 = box.y + Math.floor((ty * box.h) / th);
    const sy1 = Math.max(sy0 + 1, box.y + Math.floor(((ty + 1) * box.h) / th));
    for (let tx = 0; tx < tw; tx++) {
      const sx0 = box.x + Math.floor((tx * box.w) / tw);
      const sx1 = Math.max(sx0 + 1, box.x + Math.floor(((tx + 1) * box.w) / tw));
      let total = 0;
      let opaque = 0;
      for (let y = sy0; y < sy1; y++) {
        for (let x = sx0; x < sx1; x++) {
          total++;
          const o = (y * src.w + x) * 4;
          if (src.data[o + 3] === 0) continue;
          opaque++;
          const r = src.data[o];
          const g = src.data[o + 1];
          const b = src.data[o + 2];
          const k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
          const hk = k * 4;
          if (hist[hk] === 0) touched.push(hk);
          hist[hk]++;
          hist[hk + 1] += r;
          hist[hk + 2] += g;
          hist[hk + 3] += b;
        }
      }
      if (opaque >= total * 0.42 && touched.length) {
        let best = touched[0];
        for (const t of touched) if (hist[t] > hist[best]) best = t;
        const n = hist[best];
        const o = (ty * tw + tx) * 4;
        out.data[o] = Math.round(hist[best + 1] / n);
        out.data[o + 1] = Math.round(hist[best + 2] / n);
        out.data[o + 2] = Math.round(hist[best + 3] / n);
        out.data[o + 3] = 255;
      }
      for (const t of touched) {
        hist[t] = 0;
        hist[t + 1] = 0;
        hist[t + 2] = 0;
        hist[t + 3] = 0;
      }
      touched.length = 0;
    }
  }
  return out;
}

/** Smooth area-average down-scale (for UI icons shown at larger sizes). */
export function downscaleAvg(src: Img, box: Box, scale: number): Img {
  const tw = Math.max(1, Math.round(box.w * scale));
  const th = Math.max(1, Math.round(box.h * scale));
  const out = makeImg(tw, th);
  for (let ty = 0; ty < th; ty++) {
    const sy0 = box.y + Math.floor((ty * box.h) / th);
    const sy1 = Math.max(sy0 + 1, box.y + Math.floor(((ty + 1) * box.h) / th));
    for (let tx = 0; tx < tw; tx++) {
      const sx0 = box.x + Math.floor((tx * box.w) / tw);
      const sx1 = Math.max(sx0 + 1, box.x + Math.floor(((tx + 1) * box.w) / tw));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let y = sy0; y < sy1; y++) {
        for (let x = sx0; x < sx1; x++) {
          const o = (y * src.w + x) * 4;
          const al = src.data[o + 3];
          r += src.data[o] * al;
          g += src.data[o + 1] * al;
          b += src.data[o + 2] * al;
          a += al;
          n++;
        }
      }
      const o = (ty * tw + tx) * 4;
      if (a > 0) {
        out.data[o] = Math.round(r / a);
        out.data[o + 1] = Math.round(g / a);
        out.data[o + 2] = Math.round(b / a);
      }
      out.data[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Frame helpers                                                      */
/* ------------------------------------------------------------------ */

/** Adds a 1px outline around the opaque pixels (the image grows by 2px each way). */
export function outlined(img: Img, rgb: [number, number, number]): Img {
  const out = makeImg(img.w + 2, img.h + 2);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.data[(y * img.w + x) * 4 + 3] > 0;
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const o = (y * out.w + x) * 4;
      const sx = x - 1;
      const sy = y - 1;
      if (solid(sx, sy)) {
        const so = (sy * img.w + sx) * 4;
        out.data[o] = img.data[so];
        out.data[o + 1] = img.data[so + 1];
        out.data[o + 2] = img.data[so + 2];
        out.data[o + 3] = 255;
      } else if (solid(sx - 1, sy) || solid(sx + 1, sy) || solid(sx, sy - 1) || solid(sx, sy + 1)) {
        out.data[o] = rgb[0];
        out.data[o + 1] = rgb[1];
        out.data[o + 2] = rgb[2];
        out.data[o + 3] = 255;
      }
    }
  }
  return out;
}

/** Mean x of the opaque pixels in the top part (head/hat) – a stable anchor for walk cycles. */
export function anchorX(img: Img, topFrac = 0.45): number {
  let sum = 0;
  let n = 0;
  const maxY = Math.max(1, Math.round(img.h * topFrac));
  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] > 0) {
        sum += x;
        n++;
      }
    }
  }
  return n ? sum / n : img.w / 2;
}

/** Copies src into a new frame of size fw×fh, bottom-aligned, with src's anchor at the centre. */
export function placeInFrame(src: Img, fw: number, fh: number, anchor: number): Img {
  const out = makeImg(fw, fh);
  const ox = Math.round(fw / 2 - anchor);
  const oy = fh - src.h;
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const so = (y * src.w + x) * 4;
      if (src.data[so + 3] === 0) continue;
      const dx = x + ox;
      const dy = y + oy;
      if (dx < 0 || dy < 0 || dx >= fw || dy >= fh) continue;
      const o = (dy * fw + dx) * 4;
      out.data[o] = src.data[so];
      out.data[o + 1] = src.data[so + 1];
      out.data[o + 2] = src.data[so + 2];
      out.data[o + 3] = src.data[so + 3];
    }
  }
  return out;
}

export function mirrored(img: Img): Img {
  const out = makeImg(img.w, img.h);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const so = (y * img.w + x) * 4;
      const o = (y * img.w + (img.w - 1 - x)) * 4;
      out.data[o] = img.data[so];
      out.data[o + 1] = img.data[so + 1];
      out.data[o + 2] = img.data[so + 2];
      out.data[o + 3] = img.data[so + 3];
    }
  }
  return out;
}

/**
 * Fakes a front-facing step from an idle frame: lifts the left (phase 1) or
 * right (phase 2) foot by one pixel and bobs the body up by one pixel.
 */
export function stepFrame(idle: Img, phase: 0 | 1 | 2): Img {
  if (phase === 0) return { w: idle.w, h: idle.h, data: new Uint8ClampedArray(idle.data) };
  const out = makeImg(idle.w, idle.h);
  let top = idle.h;
  let bottom = -1;
  for (let y = 0; y < idle.h; y++)
    for (let x = 0; x < idle.w; x++)
      if (idle.data[(y * idle.w + x) * 4 + 3] > 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
  const legTop = Math.round(bottom - (bottom - top) * 0.22);
  const mid = idle.w / 2;
  for (let y = 0; y < idle.h; y++) {
    for (let x = 0; x < idle.w; x++) {
      const so = (y * idle.w + x) * 4;
      if (idle.data[so + 3] === 0) continue;
      const lifted = y >= legTop && (phase === 1 ? x < mid : x >= mid);
      const dy = y - 1 - (lifted ? 1 : 0);
      if (dy < 0) continue;
      const o = (dy * idle.w + x) * 4;
      out.data[o] = idle.data[so];
      out.data[o + 1] = idle.data[so + 1];
      out.data[o + 2] = idle.data[so + 2];
      out.data[o + 3] = 255;
    }
  }
  return out;
}

/**
 * Scales a set of boxes from one sheet with ONE shared factor (so frames keep the
 * same size), then places them in equal frames, bottom-aligned on a stable anchor.
 */
export function buildFrames(
  src: Img,
  boxes: Box[],
  targetH: number,
  opts: { outline?: [number, number, number]; anchorTop?: boolean } = {}
): Img[] {
  if (!boxes.length) return [];
  const refH = Math.max(...boxes.map((b) => b.h));
  const scale = targetH / refH;
  const pieces = boxes.map((b) => {
    let im = downscaleMode(src, b, scale);
    if (opts.outline) im = outlined(im, opts.outline);
    return im;
  });
  const fw = Math.max(...pieces.map((p) => p.w)) + 2;
  const fh = Math.max(...pieces.map((p) => p.h));
  return pieces.map((p) => placeInFrame(p, fw, fh, opts.anchorTop === false ? p.w / 2 : anchorX(p)));
}
