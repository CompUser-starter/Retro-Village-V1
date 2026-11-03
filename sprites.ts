// Procedural pixel-art: a ~30 colour palette, ASCII sprite definitions with automatic outlines,
// and a character generator (4 directions x idle + 4 walk frames). All art is original.

import { getState } from "./store";
import { ART } from "./assets";
// and a character generator (4 directions x idle + 4 walk frames). All art is original.

export const PAL: Record<string, string> = {
  k: "#4a2d1c", // warm dark-wood ink: universal outline colour for every sprite and icon
  w: "#f6f1e4",
  h: "#e3d2a4",
  e: "#b9b4a8",
  E: "#6f6a6f",
  g: "#7fcf3a",
  G: "#3e8948",
  D: "#265c42",
  y: "#fbd54a",
  Y: "#e8a317",
  o: "#ef8f3a",
  O: "#c96a1e",
  r: "#d9453b",
  R: "#8f2d3b",
  m: "#f48fb1",
  M: "#b8497a",
  b: "#4a90d9",
  B: "#2f5aa8",
  c: "#7fd6e8",
  t: "#3fb8a8",
  T: "#207a7a",
  n: "#9a6b3f",
  N: "#5e3b26",
  s: "#f2c9a0",
  S: "#c98a62",
  p: "#b86fc6",
  P: "#6b3f8f",
};

export function mk(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function outlineCanvas(src: HTMLCanvasElement, color = PAL.k): HTMLCanvasElement {
  const w = src.width + 2;
  const h = src.height + 2;
  const dst = mk(w, h);
  const g = dst.getContext("2d")!;
  g.drawImage(src, 1, 1);
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const hex = parseInt(color.slice(1), 16);
  const cr = (hex >> 16) & 255;
  const cg = (hex >> 8) & 255;
  const cb = hex & 255;
  const marks: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) marks.push((y * w + x) * 4);
    }
  }
  for (const i of marks) {
    d[i] = cr;
    d[i + 1] = cg;
    d[i + 2] = cb;
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return dst;
}

export function ascii(rows: string[], outline = false, map: Record<string, string> = PAL): HTMLCanvasElement {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = mk(w, h);
  const g = c.getContext("2d")!;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = map[row[x]];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
  return outline ? outlineCanvas(c) : c;
}

/* ------------------------------------------------------------------ */
/* Icons (8x8-ish, auto-outlined)                                      */
/* ------------------------------------------------------------------ */
const SEED = [".wwww.", "wwwwww", "wXXXXw", "wXXXXw", "wwwwww", ".hhhh."];

const ICONS: Record<string, string[]> = {
  coin: ["..yyyy..", ".yyyyYy.", "yywyyyYY", "ywyyyyYY", "ywyyyyYY", "yyyyyYYY", ".yYYYYY.", "..YYYY.."],
  heart: [".rr..rr.", "rrrrrrrr", "rwrrrrrr", "rwrrrrrr", ".rrrrrr.", "..rrrr..", "...rr..."],
  star: ["...yy...", "...yy...", "yyyyyyyy", ".yyyyyy.", "..yyyy..", ".yyyyyy.", ".yy..yy.", "yy....yy"],
  trophy: ["yyyyyyyy", "ywyyyyYy", "ywyyyyYy", ".yyyyYY.", "..yyYY..", "...yY...", "..YYYY..", ".YYYYYY."],
  wheat: ["...yy...", "..yyyy..", "..YyyY..", "...yy...", "..yyyy..", "..YyyY..", "...yy...", "...nn...", "...n...."],
  carrot: ["..g.g...", "...gg...", "..oooo..", "..oOoo..", "...ooO..", "...oOo..", "....o...", "....O..."],
  pumpkin: ["...gn...", "..oooo..", ".oOooOo.", "ooOooOoo", "ooOooOoo", "ooOooOoo", ".oOooOo.", "..OooO.."],
  egg: ["...ww...", "..wwww..", ".wwwwwh.", ".wwwwhh.", ".wwwwhh.", ".wwwhhh.", "..hhhh.."],
  wool: [".ww.ww..", "wwwwwwww", "wwwwwwwe", "wwwwwwee", ".wwwwee.", "..eeee.."],
  plant: ["..g.g...", ".ggGgg..", "..gGg...", ".ggGgg..", "..gG....", ".rrrrrr.", "..rRRr..", "..rRRr.."],
  lamp: ["..yyyy..", ".yywwyy.", ".yywwyy.", "..yyyy..", "...nn...", "...nn...", "..nnnn.."],
  rug: [".rrrrrrrr.", "rwwrrrrwwr", "rwwrrrrwwr", ".rrrrrrrr."],
  picture: ["nnnnnnnn", "nbbbbbbn", "nbbyybbn", "nbgyygbn", "nggggggn", "nnnnnnnn"],
  cat: ["o.o.....", "oooo....", "okoooo..", "ooooooo.", "oooooooo", ".OOOOOO."],
  clock: [".wwwwww.", "wwwwkwww", "wwwwkwww", "wwwwkkww", "wwwwwwww", ".wwwwww."],
  cup: [".wwwww..", ".wwwwwww", ".wwwwwwe", ".wwwwwwe", "..wwww.e", "..eeee.."],
  coffee: ["..e.e...", ".e.e....", ".wwwww..", ".wNNNwww", ".wNNNwwe", "..wwww.e", "..eeee.."],
  milk: ["..bb....", "..ww....", ".wwww...", ".wwww...", ".wbbw...", ".wwww...", ".wwwe..."],
  sugar: ["........", ".ww.....", "wwwwww..", "wwwwwww.", "wwwwwwwe", ".wwwwwee"],
  cake: ["...r....", "..mmm...", ".mmmmmm.", ".wwwwww.", ".mwmwmw.", ".wwwwww.", ".nnnnnn."],
  tea: ["....gg..", "..gggGg.", ".gggGgg.", ".ggGggg.", ".gGggg..", ".n......"],
  shard: ["...y....", "..yyy...", ".yywyy..", "yywwyyY.", ".yywyY..", "..yYY...", "...Y...."],
  gem: [".cccc.", "cwcccb", "ccccbb", ".cbbb.", "..bb.."],
  scroll: [".wwwwww.", ".whhhhw.", ".wnnhhw.", ".whhhhw.", ".whnnhw.", ".wwwwww."],
  shield: ["bbbbbb", "bccccb", "bcccBb", ".bccB.", "..bB.."],
  robot: ["....rr....", "....ee....", ".eeeeeeee.", "eEEEEEEEEe", "eEccEEccEe", "eEccEEccEe", "eEEEEEEEEe", ".eeeeeeee.", ".eE....Ee.", ".EE....EE."],
  crystal: ["..mmmm..", ".mwmmmM.", "mwmmmmmM", "mmmmmmMM", ".mmmmMM.", "..MMMM.."],
  ship: [".....w.....", "....wcw....", "....wcw....", "...wwcww...", ".b.wwbww.b.", ".bbwwwwwbb.", "bbbbwwwbbbb", "bb.bbbbb.bb", "b..bTTTb..b"],
  // sprites
  rock: ["..hhhh....", ".hheeeh...", "hheeeEEh..", "heeeeEEEh.", "heeeEEEEh.", ".eeEEEEEh.", "..eEEEEE..", "...EEEE..."],
  sat: ["bb..eEEe..bb", "bbb.eccE.bbb", "bbbbeEEEebbb", "bbb.eEEE.bbb", "bb..eeEE..bb"],
  bat: ["P.........P.", "PP..pppp..PP", "PPPppwpwpPPP", ".PPppppppPP.", "..P.pppp.P..", ".....pp....."],
  chest: [".nnnnnnnnnn.", "nNNNNNNNNNNn", "nNNNNyyNNNNn", "nnnnnyYnnnnn", "nNNNNNNNNNNn", "nNNNNNNNNNNn", "nnnnnnnnnnnn"],
  chicken: ["....rr....", "...rwwk...", "...wwwoo..", "...wwww...", "..wwwwww..", ".wwwwwwwh.", ".wwwwwwhh.", "..hhhhhh..", "...o..o..."],
  sheep: [".wwwww.....", "wwwwwwwss..", "wwwwwwwsk..", "wwwwwwwss..", "wwwwwwww...", ".wwwwwww...", "..E....E...", "..E....E..."],
  lock: ["..eeee..", ".e....e.", ".e....e.", "yyyyyyyy", "yyyEEyyy", "yyyEEyyy", "yYyyyyYy", "YYYYYYYY"],
  home: ["...rr...", "..rrrr..", ".rrrrrr.", "rrrrrrrr", ".wwwwww.", ".wnnbbw.", ".wnnwww.", ".wwwwww."],
  gear: ["..e..e..", ".eeeeee.", "eeE..Eee", ".eE..Ee.", "eeE..Eee", ".eeeeee.", "..e..e.."],
  sound: ["...w....", "..ww..w.", "wwww.w.w", "wwww.w.w", "..ww..w.", "...w...."],
  arrow: ["...w....", "....w...", "wwwwww..", "....w...", "...w...."],
  // added for the extra mini games and decorations
  snake: ["..GGGG...", ".GggggG..", "GgkgkgG..", "GgggggG..", ".GGGGG...", "....G....", "...GGGG..", "..GggggG.", "...GGGG.."],
  note: ["..ww....", "..ww....", "..ww....", "..ww....", "..ww....", ".www....", "wwww....", ".ww....."],
  cloud: ["..wwww....", ".wwwwwww..", "wwwwwwwwww", "wwwwwwwww.", ".eeeeeee.."],
  fish: ["..bbbbbb..", ".bwbbbbbbc", "bbbbbbbbbc", ".bbbbbbbbc", "..bbbbbb.."],
  boot: ["..nnnn...", "..nnnn...", "..nnnn...", "..nnnnnnn", "..nnnnnnn", ".nnnnnnnn"],
  shelf: ["nnnnnnnn", "nrygbpcn", "nrygbpcn", "nnnnnnnn", "ncgyprbn", "ncgyprbn", "nnnnnnnn", "nnnnnnnn"],
  flower: ["..r.r....", ".rmymr...", "..ryr....", "...g.....", "..ggg....", "...g.....", "..bbb....", "..bbb....", ".bbbbb..."],
  tv: ["..........", ".kkkkkkkk.", ".kccccck.", ".kcwccck.", ".kccccck.", ".kkkkkkkk.", "....kk....", "..kkkkkk.."],
  guitar: ["...nn.....", "..nnnn....", "..nwwn....", "...nn.....", "...nn.....", "..bbbb....", ".bbbbbb...", ".bbbbbb...", "..bbbb...."],
  bird: ["....k....", "...kkk...", "..kkkkk..", ".k.....k.", ".k.yyy.k.", ".k.ywy.k.", ".k.....k.", ".k.....k.", ".kkkkkkk."],
  dog: ["n......n.", "nn....nn.", "nnnnnnnn.", "nknnnnkn.", "nnnnnnnn.", ".nnwwnn...", "..nnnn....", "..n..n....", "..n..n...."],
  // added for the new mini games
  car: ["..rrrrrr..", ".rrrrrrrr.", ".rcccccr..", "rrccccccrr", "rrrrrrrrrr", "rrrrrrrrrr", "kkrrrrrrkk", "kkrrrrrrkk", ".kk....kk."],
  feather: ["......Oo", ".....Ooo", "....Oooo", "...Oooo.", "..Oooo..", ".Oooo...", ".Ooo....", "k.......", ],
  fuel: [".kk...", "kkkkkk", "kwwwwk", "kwkkwk", "kwwwwk", "kkkkkk"],
  castle: ["c..c...c..c", "c..c...c..c", "c..c...c..c", "cccccccccc", "cnnnnnnnnnc", "cnwwnnwwnc", "cnwwnnwwnc", "cnnnnnnnnnc", "cccccccccc"],
  apple: ["..gg....", ".gggg...", "..gg....", "..rrrr..", ".rrrrrrr", "rrrrrrrr", "rrrrrrrr", ".rrrrrrr", "..rrrr.."],
  crow: ["k......k.", "kk....kk.", "kkkkkkkk.", "k.kkkk.k.", "k.kyky.k.", "kkkkkkkk.", ".kkkkkk..", "..k..k...", "..k..k..."],
  caterpillar: [".gg..gg..gg.", "ggggggggggg", "gkggggggggg", "ggggggggggg", ".gg..gg..gg.", "..g..g..g.."],
  thorn: ["...G....", "..GGG...", "..GGG...", ".GGGGG..", "GGGGGGG.", ".NNNNN..", "..NNN..."],
  berry: ["...gg....", "..gggg...", ".rrrrrr..", ".rwrkrr..", ".rrrrrr..", "..rrrr..."],
};

const iconCache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

export function iconCanvas(name: string): HTMLCanvasElement {
  let c = iconCache.get(name);
  if (!c) {
    const rows = ICONS[name] ?? ICONS.star;
    c = ascii(rows, true);
    iconCache.set(name, c);
  }
  return c;
}

/** Native-size data URL (render with image-rendering: pixelated and CSS scaling). */
export function iconUrl(name: string): string {
  let u = urlCache.get(name);
  if (!u) {
    if (name.startsWith("seed:")) {
      const crop = name.slice(5);
      const color = crop === "wheat" ? "y" : crop === "carrot" ? "o" : "O";
      u = ascii(SEED.map((r) => r.replace(/X/g, color)), true).toDataURL();
    } else u = iconCanvas(name).toDataURL();
    urlCache.set(name, u);
  }
  return u;
}

export function iconSize(name: string): [number, number] {
  if (name.startsWith("seed:")) return [SEED[0].length + 2, SEED.length + 2];
  const c = iconCanvas(name);
  return [c.width, c.height];
}

const recolorCache = new Map<string, HTMLCanvasElement>();
/** Recolored sprite, e.g. spriteWith("robot","c","y") swaps cyan for yellow. */
export function spriteWith(name: string, from: string, to: string): HTMLCanvasElement {
  const key = `${name}|${from}|${to}`;
  let c = recolorCache.get(key);
  if (!c) {
    const rows = (ICONS[name] ?? ICONS.star).map((r) => r.replace(new RegExp(from, "g"), to));
    c = ascii(rows, true);
    recolorCache.set(key, c);
  }
  return c;
}

/* ------------------------------------------------------------------ */
/* Character generator                                                 */
/* ------------------------------------------------------------------ */
export type Dir = "down" | "up" | "left" | "right";

export interface Look {
  hair: string;
  hairStyle: "short" | "long" | "bun" | "bald";
  skin: string;
  shirt: string;
  shirtDark: string;
  pants: string;
  boots: string;
  glasses?: boolean;
  apron?: string;
  vest?: string;
  bag?: boolean;
  hat?: string;
  hatBand?: string;
  dress?: string;
  dressDark?: string;
  prop?: "stick" | "notebook" | "tray" | "basket" | "pouch";
}

export const LOOKS: Record<string, Look> = {
  player: { hair: "#2b2438", hairStyle: "short", skin: PAL.s, shirt: PAL.t, shirtDark: PAL.T, pants: PAL.n, boots: PAL.N, bag: true },
  teacher: { hair: PAL.E, hairStyle: "bun", skin: PAL.s, shirt: PAL.p, shirtDark: PAL.P, pants: "#3a3670", boots: PAL.k, glasses: true, prop: "notebook" },
  cafe: { hair: PAL.O, hairStyle: "long", skin: PAL.S, shirt: PAL.w, shirtDark: PAL.e, pants: "#3a3670", boots: PAL.N, apron: PAL.r, prop: "tray" },
  elder: { hair: PAL.w, hairStyle: "bald", skin: PAL.S, shirt: PAL.n, shirtDark: PAL.N, pants: PAL.E, boots: PAL.N, prop: "stick" },
  shepherd: { hair: PAL.N, hairStyle: "short", skin: PAL.s, shirt: PAL.G, shirtDark: PAL.D, pants: PAL.N, boots: PAL.k, hat: PAL.Y, hatBand: PAL.r, prop: "basket" },
  shopkeeper: { hair: "#2b2438", hairStyle: "short", skin: PAL.S, shirt: PAL.w, shirtDark: PAL.e, pants: PAL.N, boots: PAL.k, vest: PAL.B, prop: "pouch" },
  // ---- player skins (boy / girl / neutral) ----
  hero: { hair: "#2b2438", hairStyle: "short", skin: PAL.s, shirt: PAL.r, shirtDark: PAL.R, pants: "#3a3670", boots: PAL.k, bag: true },
  ranger: { hair: PAL.N, hairStyle: "short", skin: PAL.s, shirt: PAL.n, shirtDark: PAL.N, pants: PAL.E, boots: PAL.N, vest: PAL.G, hat: PAL.n, hatBand: PAL.y, bag: true },
  astro: { hair: "#d8d4e8", hairStyle: "short", skin: PAL.s, shirt: PAL.w, shirtDark: PAL.e, pants: PAL.e, boots: PAL.c, glasses: true, hat: PAL.e, hatBand: PAL.c },
  gardener: { hair: PAL.O, hairStyle: "long", skin: PAL.s, shirt: PAL.g, shirtDark: PAL.G, pants: "#3a3670", boots: PAL.N, dress: PAL.g, dressDark: PAL.G, hat: PAL.y, hatBand: PAL.r, bag: true },
  student: { hair: "#2b2438", hairStyle: "bun", skin: PAL.S, shirt: PAL.p, shirtDark: PAL.P, pants: "#3a3670", boots: PAL.k, dress: PAL.p, dressDark: PAL.P, glasses: true, prop: "notebook" },
  star: { hair: PAL.y, hairStyle: "long", skin: PAL.s, shirt: PAL.y, shirtDark: PAL.Y, pants: PAL.O, boots: PAL.R, dress: PAL.y, dressDark: PAL.O },
};

/** The look id of the skin the player currently wears. */
export function playerLook(): string {
  const id = getState().player_skin;
  return LOOKS[id] ? id : "player";
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function drawChar(look: Look, dir: "down" | "up" | "left", frame: number): HTMLCanvasElement {
  const c = mk(16, 18);
  const g = c.getContext("2d")!;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y + 2, w, h);
  };
  const walking = frame > 0;
  const idx = frame - 1;
  const l = walking ? [1, 0, -1, 0][idx] : 0; // leg phase
  const hy = walking && l === 0 ? -1 : 0; // head bob
  const K = PAL.k;
  const pantsDark = shade(look.pants, 0.75);
  const prop = (px: number) => {
    switch (look.prop) {
      case "stick":
        r(px, 7, 1, 8, PAL.N);
        break;
      case "notebook":
        r(px - 1, 9, 3, 3, PAL.b);
        r(px, 10, 1, 1, PAL.w);
        break;
      case "tray":
        r(px - 1, 10, 4, 1, PAL.e);
        r(px, 8, 2, 2, PAL.w);
        r(px, 8, 2, 1, PAL.N);
        break;
      case "basket":
        r(px - 1, 10, 4, 3, PAL.n);
        r(px - 1, 10, 4, 1, PAL.N);
        r(px, 9, 1, 1, PAL.n);
        r(px + 1, 9, 1, 1, PAL.n);
        break;
      default:
        break;
    }
  };

  if (dir === "left") {
    if (look.dress) {
      // skirt / dress (side view)
      r(6, 8, 5, 3, look.dress);
      r(5, 11, 7, 1, look.dress);
      r(5, 12, 8, 1, look.dress);
      r(4, 13, 9, 1, look.dress);
      r(4, 14, 10, 1, look.dressDark ?? shade(look.dress, 0.7));
      const sw = walking && l !== 0 ? 1 : 0;
      r(6 + sw, 15, 3, 1, look.boots);
      r(9 - sw, 15, 3, 1, look.boots);
    } else {
      // legs (back leg first)
      const dx = walking ? (l === 0 ? 0 : 2) : 1;
      const swap = walking && l === -1;
      const a = 7 - dx;
      const b = 7 + dx;
      const drawLeg = (x: number, col: string) => {
        r(x - 1 + 1, 12, 2, 2, col);
        r(x - 1, 14, 3, 1, look.boots);
      };
      drawLeg(swap ? a : b, pantsDark);
      drawLeg(swap ? b : a, look.pants);
    }
    // back items
    if (look.bag) {
      r(10, 9, 2, 3, PAL.n);
      r(10, 9, 2, 1, PAL.N);
    }
    // torso
    r(6, 8, 5, 4, look.shirt);
    r(6, 11, 5, 1, look.shirtDark);
    if (look.vest) r(7, 8, 3, 4, look.vest);
    if (look.apron) {
      r(6, 9, 3, 3, look.apron);
    }
    if (look.prop === "pouch") {
      r(8, 11, 2, 2, PAL.n);
      r(8, 11, 2, 1, PAL.N);
    }
    // head
    if (look.hairStyle === "bald") {
      r(5, 1 + hy, 5, 7, look.skin);
      r(8, 3 + hy, 2, 3, look.hair);
    } else {
      r(5, 3 + hy, 5, 5, look.skin);
      r(5, 1 + hy, 6, 3, look.hair);
      r(8, 3 + hy, 3, look.hairStyle === "long" ? 6 : 4, look.hair);
      if (look.hairStyle === "bun") r(9, 0 + hy, 2, 1, look.hair);
    }
    r(4, 6 + hy, 1, 1, look.skin);
    if (look.glasses) {
      r(5, 5 + hy, 1, 1, PAL.N);
      r(6, 5 + hy, 1, 1, PAL.c);
    } else r(6, 5 + hy, 1, 1, K);
    if (look.hat) {
      r(3, 1 + hy, 9, 1, look.hat);
      r(5, -1 + hy, 6, 2, look.hat);
      r(5, 0 + hy, 6, 1, look.hatBand ?? PAL.r);
    }
    // front arm
    r(7 + l, 8, 2, 3, look.shirtDark);
    r(7 + l, 11, 2, 1, look.skin);
    prop(5 + l);
  } else {
    const up = dir === "up";
    const ll = l === 1;
    const rl = l === -1;
    if (look.dress) {
      r(5, 8, 6, 3, look.dress);
      r(4, 11, 8, 1, look.dress);
      r(4, 12, 9, 1, look.dress);
      r(3, 13, 10, 1, look.dress);
      r(3, 14, 11, 1, look.dressDark ?? shade(look.dress, 0.7));
      if (walking) {
        r(5, 15, 3, 1, look.boots);
        r(9 + (rl ? 1 : 0), 15, 3, 1, look.boots);
      } else {
        r(5, 15, 3, 1, look.boots);
        r(8, 15, 3, 1, look.boots);
      }
    } else {
      r(5, 12, 3, ll ? 1 : 2, look.pants);
      r(8, 12, 3, rl ? 1 : 2, look.pants);
      r(5, ll ? 13 : 14, 3, 1, look.boots);
      r(8, rl ? 13 : 14, 3, 1, look.boots);
      r(5, 12, 1, 1, pantsDark);
    }
    // torso
    r(5, 8, 6, 4, look.shirt);
    r(5, 11, 6, 1, look.shirtDark);
    // arms
    r(4, 8 + (l > 0 ? 1 : 0), 1, 3, look.shirt);
    r(4, 11 + (l > 0 ? 1 : 0), 1, 1, look.skin);
    r(11, 8 + (l < 0 ? 1 : 0), 1, 3, look.shirt);
    r(11, 11 + (l < 0 ? 1 : 0), 1, 1, look.skin);
    if (look.vest) r(6, 8, 4, 4, look.vest);
    if (!up) {
      if (look.apron) {
        r(6, 9, 4, 3, look.apron);
        r(7, 8, 2, 1, look.apron);
      }
      if (look.bag) {
        r(9, 8, 1, 1, PAL.N);
        r(8, 9, 1, 1, PAL.N);
        r(7, 10, 1, 1, PAL.N);
        r(6, 11, 1, 1, PAL.N);
        r(3, 10, 2, 3, PAL.n);
        r(3, 10, 2, 1, PAL.N);
      }
      if (look.prop === "pouch") {
        r(10, 11, 2, 2, PAL.n);
        r(10, 11, 2, 1, PAL.N);
      }
    } else {
      if (look.apron) r(5, 10, 6, 1, look.apron);
      if (look.bag) {
        r(6, 8, 1, 1, PAL.N);
        r(9, 8, 1, 1, PAL.N);
        r(6, 9, 4, 3, PAL.n);
        r(6, 9, 4, 1, PAL.N);
      }
      if (look.prop === "pouch") {
        r(10, 11, 2, 2, PAL.n);
      }
    }
    // head
    if (up) {
      if (look.hairStyle === "bald") {
        r(5, 1 + hy, 6, 6, look.skin);
        r(4, 3 + hy, 1, 3, look.hair);
        r(11, 3 + hy, 1, 3, look.hair);
        r(5, 4 + hy, 6, 3, look.hair);
      } else {
        r(5, 1 + hy, 6, 7, look.hair);
        r(4, 2 + hy, 1, look.hairStyle === "long" ? 6 : 4, look.hair);
        r(11, 2 + hy, 1, look.hairStyle === "long" ? 6 : 4, look.hair);
        if (look.hairStyle === "bun") r(7, 0 + hy, 2, 1, look.hair);
      }
    } else {
      if (look.hairStyle === "bald") {
        r(5, 2 + hy, 6, 6, look.skin);
        r(4, 3 + hy, 1, 3, look.hair);
        r(11, 3 + hy, 1, 3, look.hair);
      } else {
        r(5, 4 + hy, 6, 4, look.skin);
        r(5, 1 + hy, 6, 3, look.hair);
        r(4, 2 + hy, 1, look.hairStyle === "long" ? 6 : 3, look.hair);
        r(11, 2 + hy, 1, look.hairStyle === "long" ? 6 : 3, look.hair);
        if (look.hairStyle === "bun") r(7, 0 + hy, 2, 1, look.hair);
      }
      if (look.glasses) {
        r(5, 5 + hy, 1, 1, PAL.N);
        r(6, 5 + hy, 1, 1, PAL.c);
        r(7, 5 + hy, 2, 1, PAL.N);
        r(9, 5 + hy, 1, 1, PAL.c);
        r(10, 5 + hy, 1, 1, PAL.N);
      } else {
        r(6, 5 + hy, 1, 1, K);
        r(9, 5 + hy, 1, 1, K);
      }
      r(7, 7 + hy, 2, 1, PAL.S);
    }
    if (look.hat) {
      r(3, 1 + hy, 10, 1, look.hat);
      r(5, -1 + hy, 6, 2, look.hat);
      r(5, 0 + hy, 6, 1, look.hatBand ?? PAL.r);
    }
    prop(12);
  }
  return outlineCanvas(c);
}

const charCache = new Map<string, HTMLCanvasElement>();

/**
 * Character sprite. frame 0 = idle, 1..4 = walk; feet are on the bottom row.
 * The default "player" look uses the painted sprite sheet (≈21×26, or ≈21×18 when
 * `small`); every other look is the procedural 18×20 sprite.
 */
export function charSprite(lookId: string, dir: Dir, frame: number, small = false): HTMLCanvasElement {
  if (lookId === "player" && ART.player) {
    const frames = (small ? ART.player.small : ART.player.big)[dir];
    return frames[Math.max(0, Math.min(frames.length - 1, frame))];
  }
  return proceduralChar(lookId, dir, frame);
}

function proceduralChar(lookId: string, dir: Dir, frame: number): HTMLCanvasElement {
  const key = `${lookId}|${dir}|${frame}`;
  let c = charCache.get(key);
  if (!c) {
    const look = LOOKS[lookId] ?? LOOKS.player;
    if (dir === "right") {
      const left = charSprite(lookId, "left", frame);
      c = mk(left.width, left.height);
      const g = c.getContext("2d")!;
      g.translate(left.width, 0);
      g.scale(-1, 1);
      g.drawImage(left, 0, 0);
    } else {
      c = drawChar(look, dir, frame);
    }
    charCache.set(key, c);
  }
  return c;
}

export const CHAR_W = 18;
export const CHAR_H = 20;
