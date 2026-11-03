// Minimal software canvas for headless render checks (rects, images, transforms, alpha, basic text).
import { encodePng } from "../scripts/android-icons.mjs";
import fs from "node:fs";
const hex = (s) => {
  if (typeof s !== "string") return [255, 0, 255, 1];
  if (s[0] === "#") {
    const h = s.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (m) {
    const p = m[1].split(",").map(Number);
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? p[3] : 1];
  }
  return [255, 0, 255, 1];
};
class Ctx {
  constructor(cv) {
    this.cv = cv;
    this.W = cv.width;
    this.H = cv.height;
    this.data = new Uint8ClampedArray(this.W * this.H * 4);
    this.fillStyle = "#000";
    this.strokeStyle = "#000";
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.font = "18px VT323";
    this.textAlign = "left";
    this.textBaseline = "top";
    this.m = [1, 0, 0, 1, 0, 0];
    this.stack = [];
    this.imageSmoothingEnabled = false;
  }
  _tp(x, y) {
    const m = this.m;
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }
  _resolve(style) {
    // a gradient object (from our stub) -> pick a representative stop colour
    if (style && typeof style === "object" && Array.isArray(style.stops) && style.stops.length) {
      return hex(style.stops[0]);
    }
    return hex(style);
  }
  save() {
    this.stack.push({ m: [...this.m], a: this.globalAlpha, f: this.fillStyle, s: this.strokeStyle, lw: this.lineWidth, t: this.textAlign, b: this.textBaseline });
  }
  restore() {
    const s = this.stack.pop();
    if (!s) return;
    this.m = s.m;
    this.globalAlpha = s.a;
    this.fillStyle = s.f;
    this.strokeStyle = s.s;
    this.lineWidth = s.lw;
    this.textAlign = s.t;
    this.textBaseline = s.b;
  }
  translate(x, y) {
    const m = this.m;
    m[4] += m[0] * x + m[2] * y;
    m[5] += m[1] * x + m[3] * y;
  }
  scale(x, y) {
    const m = this.m;
    m[0] *= x;
    m[1] *= x;
    m[2] *= y;
    m[3] *= y;
  }
  rotate(a) {
    const m = this.m, c = Math.cos(a), s = Math.sin(a);
    const [a0, b0, c0, d0] = m;
    m[0] = a0 * c + c0 * s;
    m[1] = b0 * c + d0 * s;
    m[2] = c0 * c - a0 * s;
    m[3] = d0 * c - b0 * s;
  }
  _px(x, y, col, al) {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const a = al * (col[3] ?? 1);
    if (a <= 0) return;
    const o = (y * this.W + x) * 4;
    for (let i = 0; i < 3; i++) this.data[o + i] = this.data[o + i] * (1 - a) + col[i] * a;
    this.data[o + 3] = 255;
  }
  fillRect(x, y, w, h) {
    const [r, g, b, a] = this._resolve(this.fillStyle);
    const p0 = this._tp(x, y), p1 = this._tp(x + w, y + h);
    const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), y0 = Math.min(p0[1], p1[1]), y1 = Math.max(p0[1], p1[1]);
    for (let yy = Math.round(y0); yy < Math.round(y1); yy++)
      for (let xx = Math.round(x0); xx < Math.round(x1); xx++) this._px(xx, yy, [r, g, b, a], this.globalAlpha);
  }
  strokeRect(x, y, w, h) {
    const c = this.strokeStyle, lw = this.lineWidth, f = this.fillStyle;
    this.fillStyle = c;
    this.fillRect(x, y, w, lw);
    this.fillRect(x, y + h - lw, w, lw);
    this.fillRect(x, y, lw, h);
    this.fillRect(x + w - lw, y, lw, h);
    this.fillStyle = f;
  }
  clearRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  fill() {}
  stroke() {}
  clip() {}
  rect() {}
  fillText(t, x, y) {
    const sz = parseInt(/(\d+)px/.exec(this.font)?.[1] ?? "18");
    const s = String(t);
    const cw = sz * 0.52;
    let sx = x;
    if (this.textAlign === "center") sx = x - (s.length * cw) / 2;
    else if (this.textAlign === "right") sx = x - s.length * cw;
    const top = this.textBaseline === "middle" ? y - sz * 0.35 : y;
    const [r, g, b] = this._resolve(this.fillStyle);
    for (let i = 0; i < s.length; i++) {
      if (s[i] === " ") continue;
      for (let px = 0; px < Math.round(cw) - 1; px++)
        for (let py = 0; py < Math.round(sz * 0.7); py++)
          if (px === 0 || py === 0 || (px + py) % 3 === 0) this._px(Math.round(sx + i * cw + px), Math.round(top + py), [r, g, b, 1], this.globalAlpha);
    }
  }
  measureText(t) {
    return { width: String(t).length * 6 };
  }
  createLinearGradient() {
    return { stops: [], addColorStop(p, c) { this.stops.push(c); } };
  }
  createRadialGradient() {
    return { stops: [], addColorStop(p, c) { this.stops.push(c); } };
  }
  createImageData(w, h) {
    return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  }
  getImageData(x, y, w, h) {
    const out = new Uint8ClampedArray(w * h * 4);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const sx = x + i, sy = y + j;
        if (sx < 0 || sy < 0 || sx >= this.W || sy >= this.H) continue;
        out.set(this.data.subarray((sy * this.W + sx) * 4, (sy * this.W + sx) * 4 + 4), (j * w + i) * 4);
      }
    return { width: w, height: h, data: out };
  }
  putImageData(img, dx, dy) {
    for (let j = 0; j < img.height; j++)
      for (let i = 0; i < img.width; i++) {
        const o = (j * img.width + i) * 4;
        if (img.data[o + 3] === 0) continue;
        const tx = dx + i, ty = dy + j;
        if (tx < 0 || ty < 0 || tx >= this.W || ty >= this.H) continue;
        const t = (ty * this.W + tx) * 4;
        this.data[t] = img.data[o];
        this.data[t + 1] = img.data[o + 1];
        this.data[t + 2] = img.data[o + 2];
        this.data[t + 3] = 255;
      }
  }
  drawImage(img, ...a) {
    if (!img) throw new Error("drawImage(null)");
    const sw = img.width, sh = img.height;
    let sx = 0, sy = 0, ssw = sw, ssh = sh, dx, dy, dw, dh;
    if (a.length <= 4) {
      [dx, dy] = a;
      dw = a[2] ?? sw;
      dh = a[3] ?? sh;
    } else [sx, sy, ssw, ssh, dx, dy, dw, dh] = a;
    const src = img._ctx ? img._ctx.data : null;
    if (!src) return;
    for (let j = 0; j < dh; j++)
      for (let i = 0; i < dw; i++) {
        const u = sx + Math.floor((i / dw) * ssw), v = sy + Math.floor((j / dh) * ssh);
        if (u < 0 || v < 0 || u >= sw || v >= sh) continue;
        const o = (v * sw + u) * 4;
        if (src[o + 3] === 0) continue;
        const [tx, ty] = this._tp(dx + i, dy + j);
        this._px(Math.round(tx), Math.round(ty), [src[o], src[o + 1], src[o + 2], src[o + 3] / 255], this.globalAlpha);
      }
  }
}
class Canvas {
  constructor(w = 0, h = 0) {
    this.width = w;
    this.height = h;
    this._ctx = null;
  }
  getContext() {
    if (!this._ctx || this._ctx.W !== this.width || this._ctx.H !== this.height) this._ctx = new Ctx(this);
    return this._ctx;
  }
  toDataURL() {
    return "data:,";
  }
}
export function makeCanvas(w, h) {
  const c = new Canvas(w, h);
  c.getContext();
  return c;
}
export function savePng(cv, p) {
  const d = cv._ctx.data, o = new Uint8ClampedArray(d.length);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) {
      o[i] = 40;
      o[i + 1] = 40;
      o[i + 2] = 50;
    } else {
      o[i] = d[i];
      o[i + 1] = d[i + 1];
      o[i + 2] = d[i + 2];
    }
    o[i + 3] = 255;
  }
  fs.writeFileSync(p, encodePng({ w: cv.width, h: cv.height, data: o }));
}
export function installDom() {
  globalThis.HTMLCanvasElement = Canvas;
  class Img {
    constructor() {
      this.width = 1;
      this.height = 1;
    }
  }
  globalThis.Image = Img;
  globalThis.HTMLImageElement = Img;
  globalThis.document = {
    createElement: (t) => (t === "canvas" ? new Canvas() : { style: {} }),
    getElementById: () => null,
    addEventListener() {},
    removeEventListener() {},
    documentElement: { style: {}, lang: "en" },
    hidden: false,
  };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, innerWidth: 390, innerHeight: 844 };
  globalThis.navigator = { userAgent: "node" };
  globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(0), 0);
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
}
