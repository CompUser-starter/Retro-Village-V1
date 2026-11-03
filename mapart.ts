// Village map: layout data + procedural pixel-art rendering (all original).
// Tile size 16px. The map is pre-rendered once: base layer, 2 water frames and a foreground layer
// (tree canopies / bunting) that is drawn over the player.

import { PAL, mk, iconCanvas, outlineCanvas, type Dir } from "./sprites";
import type { BuildingId } from "./data";

export const TS = 16;
export const MW = 24;
export const MH = 30;

export interface Bld {
  id: BuildingId;
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
}

export const BLDS: Bld[] = [
  { id: "cave", x: 1, y: 1, w: 6, h: 4, door: { x: 4, y: 5 } },
  { id: "school", x: 9, y: 1, w: 5, h: 4, door: { x: 11, y: 5 } },
  { id: "arcade", x: 17, y: 1, w: 5, h: 4, door: { x: 19, y: 5 } },
  { id: "cafe", x: 1, y: 8, w: 5, h: 4, door: { x: 3, y: 12 } },
  { id: "square", x: 9, y: 8, w: 7, h: 5, door: { x: 12, y: 11 } },
  { id: "shop", x: 18, y: 8, w: 5, h: 4, door: { x: 20, y: 12 } },
  { id: "farm", x: 1, y: 15, w: 8, h: 5, door: { x: 9, y: 17 } },
  { id: "home", x: 14, y: 15, w: 5, h: 4, door: { x: 16, y: 19 } },
  { id: "pond", x: 4, y: 23, w: 16, h: 6, door: { x: 11, y: 22 } },
];

export interface NpcDef {
  id: string;
  look: string;
  x: number;
  y: number;
  dir: Dir;
}

export const NPCS: NpcDef[] = [
  { id: "elder", look: "elder", x: 19, y: 19, dir: "left" },
  { id: "teacher", look: "teacher", x: 8, y: 6, dir: "right" },
  { id: "cafe_owner", look: "cafe", x: 6, y: 13, dir: "left" },
  { id: "shepherd", look: "shepherd", x: 9, y: 19, dir: "up" },
  { id: "shopkeeper", look: "shopkeeper", x: 17, y: 13, dir: "right" },
];

export const SPAWN = { x: 11.5 * TS, y: 14 * TS + 12 };

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type G = CanvasRenderingContext2D;
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};

/* ------------------------------------------------------------------ */
/* Buildings                                                          */
/* ------------------------------------------------------------------ */
interface HouseOpts {
  roof: string;
  roofDark: string;
  wall: string;
  wallDark: string;
  base: string;
  door: string;
  trim: string;
  windows: number[];
  winY?: number;
  glass?: string;
  /** Tudor-style timber framing colour; omit for a plain stucco wall. */
  beam?: string;
  /** Add a little flower box under the first window. */
  flowerBox?: boolean;
  /** Add rounded bushes at the base corners (cottage-garden look). */
  bush?: boolean;
  /** Chimney position (x) with a soft smoke puff; omit for none. */
  chimneyX?: number;
}

function windowAt(g: G, x: number, y: number, trim: string, glass: string) {
  R(g, x, y, 14, 12, trim);
  R(g, x + 2, y + 2, 10, 8, glass);
  R(g, x + 6, y + 2, 2, 8, trim);
  R(g, x + 2, y + 5, 10, 1, trim);
  R(g, x + 3, y + 3, 2, 1, "rgba(255,255,255,0.75)");
  R(g, x - 1, y - 2, 16, 2, "#fff8ea");
}

function flowerBox(g: G, x: number, y: number) {
  R(g, x - 1, y, 16, 5, PAL.n);
  R(g, x - 1, y, 16, 1, PAL.N);
  for (let i = 0; i < 4; i++) {
    const col = [PAL.r, PAL.y, PAL.m, PAL.w][i % 4];
    R(g, x + 1 + i * 3, y - 3, 2, 3, "#3e8948");
    R(g, x + 1 + i * 3, y - 4, 2, 2, col);
  }
}

function bush(g: G, x: number, y: number, w: number) {
  R(g, x, y - 4, w, 4, "#3e8948");
  R(g, x + 1, y - 6, w - 2, 3, "#4a9a3e");
  R(g, x + 2, y - 7, Math.max(2, w - 5), 2, "#6abe30");
}

function house(W: number, H: number, o: HouseOpts): [HTMLCanvasElement, G] {
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  // roof: terracotta tiles with a ridge cap and soft highlight
  R(g, 0, 0, W, 24, o.roof);
  for (let row = 0; row < 6; row++) {
    const y = row * 4;
    R(g, 0, y + 3, W, 1, o.roofDark);
    for (let x = (row % 2) * 6; x < W; x += 12) R(g, x, y, 1, 3, o.roofDark);
  }
  R(g, 0, 0, W, 2, "rgba(255,255,255,0.35)");
  R(g, 0, 22, W, 2, o.roofDark);
  R(g, -2, 21, W + 4, 3, o.roofDark); // eave overhang
  // wall: warm stucco
  R(g, 0, 24, W, H - 24, o.wall);
  for (let y = 30; y < H - 4; y += 6) R(g, 0, y, W, 1, o.wallDark);
  R(g, 0, 24, W, 3, "rgba(255,255,255,0.25)");
  R(g, 0, H - 4, W, 4, o.base);
  R(g, 0, H - 4, W, 1, "rgba(255,255,255,0.25)");
  R(g, 0, 0, 1, H, "rgba(0,0,0,0.12)");
  R(g, W - 1, 0, 1, H, "rgba(0,0,0,0.2)");
  // Tudor timber framing: corner posts + a mid beam
  if (o.beam) {
    R(g, 3, 24, 3, H - 28, o.beam);
    R(g, W - 6, 24, 3, H - 28, o.beam);
    R(g, 0, 40, W, 3, o.beam);
  }
  // door
  const dx = Math.floor(W / 2) - 6;
  R(g, dx - 1, H - 28, 14, 28, o.trim);
  R(g, dx, H - 27, 12, 27, o.door);
  R(g, dx + 2, H - 24, 8, 9, "rgba(0,0,0,0.16)");
  R(g, dx + 9, H - 14, 2, 2, PAL.y);
  // windows
  const wy = o.winY ?? 32;
  for (const wx of o.windows) windowAt(g, wx, wy, o.trim, o.glass ?? PAL.c);
  if (o.flowerBox && o.windows.length) flowerBox(g, o.windows[0], wy + 13);
  if (o.bush) {
    bush(g, -2, H - 2, 16);
    bush(g, W - 16, H - 2, 16);
  }
  if (o.chimneyX !== undefined) {
    const cx = o.chimneyX;
    R(g, cx, 2, 7, 15, o.roofDark);
    R(g, cx - 1, 1, 9, 3, PAL.N);
    R(g, cx + 1, 4, 2, 1, "#c9826a");
    // soft smoke puffs
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.fillRect(cx + 7, -4, 4, 4);
    g.fillStyle = "rgba(255,255,255,0.4)";
    g.fillRect(cx + 10, -9, 5, 5);
    g.fillStyle = "rgba(255,255,255,0.28)";
    g.fillRect(cx + 14, -15, 6, 6);
  }
  return [c, g];
}

function awning(g: G, W: number, a: string, b: string) {
  for (let x = 2, i = 0; x < W - 2; x += 8, i++) {
    R(g, x, 24, 8, 9, i % 2 ? b : a);
    R(g, x, 33, 8, 2, i % 2 ? b : a);
    R(g, x + 2, 35, 4, 1, i % 2 ? b : a);
  }
  R(g, 2, 24, W - 4, 2, "rgba(0,0,0,0.25)");
  R(g, 2, 33, W - 4, 1, "rgba(0,0,0,0.2)");
}

function sign(g: G, W: number, icon: string, y = 5) {
  const ic = iconCanvas(icon);
  const x = Math.floor(W / 2 - ic.width / 2);
  R(g, x - 3, y - 2, ic.width + 6, ic.height + 4, PAL.N);
  R(g, x - 2, y - 1, ic.width + 4, ic.height + 2, PAL.h);
  g.drawImage(ic, x, y);
}

function drawBuilding(id: BuildingId): HTMLCanvasElement | null {
  const rnd = mulberry32(id.length * 977);
  switch (id) {
    case "home": {
      const [c, g] = house(80, 64, {
        roof: PAL.r, roofDark: PAL.R, wall: "#fff4dc", wallDark: "#ecd7ad", base: "#8a6a4e",
        door: PAL.n, trim: "#6b4226", windows: [10, 56], beam: "#6b4226", flowerBox: true, bush: true, chimneyX: 60,
      });
      sign(g, 80, "heart", 8);
      return c;
    }
    case "cafe": {
      const [c, g] = house(80, 64, {
        roof: PAL.o, roofDark: PAL.O, wall: "#fff0da", wallDark: "#ecd3a8", base: "#8a6a4e",
        door: "#6b4226", trim: "#6b4226", windows: [8, 58], winY: 38, beam: "#a8784a", flowerBox: true, chimneyX: 60,
      });
      awning(g, 80, PAL.r, "#fff4dc");
      sign(g, 80, "coffee", 6);
      return c;
    }
    case "school": {
      const [c, g] = house(80, 64, {
        roof: PAL.B, roofDark: "#1f3d7a", wall: "#fff4dc", wallDark: "#e3d2a4", base: "#8a6a4e",
        door: "#6b4226", trim: "#6b4226", windows: [58], beam: "#a8784a", bush: true,
      });
      sign(g, 80, "scroll", 8);
      R(g, 66, 3, 1, 17, PAL.e);
      R(g, 67, 3, 8, 5, PAL.r);
      R(g, 67, 3, 8, 1, "rgba(255,255,255,0.3)");
      // notice board
      R(g, 6, 38, 18, 15, "#6b4226");
      R(g, 8, 40, 14, 11, PAL.h);
      R(g, 9, 41, 5, 4, PAL.w);
      R(g, 15, 42, 5, 6, PAL.y);
      R(g, 10, 47, 6, 3, PAL.c);
      R(g, 11, 41, 1, 1, PAL.r);
      R(g, 17, 42, 1, 1, PAL.r);
      R(g, 8, 53, 2, 8, "#6b4226");
      R(g, 20, 53, 2, 8, "#6b4226");
      return c;
    }
    case "shop": {
      const [c, g] = house(80, 64, {
        roof: PAL.G, roofDark: PAL.D, wall: "#f3dcae", wallDark: "#d9bd84", base: "#8a6a4e",
        door: "#6b4226", trim: "#6b4226", windows: [56], winY: 38, beam: "#8a5c33", bush: true,
      });
      awning(g, 80, PAL.G, "#fff4dc");
      sign(g, 80, "coin", 6);
      // crates + barrel
      R(g, 4, 48, 14, 13, PAL.n);
      R(g, 4, 48, 14, 2, "#6b4226");
      R(g, 4, 54, 14, 1, "#6b4226");
      R(g, 10, 48, 1, 13, "#6b4226");
      R(g, 6, 40, 10, 8, PAL.n);
      R(g, 6, 40, 10, 1, "#6b4226");
      R(g, 8, 41, 6, 2, PAL.r);
      R(g, 64, 50, 12, 12, "#6b4226");
      R(g, 64, 53, 12, 1, PAL.E);
      R(g, 64, 58, 12, 1, PAL.E);
      return c;
    }
    case "arcade": {
      const [c, g] = house(80, 64, {
        roof: PAL.p, roofDark: "#6b3f8f", wall: "#fff0da", wallDark: "#ecd3a8", base: "#8a6a4e",
        door: "#6b4226", trim: "#6b4226", windows: [58], winY: 38, beam: "#a8784a", bush: true,
      });
      // cheerful striped awning with game-icon bunting instead of a neon disco front
      awning(g, 80, PAL.p, "#fff4dc");
      sign(g, 80, "shard", 6);
      // sunny arcade window full of colourful game icons
      R(g, 6, 40, 18, 16, "#6b4226");
      R(g, 8, 42, 14, 12, "#26234a");
      const icons = ["star", "heart"];
      icons.forEach((n, i) => g.drawImage(iconCanvas(n), 10 + i * 8, 44));
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fillRect(8, 42, 14, 12);
      // string of pennant flags along the roofline
      const cols = [PAL.r, PAL.y, PAL.g, PAL.b, PAL.m];
      for (let x = 4, i = 0; x < 76; x += 8, i++) {
        R(g, x, 23, 1, 3, "#6b4226");
        R(g, x, 25, 6, 4, cols[i % cols.length]);
      }
      return c;
    }
    case "cave": {
      const c = mk(96, 64);
      const g = c.getContext("2d")!;
      for (let x = 0; x < 96; x++) {
        const top = Math.max(4, Math.round(16 + 7 * Math.sin(x / 10) + 4 * Math.sin(x / 4 + 1) - (x > 20 && x < 76 ? 8 : 0)));
        for (let y = top; y < 64; y++) {
          const d = y - top;
          let col = d < 2 ? "#d3cec2" : d < 5 ? PAL.e : "#9a96a0";
          const r = rnd();
          if (r < 0.1) col = PAL.E;
          else if (r < 0.15) col = "#c9c4b8";
          if (y > 52) col = r < 0.3 ? "#6f6a6f" : "#807b86";
          R(g, x, y, 1, 1, col);
        }
      }
      // crevices
      for (let i = 0; i < 9; i++) R(g, Math.floor(rnd() * 90), 24 + Math.floor(rnd() * 30), 1, 4 + Math.floor(rnd() * 4), PAL.E);
      // gem glints (warm amber instead of cold cyan, to match the sunny world)
      for (const [x, y] of [[14, 30], [80, 36], [20, 48], [72, 22]]) {
        R(g, x, y, 2, 2, PAL.y);
        R(g, x, y, 1, 1, PAL.w);
      }
      // entrance
      R(g, 37, 32, 22, 32, "#2a1a10");
      R(g, 39, 56, 18, 8, "#3a2415");
      R(g, 52, 50, 3, 3, PAL.y);
      R(g, 52, 50, 1, 1, PAL.w);
      R(g, 34, 30, 3, 34, PAL.n);
      R(g, 59, 30, 3, 34, PAL.n);
      R(g, 32, 27, 32, 4, "#6b4226");
      R(g, 32, 27, 32, 1, PAL.n);
      R(g, 34, 30, 1, 34, "#4a2d1c");
      R(g, 61, 30, 1, 34, "#4a2d1c");
      // grass tufts along the base, to blend with the green village
      for (let x = 0; x < 96; x += 6) R(g, x, 62, 3, 2, "#6abe30");
      // warm lantern (instead of a cold cyan one)
      R(g, 27, 34, 1, 5, PAL.k);
      R(g, 25, 39, 5, 5, PAL.O);
      R(g, 26, 40, 3, 3, PAL.y);
      g.fillStyle = "rgba(251,213,74,0.25)";
      g.fillRect(19, 33, 17, 17);
      return c;
    }
    case "pond": {
      const c = mk(112, 84);
      const g = c.getContext("2d")!;
      // water
      R(g, 0, 0, 112, 84, "#4a90d9");
      for (let y = 0; y < 84; y += 6) R(g, 0, y, 112, 1, "#4689d2");
      for (let i = 0; i < 20; i++) R(g, (i * 37) % 100, (i * 23) % 80, 9, 1, "#7fd6e8");
      for (const [lx, ly] of [[18, 62], [66, 70], [92, 58]] as [number, number][]) {
        R(g, lx, ly, 9, 6, PAL.G);
        R(g, lx + 4, ly + 2, 2, 2, "#2f5aa8");
      }
      // hut (reed roof)
      R(g, 4, 6, 46, 12, PAL.Y);
      for (let x = 4; x < 50; x += 5) R(g, x, 6, 1, 12, PAL.O);
      R(g, 4, 18, 46, 3, PAL.N);
      R(g, 6, 21, 42, 26, PAL.n);
      for (let y = 26; y < 45; y += 6) R(g, 6, y, 42, 1, PAL.N);
      R(g, 20, 26, 14, 21, PAL.N);
      R(g, 21, 27, 12, 20, "#3a2a1e");
      R(g, 30, 36, 2, 2, PAL.y);
      R(g, 8, 25, 10, 9, PAL.e);
      R(g, 9, 26, 8, 7, PAL.c);
      R(g, 12, 26, 1, 7, PAL.e);
      // fish sign
      R(g, 56, 22, 22, 16, PAL.N);
      R(g, 58, 24, 18, 12, PAL.h);
      g.drawImage(iconCanvas("fish"), 62, 26);
      R(g, 58, 38, 2, 12, PAL.N);
      R(g, 74, 38, 2, 12, PAL.N);
      // pier
      R(g, 0, 50, 112, 6, "#7d5632");
      R(g, 0, 56, 112, 6, "#5e3b26");
      for (let x = 0; x < 112; x += 14) {
        R(g, x, 49, 12, 2, "#946a40");
        R(g, x + 6, 56, 2, 14, "#4a2d1c");
      }
      // bucket with fish
      R(g, 84, 40, 14, 12, PAL.e);
      R(g, 84, 40, 14, 2, PAL.E);
      R(g, 84, 46, 14, 1, PAL.E);
      R(g, 87, 42, 8, 3, "#4a90d9");
      R(g, 88, 42, 3, 2, "#7fd6e8");
      // rod
      R(g, 96, 26, 2, 26, PAL.N);
      R(g, 98, 26, 12, 2, PAL.N);
      R(g, 108, 28, 1, 12, "#e3d2a4");
      R(g, 106, 40, 4, 4, PAL.r);
      return c;
    }
    case "square": {
      const c = mk(112, 80);
      const g = c.getContext("2d")!;
      for (let ty = 0; ty < 5; ty++) {
        for (let tx = 0; tx < 7; tx++) {
          const alt = (tx + ty) % 2 === 0;
          R(g, tx * 16, ty * 16, 16, 16, alt ? "#e4c896" : "#d6b67e");
          R(g, tx * 16, ty * 16, 16, 1, "rgba(255,255,255,0.3)");
          R(g, tx * 16, ty * 16, 1, 16, "rgba(0,0,0,0.1)");
          if (rnd() < 0.3) R(g, tx * 16 + 4 + Math.floor(rnd() * 8), ty * 16 + 4 + Math.floor(rnd() * 8), 2, 1, "#c49a55");
        }
      }
      // stage
      R(g, 16, 0, 80, 32, "#5e3b26");
      R(g, 18, 2, 76, 24, PAL.n);
      for (let y = 6; y < 26; y += 5) R(g, 18, y, 76, 1, PAL.N);
      for (let x = 22; x < 94; x += 14) R(g, x, 2, 1, 24, "#7d5632");
      // curtain
      R(g, 24, 0, 64, 12, PAL.r);
      for (let x = 24; x < 88; x += 8) R(g, x, 0, 3, 12, PAL.R);
      R(g, 24, 12, 64, 2, PAL.R);
      R(g, 44, 3, 24, 6, PAL.y);
      R(g, 46, 4, 20, 4, PAL.Y);
      g.drawImage(iconCanvas("star"), 52, 2);
      R(g, 16, 26, 80, 6, PAL.N);
      R(g, 16, 26, 80, 1, PAL.n);
      // steps
      R(g, 48, 32, 16, 4, "#8d8472");
      R(g, 48, 32, 16, 1, "#d6cfbf");
      // lantern posts
      for (const x of [8, 100]) {
        R(g, x, 40, 3, 22, PAL.N);
        R(g, x - 2, 36, 7, 6, PAL.y);
        R(g, x - 1, 37, 5, 4, PAL.w);
      }
      return c;
    }
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Nature                                                             */
/* ------------------------------------------------------------------ */
function treeSprite(variant: number): HTMLCanvasElement {
  const rnd = mulberry32(100 + variant * 31);
  const c = mk(16, 32);
  const g = c.getContext("2d")!;
  const base = variant % 2 ? "#3e8948" : "#4a9a3e";
  // trunk
  R(g, 6, 22, 4, 10, PAL.N);
  R(g, 6, 22, 1, 10, PAL.n);
  R(g, 4, 30, 8, 2, PAL.N);
  // canopy
  for (let y = 0; y < 26; y++) {
    const t = (y - 12.5) / 13;
    const half = Math.round(8 * Math.sqrt(Math.max(0, 1 - t * t)));
    if (half <= 0) continue;
    for (let x = 8 - half; x < 8 + half; x++) {
      const nx = (x - 8) / 8;
      let col = base;
      if (nx + t * 0.6 < -0.45) col = PAL.g;
      else if (nx + t * 0.8 > 0.35) col = PAL.D;
      if (rnd() < 0.08) col = PAL.G;
      R(g, x, y, 1, 1, col);
    }
  }
  if (variant % 3 === 0) {
    R(g, 4, 10, 2, 2, PAL.r);
    R(g, 10, 15, 2, 2, PAL.r);
    R(g, 7, 6, 2, 2, PAL.r);
  }
  return outlineCanvas(g.canvas);
}

function drawFlower(g: G, x: number, y: number, col: string) {
  R(g, x + 1, y + 2, 1, 3, PAL.G);
  R(g, x, y + 1, 1, 1, col);
  R(g, x + 2, y + 1, 1, 1, col);
  R(g, x + 1, y, 1, 1, col);
  R(g, x + 1, y + 1, 1, 1, PAL.y);
}

export interface MapData {
  solid: boolean[][];
  frames: HTMLCanvasElement[];
  fore: HTMLCanvasElement;
  buildingArt: Partial<Record<BuildingId, HTMLCanvasElement>>;
}

let cached: MapData | null = null;

export function buildMap(): MapData {
  if (cached) return cached;
  const rnd = mulberry32(2024);
  const W = MW * TS;
  const H = MH * TS;
  const solid: boolean[][] = Array.from({ length: MH }, () => Array<boolean>(MW).fill(false));
  const kind: string[][] = Array.from({ length: MH }, () => Array<string>(MW).fill("grass"));
  const mark = (x: number, y: number, w: number, h: number, k: string) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) kind[j][i] = k;
  };
  const block = (x: number, y: number, w: number, h: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) solid[j][i] = true;
  };

  // roads
  mark(1, 5, 22, 2, "path");
  mark(1, 12, 22, 2, "path");
  mark(11, 5, 2, 17, "path");
  mark(1, 20, 22, 2, "path");
  mark(9, 17, 2, 1, "path");
  mark(16, 19, 1, 1, "path");
  mark(11, 22, 2, 1, "path");
  mark(9, 8, 7, 5, "plaza");

  // pond
  const isWater = (x: number, y: number) =>
    x >= 4 && x <= 19 && y >= 23 && y <= 28 && !((x === 4 || x === 19) && (y === 23 || y === 28));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (isWater(x, y)) { kind[y][x] = "water"; solid[y][x] = true; }
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (kind[y][x] !== "grass") continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isWater(x + dx, y + dy)) kind[y][x] = "sand";
    }
  }

  // buildings & solids
  for (const b of BLDS) {
    if (b.id === "square") block(10, 8, 5, 2);
    else block(b.x, b.y, b.w, b.h);
  }
  for (let x = 0; x < MW; x++) {
    solid[0][x] = true;
    solid[MH - 1][x] = true;
  }
  for (let y = 0; y < MH; y++) {
    solid[y][0] = true;
    solid[y][MW - 1] = true;
  }

  /* ---------- base layer ---------- */
  const base = mk(W, H);
  const g = base.getContext("2d")!;
  for (let ty = 0; ty < MH; ty++) {
    for (let tx = 0; tx < MW; tx++) {
      const k = kind[ty][tx];
      const x = tx * TS;
      const y = ty * TS;
      if (k === "water") continue;
      if (k === "grass") {
        R(g, x, y, TS, TS, (tx + ty) % 2 ? "#5fae3f" : "#63b343");
        for (let i = 0; i < 4; i++) R(g, x + Math.floor(rnd() * 15), y + Math.floor(rnd() * 15), 1, 2, rnd() < 0.5 ? "#4f9a3a" : "#7fcf3a");
      } else if (k === "path") {
        R(g, x, y, TS, TS, "#dcbd80");
        for (let i = 0; i < 5; i++) R(g, x + Math.floor(rnd() * 14), y + Math.floor(rnd() * 14), 2, 1, "#c4a064");
        for (let i = 0; i < 2; i++) R(g, x + Math.floor(rnd() * 14), y + Math.floor(rnd() * 14), 1, 1, "#efd9a0");
        const nb = (dx: number, dy: number) => {
          const nx = tx + dx;
          const ny = ty + dy;
          return nx < 0 || ny < 0 || nx >= MW || ny >= MH ? "grass" : kind[ny][nx];
        };
        if (nb(0, -1) === "grass") R(g, x, y, TS, 2, "#b88f55");
        if (nb(0, 1) === "grass") R(g, x, y + TS - 2, TS, 2, "#b88f55");
        if (nb(-1, 0) === "grass") R(g, x, y, 2, TS, "#b88f55");
        if (nb(1, 0) === "grass") R(g, x + TS - 2, y, 2, TS, "#b88f55");
      } else if (k === "sand") {
        R(g, x, y, TS, TS, "#ecd9a0");
        for (let i = 0; i < 4; i++) R(g, x + Math.floor(rnd() * 14), y + Math.floor(rnd() * 14), 2, 1, "#d6c084");
      } else if (k === "plaza") {
        R(g, x, y, TS, TS, "#c9c1b0");
      }
    }
  }

  // farm (decorative, the real farm is a screen)
  {
    const fx = 1 * TS;
    const fy = 15 * TS;
    const fw = 8 * TS;
    const fh = 5 * TS;
    R(g, fx, fy, fw, fh, "#5fae3f");
    for (let row = 0; row < 3; row++) {
      const ry = fy + 12 + row * 22;
      R(g, fx + 10, ry, fw - 36, 12, "#7d5632");
      R(g, fx + 10, ry, fw - 36, 2, "#946a40");
      for (let cx = fx + 14; cx < fx + fw - 30; cx += 8) {
        if (row === 0) {
          R(g, cx, ry - 3, 2, 8, PAL.y);
          R(g, cx - 1, ry - 4, 4, 3, PAL.Y);
        } else if (row === 1) {
          R(g, cx, ry - 2, 2, 5, PAL.g);
          R(g, cx - 2, ry - 3, 2, 2, PAL.G);
          R(g, cx + 2, ry - 3, 2, 2, PAL.G);
        } else {
          R(g, cx, ry + 2, 4, 4, PAL.o);
          R(g, cx + 1, ry, 2, 3, PAL.g);
        }
      }
    }
    // fence
    for (let x = fx; x < fx + fw; x += 8) {
      for (const yy of [fy, fy + fh - 8]) {
        R(g, x, yy, 3, 9, PAL.h);
        R(g, x, yy, 3, 1, PAL.w);
      }
    }
    R(g, fx, fy + 3, fw, 2, PAL.h);
    R(g, fx, fy + fh - 5, fw, 2, PAL.h);
    for (let y = fy; y < fy + fh; y += 8) {
      R(g, fx, y, 3, 9, PAL.h);
      if (y < fy + 2 * TS + 4 || y > fy + 3 * TS) R(g, fx + fw - 3, y, 3, 9, PAL.h);
    }
    R(g, fx, fy, 2, fh, PAL.h);
    // gate gap on the east side (rows 2..3)
    R(g, fx + fw - 3, fy + 2 * TS - 2, 4, 2 * TS - 2, "#dcbd80");
    // barrel
    R(g, fx + fw - 22, fy + fh - 22, 12, 14, PAL.N);
    R(g, fx + fw - 22, fy + fh - 18, 12, 2, PAL.E);
    R(g, fx + fw - 22, fy + fh - 12, 12, 2, PAL.E);
    R(g, fx + fw - 20, fy + fh - 22, 8, 3, PAL.b);
  }

  // buildings
  const buildingArt: Partial<Record<BuildingId, HTMLCanvasElement>> = {};
  for (const b of BLDS) {
    const art = drawBuilding(b.id);
    if (art) {
      buildingArt[b.id] = art;
      // the pond keeps its water tiles on the map; its art is only shown on its own screen
      if (b.id !== "pond") g.drawImage(art, b.x * TS, b.y * TS);
    }
  }

  // cafe table & chairs
  {
    const tx = 5 * TS + 6;
    const ty = 12 * TS + 3;
    R(g, tx, ty + 6, 12, 2, "rgba(0,0,0,0.2)");
    R(g, tx + 1, ty, 10, 6, PAL.n);
    R(g, tx + 1, ty, 10, 1, "#c98a62");
    R(g, tx + 4, ty - 3, 3, 3, PAL.w);
    R(g, tx + 4, ty - 3, 3, 1, PAL.N);
    R(g, tx + 5, ty + 6, 2, 3, PAL.N);
  }
  // pond sign
  {
    const sx = 10 * TS + 4;
    const sy = 22 * TS - 6;
    R(g, sx + 6, sy + 8, 3, 10, PAL.N);
    R(g, sx, sy, 15, 9, PAL.h);
    R(g, sx, sy, 15, 1, PAL.N);
    R(g, sx, sy + 8, 15, 1, PAL.N);
    R(g, sx + 3, sy + 2, 2, 5, PAL.r);
    R(g, sx + 6, sy + 2, 2, 5, PAL.r);
    R(g, sx + 9, sy + 2, 2, 5, PAL.r);
  }

  // flowers
  let flowers = 0;
  const FC = [PAL.m, PAL.w, PAL.y, PAL.r, PAL.c, PAL.p];
  while (flowers < 70) {
    const tx = 1 + Math.floor(rnd() * (MW - 2));
    const ty = 1 + Math.floor(rnd() * (MH - 2));
    if (kind[ty][tx] !== "grass" || solid[ty][tx]) continue;
    drawFlower(g, tx * TS + 2 + Math.floor(rnd() * 8), ty * TS + 2 + Math.floor(rnd() * 8), FC[Math.floor(rnd() * FC.length)]);
    flowers++;
  }
  // flower beds beside home door
  for (const fx of [14, 18]) for (let i = 0; i < 4; i++) drawFlower(g, fx * TS + 2 + (i % 2) * 6, 19 * TS + 3 + Math.floor(i / 2) * 6, FC[(i + fx) % FC.length]);

  /* ---------- trees ---------- */
  const trees = [treeSprite(0), treeSprite(1), treeSprite(2), treeSprite(3)];
  const fore = mk(W, H);
  const fg = fore.getContext("2d")!;
  const placeTree = (tx: number, ty: number, v: number) => {
    const img = trees[v % trees.length];
    const px = tx * TS - 1;
    const py = ty * TS + TS - (img.height - 1);
    g.save();
    g.beginPath();
    g.rect(px, ty * TS, img.width, TS + 1);
    g.clip();
    g.drawImage(img, px, py);
    g.restore();
    fg.save();
    fg.beginPath();
    fg.rect(px, 0, img.width, ty * TS);
    fg.clip();
    fg.drawImage(img, px, py);
    fg.restore();
  };
  // hedge row on top
  for (let x = 0; x < MW; x++) {
    R(g, x * TS, 0, TS, TS, "#2f7040");
    for (let i = 0; i < 6; i++) R(g, x * TS + Math.floor(rnd() * 14), Math.floor(rnd() * 14), 3, 3, rnd() < 0.5 ? PAL.G : PAL.D);
    R(g, x * TS, TS - 3, TS, 3, PAL.D);
  }
  for (let y = 1; y < MH; y++) {
    placeTree(0, y, y);
    placeTree(MW - 1, y, y + 1);
  }
  for (let x = 1; x < MW - 1; x++) placeTree(x, MH - 1, x);
  const scattered: [number, number][] = [[7, 3], [15, 3], [7, 9], [16, 9], [20, 16], [22, 17], [21, 24], [2, 24], [1, 27], [22, 27], [7, 22], [8, 21], [15, 21]];
  scattered.forEach(([tx, ty], i) => {
    if (solid[ty][tx] || kind[ty][tx] !== "grass") return;
    solid[ty][tx] = true;
    placeTree(tx, ty, i);
  });

  // bunting over the square
  {
    const y0 = 8 * TS - 2;
    const x0 = 9 * TS;
    const x1 = 16 * TS;
    for (const px of [x0 + 2, x1 - 3]) {
      R(fg, px, y0 - 6, 2, 22, PAL.N);
    }
    const cols = [PAL.r, PAL.y, PAL.b, PAL.g, PAL.m];
    let i = 0;
    for (let x = x0 + 4; x < x1 - 4; x += 1) {
      const sag = Math.round(Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 5);
      R(fg, x, y0 + sag, 1, 1, PAL.k);
      if ((x - x0) % 8 === 4) {
        R(fg, x - 1, y0 + sag + 1, 4, 3, cols[i % cols.length]);
        R(fg, x, y0 + sag + 4, 2, 1, cols[i % cols.length]);
        i++;
      }
    }
  }

  /* ---------- water frames ---------- */
  const frames: HTMLCanvasElement[] = [];
  for (let f = 0; f < 2; f++) {
    const fr = mk(W, H);
    const fgx = fr.getContext("2d")!;
    fgx.drawImage(base, 0, 0);
    const wr = mulberry32(55);
    for (let ty = 0; ty < MH; ty++) {
      for (let tx = 0; tx < MW; tx++) {
        if (kind[ty][tx] !== "water") continue;
        const x = tx * TS;
        const y = ty * TS;
        R(fgx, x, y, TS, TS, (tx + ty) % 2 ? "#4a90d9" : "#4689d2");
        for (let i = 0; i < 3; i++) {
          const wx = x + Math.floor(wr() * 12) + (f ? 2 : 0);
          const wy = y + Math.floor(wr() * 14);
          R(fgx, wx, wy, 4, 1, "#7fd6e8");
        }
        const wn = (dx: number, dy: number) => !isWater(tx + dx, ty + dy);
        if (wn(0, -1)) R(fgx, x, y, TS, 2, "#2f5aa8");
        if (wn(0, 1)) R(fgx, x, y + TS - 2, TS, 2, "#2f5aa8");
        if (wn(-1, 0)) R(fgx, x, y, 2, TS, "#2f5aa8");
        if (wn(1, 0)) R(fgx, x + TS - 2, y, 2, TS, "#2f5aa8");
      }
    }
    // lily pads & reeds (static)
    for (const [lx, ly] of [[7, 25], [13, 26], [16, 24], [9, 27]]) {
      R(fgx, lx * TS + 3, ly * TS + 5, 8, 5, PAL.G);
      R(fgx, lx * TS + 7, ly * TS + 5, 2, 2, "#2f5aa8");
      R(fgx, lx * TS + 4, ly * TS + 6, 2, 1, PAL.g);
    }
    for (const rx of [5, 18]) {
      R(fgx, rx * TS + 4, 24 * TS + 2, 2, 10, PAL.G);
      R(fgx, rx * TS + 8, 24 * TS + 5, 2, 8, PAL.G);
      R(fgx, rx * TS + 4, 24 * TS, 2, 3, PAL.N);
    }
    frames.push(fr);
  }

  cached = { solid, frames, fore, buildingArt };
  return cached;
}
