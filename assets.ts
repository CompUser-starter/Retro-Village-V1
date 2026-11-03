// Painted art: sprite sheets, UI icons and backgrounds.
// The sheets are processed once at start-up (while the splash screen is visible):
// background removed, frames found, scaled down to crisp pixel sprites.
// If any image is missing or cannot be processed, the game silently keeps using
// the built-in procedural art for that part.
//
// To use your own art, replace the files in src/assets/ with the same names:
//   ui-icons.jpg      6 icons, 2 columns x 3 rows: play, quests, settings, info, home, coin
//   (The shared code-drawn UI pack in uipack.ts is the fallback for every other icon;
//    a painted sheet named game-icons.jpg with 4 cols x 4 rows in the order
//    cave, climb, maze, blocks, shooter, snake, cafe, car, apples, castle, rhythm, bird, fish
//    will be picked up automatically by loadGameIcons below.)
//   player-sheet.jpg  main character, 5 columns x 4 rows (see PLAYER_LAYOUT below)
//   cave-hero.jpg     cave runner, one row: idle, run, run, run, jump, fall, hurt
//   cave-things.jpg   row 1: bat frames, row 2: rock spikes, crystals, stump
//   cave-strip.jpg    wide cave panorama (side-scrolling background)
//   cave-bg.jpg       tall cave background
// Sheets may use a magenta, checkerboard or flat background.

import uiIconsUrl from "../assets/ui-icons.jpg";
import playerUrl from "../assets/player-sheet.jpg";
import caveHeroUrl from "../assets/cave-hero.jpg";
import caveThingsUrl from "../assets/cave-things.jpg";
import caveStripUrl from "../assets/cave-strip.jpg";
import caveBgUrl from "../assets/cave-bg.jpg";
import roomArcadeUrl from "../assets/room-arcade.jpg";
import roomSchoolUrl from "../assets/room-school.jpg";
import villageBgUrl from "../assets/menu-bg.jpg";
import {
  buildFrames,
  downscaleAvg,
  findBlobs,
  gridBoxes,
  groupRows,
  mirrored,
  removeBackground,
  stepFrame,
  type Box,
  type Img,
} from "./spriteProc";
import type { Dir } from "./sprites";

const OUTLINE: [number, number, number] = [42, 26, 16];
const DIRS: Dir[] = ["down", "left", "right", "up"];

/** [row, col, mirror?] on the 5x4 player sheet. */
type Ref = [number, number, boolean?];
interface DirLayout {
  idle: Ref;
  /** 4 walking frames, or "step" to animate the idle frame (used when a sheet has no front walk) */
  walk: Ref[] | "step";
}

/**
 * Which cells of player-sheet.jpg are used. On the current sheet every walking
 * frame faces right, so left = mirrored right, and the front walk is stepped.
 */
const PLAYER_LAYOUT: Record<Dir, DirLayout> = {
  down: { idle: [0, 0], walk: "step" },
  left: { idle: [1, 0], walk: [[2, 1, true], [2, 2, true], [2, 3, true], [2, 4, true]] },
  right: { idle: [1, 0, true], walk: [[2, 1], [2, 2], [2, 3], [2, 4]] },
  up: { idle: [3, 0], walk: [[3, 1], [3, 2], [3, 3], [3, 4]] },
};

/** Reading order of the 2x3 icon sheet. */
const ICON_ORDER = ["play", "scroll", "gear", "info", "home", "coin"];

type FrameSet = Record<Dir, HTMLCanvasElement[]>;

export const ART: {
  player: { big: FrameSet; small: FrameSet } | null;
  icons: Map<string, string>;
  hero: { idle: HTMLCanvasElement; run: HTMLCanvasElement[]; jump: HTMLCanvasElement; fall: HTMLCanvasElement; hurt: HTMLCanvasElement } | null;
  bats: HTMLCanvasElement[];
  obstacles: { rock: HTMLCanvasElement; crystal: HTMLCanvasElement; stump: HTMLCanvasElement } | null;
  caveStrip: HTMLImageElement | null;
  caveBg: HTMLImageElement | null;
  rooms: Partial<Record<string, HTMLImageElement>>;
  villageBg: HTMLImageElement | null;
} = {
  player: null,
  icons: new Map(),
  hero: null,
  bats: [],
  obstacles: null,
  caveStrip: null,
  caveBg: null,
  rooms: {},
  villageBg: null,
};

/* ------------------------------------------------------------------ */
/* DOM helpers                                                        */
/* ------------------------------------------------------------------ */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`image failed: ${url.slice(0, 40)}`));
    im.src = url;
  });
}

function readPixels(im: HTMLImageElement): Img {
  const c = document.createElement("canvas");
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("no 2d context");
  g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  return { w: c.width, h: c.height, data: d.data };
}

function toCanvas(img: Img): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.w;
  c.height = img.h;
  const g = c.getContext("2d")!;
  const id = g.createImageData(img.w, img.h);
  id.data.set(img.data);
  g.putImageData(id, 0, 0);
  return c;
}

async function sheet(url: string): Promise<Img> {
  const img = readPixels(await loadImage(url));
  removeBackground(img);
  return img;
}

/* ------------------------------------------------------------------ */
/* Loaders                                                            */
/* ------------------------------------------------------------------ */
async function loadIcons() {
  const src = await sheet(uiIconsUrl);
  gridBoxes(src, 2, 3)
    .flat()
    .forEach((b, i) => {
      if (!b || !ICON_ORDER[i]) return;
      const im = downscaleAvg(src, b, 96 / Math.max(b.w, b.h));
      ART.icons.set(ICON_ORDER[i], toCanvas(im).toDataURL());
    });
}

/** Reading order of an optional painted 4×4 game-icon sheet (src/assets/game-icons.jpg). */
const GAME_ICON_ORDER = ["cave", "climb", "maze", "blocks", "shooter", "snake", "cafe", "car", "apples", "castle", "rhythm", "bird", "fish"];

/** Optional: painted mini-game icons. Missing file → the code-drawn pack is used. */
async function loadGameIcons() {
  const mods = import.meta.glob("../assets/game-icons.jpg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
  const url = Object.values(mods)[0];
  if (!url) return;
  const src = await sheet(url);
  gridBoxes(src, 4, 4)
    .flat()
    .forEach((b, i) => {
      if (!b || !GAME_ICON_ORDER[i]) return;
      const im = downscaleAvg(src, b, 96 / Math.max(b.w, b.h));
      ART.icons.set(GAME_ICON_ORDER[i], toCanvas(im).toDataURL());
    });
}

async function loadPlayer() {
  const src = await sheet(playerUrl);
  const grid = gridBoxes(src, 5, 4);
  const boxes: Box[] = [];
  const index = new Map<string, number>();
  const use = (r: Ref) => {
    const k = `${r[0]},${r[1]}`;
    if (index.has(k)) return;
    const b = grid[r[0]]?.[r[1]];
    if (!b) throw new Error(`player cell ${k} is empty`);
    index.set(k, boxes.length);
    boxes.push(b);
  };
  for (const d of DIRS) {
    const L = PLAYER_LAYOUT[d];
    use(L.idle);
    if (L.walk !== "step") L.walk.forEach(use);
  }

  const make = (targetH: number): FrameSet => {
    const frames = buildFrames(src, boxes, targetH, { outline: OUTLINE });
    const get = (r: Ref) => {
      const f = frames[index.get(`${r[0]},${r[1]}`)!];
      return r[2] ? mirrored(f) : f;
    };
    const set = {} as FrameSet;
    for (const d of DIRS) {
      const L = PLAYER_LAYOUT[d];
      const idle = get(L.idle);
      const walk = L.walk === "step" ? [stepFrame(idle, 0), stepFrame(idle, 1), stepFrame(idle, 0), stepFrame(idle, 2)] : L.walk.map(get);
      set[d] = [idle, ...walk].map(toCanvas);
    }
    return set;
  };
  ART.player = { big: make(24), small: make(16) };
}

async function loadHero() {
  const src = await sheet(caveHeroUrl);
  const row = groupRows(findBlobs(src))[0] ?? [];
  if (row.length < 7) throw new Error(`cave hero: found ${row.length} frames, need 7`);
  const f = buildFrames(src, row.slice(0, 7), 28, { outline: OUTLINE }).map(toCanvas);
  ART.hero = { idle: f[0], run: [f[1], f[2], f[3]], jump: f[4], fall: f[5], hurt: f[6] };
}

async function loadThings() {
  const src = await sheet(caveThingsUrl);
  const rows = groupRows(findBlobs(src));
  if (rows[0] && rows[0].length >= 3) {
    ART.bats = buildFrames(src, rows[0], 22, { outline: OUTLINE, anchorTop: false }).map(toCanvas);
  }
  if (rows[1] && rows[1].length >= 3) {
    const o = buildFrames(src, rows[1].slice(0, 3), 20, { outline: OUTLINE, anchorTop: false }).map(toCanvas);
    ART.obstacles = { rock: o[0], crystal: o[1], stump: o[2] };
  }
}

async function loadBackgrounds() {
  const [strip, bg, arcade, school, village] = await Promise.allSettled([
    loadImage(caveStripUrl),
    loadImage(caveBgUrl),
    loadImage(roomArcadeUrl),
    loadImage(roomSchoolUrl),
    loadImage(villageBgUrl),
  ]);
  if (strip.status === "fulfilled") ART.caveStrip = strip.value;
  if (bg.status === "fulfilled") ART.caveBg = bg.value;
  if (arcade.status === "fulfilled") ART.rooms.arcade = arcade.value;
  if (school.status === "fulfilled") ART.rooms.school = school.value;
  if (bg.status === "fulfilled") ART.rooms.cave = bg.value;
  if (village.status === "fulfilled") ART.villageBg = village.value;
}

/** The painted room for a building, as a plain URL (used as a CSS backdrop). */
export function roomUrl(building: string): string | null {
  return ART.rooms[building]?.src ?? null;
}

let loading: Promise<void> | null = null;

/** Processes all art once. Never rejects: failed parts just keep the procedural fallback. */
export function loadArt(): Promise<void> {
  if (!loading) {
    loading = Promise.allSettled([loadIcons(), loadGameIcons(), loadPlayer(), loadHero(), loadThings(), loadBackgrounds()]).then((res) => {
      for (const r of res) if (r.status === "rejected") console.warn("[art]", r.reason);
    });
  }
  return loading;
}

/* ------------------------------------------------------------------ */
/* Pre-scaled backgrounds for the low-resolution game canvases        */
/* ------------------------------------------------------------------ */

/** Smoothly scales an image to w×h in a few halving steps (much cleaner than one big jump). */
function smoothScale(img: HTMLImageElement | HTMLCanvasElement, srcW: number, srcH: number, w: number, h: number): HTMLCanvasElement {
  let cur: HTMLImageElement | HTMLCanvasElement = img;
  let cw = srcW;
  let ch = srcH;
  while (cw / 2 > w && ch / 2 > h) {
    const nw = Math.round(cw / 2);
    const nh = Math.round(ch / 2);
    const c = document.createElement("canvas");
    c.width = nw;
    c.height = nh;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(cur, 0, 0, nw, nh);
    cur = c;
    cw = nw;
    ch = nh;
  }
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const g = out.getContext("2d")!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(cur, 0, 0, w, h);
  return out;
}

const bgCache = new Map<string, HTMLCanvasElement>();

/**
 * The cave panorama scaled to the given height, followed by its mirror image,
 * so it can be repeated forever without a visible seam.
 */
export function caveStripTile(height: number, darken = 0): HTMLCanvasElement | null {
  const im = ART.caveStrip;
  if (!im) return null;
  const key = `strip|${height}|${darken}`;
  let c = bgCache.get(key);
  if (!c) {
    const w = Math.round((im.naturalWidth * height) / im.naturalHeight);
    const one = smoothScale(im, im.naturalWidth, im.naturalHeight, w, height);
    c = document.createElement("canvas");
    c.width = w * 2;
    c.height = height;
    const g = c.getContext("2d")!;
    g.drawImage(one, 0, 0);
    g.save();
    g.translate(w * 2, 0);
    g.scale(-1, 1);
    g.drawImage(one, 0, 0);
    g.restore();
    if (darken > 0) {
      g.fillStyle = `rgba(10,8,20,${darken})`;
      g.fillRect(0, 0, c.width, c.height);
    }
    bgCache.set(key, c);
  }
  return c;
}

/** The tall cave background, cover-fitted to w×h. */
export function caveBackdrop(w: number, h: number, darken = 0): HTMLCanvasElement | null {
  const im = ART.caveBg;
  if (!im) return null;
  const key = `bg|${w}|${h}|${darken}`;
  let c = bgCache.get(key);
  if (!c) {
    const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    const sw = Math.round(im.naturalWidth * s);
    const sh = Math.round(im.naturalHeight * s);
    const scaled = smoothScale(im, im.naturalWidth, im.naturalHeight, sw, sh);
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.drawImage(scaled, Math.round((w - sw) / 2), Math.round((h - sh) / 2));
    if (darken > 0) {
      g.fillStyle = `rgba(10,8,20,${darken})`;
      g.fillRect(0, 0, w, h);
    }
    bgCache.set(key, c);
  }
  return c;
}
