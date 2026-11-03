// Shared UI asset pack for the whole collection.
//
// One palette, one pixel scale (16×16 icons, 1px walnut outline added by `ascii(..., true)`),
// one visual language for panels, buttons, bars and icons. Every asset here is drawn with the
// same ASCII technique as sprites.ts so it stays crisp at any zoom.
//
// If painted PNGs with the same names are later dropped into src/assets/ they take priority
// (see assets.ts → ART.icons); this file is the always-available fallback.

import { ascii } from "./sprites";

/** The pack palette: cream / walnut / amber / teal / sage / brick + neutrals. */
export const UI_PAL: Record<string, string> = {
  k: "#4a2d1c", // walnut outline
  N: "#6b4426", // walnut dark
  n: "#a8784a", // walnut light
  w: "#fff4dc", // cream
  h: "#ecd7ad", // cream shade
  e: "#b9b4a8", // grey light
  E: "#6f6a6f", // grey dark
  y: "#fbd54a", // amber light
  Y: "#e8a317", // amber
  o: "#ef8f3a", // orange
  O: "#c96a1e", // orange dark
  t: "#3fb8a8", // teal
  T: "#207a7a", // teal dark
  c: "#7fd6e8", // teal light
  g: "#6abe30", // sage light
  G: "#3e8948", // sage
  r: "#d9453b", // brick
  R: "#8f2d3b", // brick dark
  b: "#4a90d9", // blue
  B: "#2f5aa8", // blue dark
  s: "#f2c9a0", // skin / sand
  S: "#9a6b3f", // wood mid
};

/* ------------------------------------------------------------------ */
/* Mini-game icons (16×16 before outline)                             */
/* ------------------------------------------------------------------ */
const GAME_ICONS: Record<string, string[]> = {
  // cave mouth with two torches and a running silhouette (dark brown interior, not black)
  cave: [
    "....EEEEEEEE....",
    "..EEeeeeeeeeEE..",
    ".EeeNNNNNNNNeeE.",
    ".EeNNNNNNNNNNeE.",
    "EeNNNNNNNNNNNNeE",
    "EyNNNNNkkNNNNNyE",
    "EYNNNNNkkNNNNNYE",
    "EeNNNNkkkkNNNNeE",
    "EeNNNkNkkNkNNNeE",
    "EeNNNNNkkNNNNNeE",
    "EeNNNNkNNkNNNNeE",
    "EeNNNkNNNNkNNNeE",
    "EEEEEEEEEEEEEEEE",
    ".EcccEEEEEEcccE.",
    "..ccc......ccc..",
    "................",
  ],
  // teal crystal cluster with an upward arrow
  climb: [
    "..........yy....",
    ".........yyyy...",
    "........yyyyyy..",
    "..........yy....",
    "....cc....yy....",
    "...cccc...yy....",
    "..ccwccc........",
    "..ccwccc..cc....",
    ".cccccccc.ccc...",
    ".cccTccccccccc..",
    "ccccTcccccTccc..",
    "ccccTccccTTccc..",
    "cTTcTTTcTTTTTc..",
    ".TTTTTTTTTTTT...",
    "..nnnnnnnnnn....",
    "...NNNNNNNN.....",
  ],
  // stone maze with glowing orb
  maze: [
    "TTTTTTTTTTTTTTTT",
    "TwwwwwwwwwwwwwwT",
    "TwTTTTTTTTTTTTwT",
    "TwTwwwwwwwwwwTwT",
    "TwTwTTTTTTTTwTwT",
    "TwTwTwwwwwwTwTwT",
    "TwTwTwTyyTwTwTwT",
    "TwTwTwTyyTwTwTwT",
    "TwTwTwwwwwwTwTwT",
    "TwTwTTTTTTwTwTwT",
    "TwTwwwwwwwwwwTwT",
    "TwTTTTTTTTTTTTwT",
    "TwwwwwwwwwwwwwwT",
    "TTTTTTTTTTTTTTTT",
    "................",
    "................",
  ],
  // planter box with teal crystal flowers
  blocks: [
    "......cc........",
    ".....cccc...cc..",
    ".....cwcc..cccc.",
    "..cc..cc...cwcc.",
    ".cccc.GG....cc..",
    ".cwcc.GG.cc.GG..",
    "..cc.GGG.cccGG..",
    "..GG.GGG..GG.GG.",
    "..GG..GG..GG.GG.",
    ".GGGGGGGGGGGGGG.",
    "NNNNNNNNNNNNNNNN",
    "NnnnnnnnnnnnnnnN",
    "NSSSSSSSSSSSSSSN",
    "NNNNNNNNNNNNNNNN",
    ".NNNNNNNNNNNNNN.",
    "................",
  ],
  // ringed planet with broom
  shooter: [
    "................",
    ".....bbbbbb.....",
    "....bbbbBbbb....",
    "...bbbBbbbbbb...",
    "yy.bbbbbbbbbb.yy",
    ".yyybbbbbbbbyyy.",
    "...yyyyyyyyyy...",
    "...bbbbbbbbbb...",
    "....bbBbbbbb....",
    ".....bbbbbb..nn.",
    "............nn..",
    "...........nn...",
    "..........yyy...",
    ".........yyyy...",
    ".........yyy....",
    "................",
  ],
  // eel in teal water with a hook
  snake: [
    "........k.......",
    "........k.......",
    "........kk......",
    "tttttttttttttttt",
    "tttttttttttttttt",
    "ttttGGGGGGtttttt",
    "tttGGwkGGGGGtttt",
    "ttGGGGGGGGGGGttt",
    "ttGGGtttttGGGttt",
    "tttttttttttGGttt",
    "ttttttttttttGGtt",
    "ttttttttttttGGtt",
    "tttttttttttGGttt",
    "tttttttGGGGGtttt",
    "tttttttttttttttt",
    "tttttttttttttttt",
  ],
  // cup with teal band and steam
  cafe: [
    "......k.k.......",
    ".....k.k........",
    "......k.k.......",
    "................",
    ".wwwwwwwwwww....",
    ".wNNNNNNNNNwww..",
    ".wNNNNNNNNNwhw..",
    ".wwwwwwwwwwwhw..",
    ".wtttttttttwww..",
    ".wwwwwwwwwww....",
    "..wwwwwwwww.....",
    "...wwwwwww......",
    "..hhhhhhhhh.....",
    ".hhhhhhhhhhh....",
    "................",
    "................",
  ],
  // little teal car (side view) on a road: cream roof, teal body, dark wheels, amber headlight
  car: [
    "................",
    "................",
    ".....wwwwww.....",
    "....wwccccww....",
    "...twccccccwt...",
    "..tttttttttttt..",
    ".tttttttttttttty",
    ".ttttttttttttttY",
    ".tttkkttttttkktt",
    "..tkkkkttttkkkk.",
    "...kkkk....kkkk.",
    "EEEEEEEEEEEEEEEE",
    "EEEwwEEEwwEEEwwE",
    "EEEEEEEEEEEEEEEE",
    "................",
    "................",
  ],
  // apple above a basket
  apples: [
    "......k.........",
    ".....Gk.........",
    "....rrrrr.......",
    "...rrwrrrr......",
    "...rrrrrrr......",
    "....rrrrr.......",
    ".....rrr........",
    "................",
    "....nnnnnnnn....",
    "...nSSSSSSSSn...",
    "..nSnSnSnSnSSn..",
    "..nSSnSnSnSnSn..",
    "..nSnSnSnSnSSn..",
    "..nnnnnnnnnnnn..",
    "...NNNNNNNNNN...",
    "................",
  ],
  // stone tower with flag and a crane block
  castle: [
    "....y...........",
    "...yyy..........",
    "...k............",
    "..EkE.EkE.......",
    "..EEEEEEE..N....",
    "..EeEeEeE..N....",
    "..EEEEEEE..NNNN.",
    "..EeEeEeE.....N.",
    "..EEEEEEE.....N.",
    "..EeEkEeE....oo.",
    "..EEEkEEE....oo.",
    "..EeEkEeE..ttyy.",
    "..EEEEEEE..ttyy.",
    "..EEEEEEE..rryy.",
    "..GGGGGGGGGGGGG.",
    "................",
  ],
  // music note over four coloured bars
  rhythm: [
    "..........yy....",
    "..........yyy...",
    "..........y.yy..",
    "..........y..y..",
    "..........y.....",
    ".........yy.....",
    "........yyy.....",
    "........yy......",
    "................",
    "............NN..",
    "....NN......NN..",
    "....NN..NN..NN..",
    "oo..tt..ww..NN..",
    "oo..tt..ww..NN..",
    "oo..tt..ww..NN..",
    "................",
  ],
  // round orange sparrow with a teal wing, flying between two wooden posts
  bird: [
    "................",
    "N..............N",
    "N.....oooo.....N",
    "N....oooooo....N",
    "N...oooowkoo...N",
    "N..ttoooooooYY.N",
    "N.tttoooooooYY.N",
    "N..ttoooooooo..N",
    "N...ooosssso...N",
    "N....ssssss....N",
    "N.....oooo.....N",
    "N......kk......N",
    "N..............N",
    "N..............N",
    "................",
    "................",
  ],
  // fishing (used by the pond game)
  fish: [
    "................",
    "................",
    ".......k........",
    ".......k........",
    ".......kk.......",
    "tttttttttttttttt",
    "tttttttttttttttt",
    "ttttbbbbbbbttttt",
    "tttbbwbbbbbbbttt",
    "ttbbbbbbbbbbbbtt",
    "tttbbbbbbbbbbbtt",
    "ttttbbbbbbbttbtt",
    "tttttttttttttttt",
    "tttttttttttttttt",
    "................",
    "................",
  ],
};

/* ------------------------------------------------------------------ */
/* Small UI glyphs (12×12 before outline) – one scale for all HUD icons */
/* ------------------------------------------------------------------ */
const SMALL_ICONS: Record<string, string[]> = {
  coin: ["...yyyyyy...", "..yyyyyYyy..", ".yyYyyyyyYy.", ".yYyyyyyyyY.", "yyYyyyYyyyYy", "yyYyyyYyyyYy", "yyYyyyYyyyYy", ".yYyyyyyyYY.", ".yyYyyyyyYy.", "..yyYYYYyy..", "...YYYYYY...", "............"],
  gem: ["....cccc....", "...cwcccc...", "..ccwcccccc.", ".ccccccccccc", ".ccccccccccc", "..cccccccct.", "...ccccctt..", "....cccTt...", ".....cTT....", "......T.....", "............", "............"],
  heart: [".rrr....rrr.", "rrwrr..rrrrr", "rrrrrrrrrrrr", "rrrrrrrrrrrr", "rrrrrrrrrrrr", ".rrrrrrrrrr.", "..rrrrrrrr..", "...rrrrrr...", "....rrrr....", ".....rr.....", "............", "............"],
  star: [".....yy.....", "....yyyy....", "....yyyy....", "yyyyyyyyyyyy", ".yyyyyyyyyy.", "..yyyyyyyy..", "...yyyyyy...", "..yyyyyyyy..", ".yyyy..yyyy.", "yyy......yyy", "............", "............"],
  trophy: ["yyyyyyyyyyyy", "ywyyyyyyyyYy", "ywyyyyyyyyYy", ".yyyyyyyyYY.", "..yyyyyyYY..", "...yyyyYY...", "....yyYY....", ".....yY.....", "....YYYY....", "...YYYYYY...", "............", "............"],
  lock: ["....eeee....", "...ee..ee...", "...e....e...", "...e....e...", ".yyyyyyyyyy.", ".yyyyYYyyyy.", ".yyyyYYyyyy.", ".yyyyyYyyyy.", ".yYyyyyyyYy.", ".YYYYYYYYYY.", "............", "............"],
  gear: ["...e....e...", "..eeeeeeee..", ".eeEeeeeEee.", "eeE.eeee.Eee", ".eeeeEEeeee.", ".eeeE..Eeee.", ".eeeE..Eeee.", ".eeeeEEeeee.", "eeE.eeee.Eee", ".eeEeeeeEee.", "..eeeeeeee..", "...e....e..."],
  sound: ["....w.......", "...ww...w...", "..www..w.w..", "wwwww.w..w..", "wwwww.w..w..", "wwwww.w..w..", "..www..w.w..", "...ww...w...", "....w.......", "............", "............", "............"],
  pause: ["wwwwwwwwwwww", "wwwwwwwwwwww", "wwNNwwwwNNww", "wwNNwwwwNNww", "wwNNwwwwNNww", "wwNNwwwwNNww", "wwNNwwwwNNww", "wwNNwwwwNNww", "wwwwwwwwwwww", "wwwwwwwwwwww", "............", "............"],
  play: ["yyyyyyyyyyyy", "yyyyyyyyyyyy", "yyyYyyyyyyyy", "yyyYYYyyyyyy", "yyyYYYYYyyyy", "yyyYYYYYYyyy", "yyyYYYYYyyyy", "yyyYYYyyyyyy", "yyyYyyyyyyyy", "yyyyyyyyyyyy", "............", "............"],
  arrow: ["tttttttttttt", "tttttttttttt", "ttttwttttttt", "tttwwttttttt", "ttwwwwwwwwtt", "twwwwwwwwwtt", "ttwwwwwwwwtt", "tttwwttttttt", "ttttwttttttt", "tttttttttttt", "............", "............"],
  close: ["rrrrrrrrrrrr", "rrrrrrrrrrrr", "rrwwrrrrwwrr", "rrrwwrrwwrrr", "rrrrwwwwrrrr", "rrrrwwwwrrrr", "rrrwwrrwwrrr", "rrwwrrrrwwrr", "rrrrrrrrrrrr", "rrrrrrrrrrrr", "............", "............"],
  home: [".....rr.....", "....rrrr....", "...rrrrrr...", "..rrrrrrrr..", ".rrrrrrrrrr.", ".wwwwwwwwww.", ".wwNNwwwcww.", ".wwNNwwwcww.", ".wwNNwwwwww.", ".wwwwwwwwww.", "............", "............"],
  map: [".GGGGhhhhGGG", ".GGGGhhhhGGG", ".GGgGhhhhGgG", ".GGGGhhhhGGG", ".hhhhGGGGhhh", ".hhhhGGgGhhh", ".hhhhGGGGhhh", ".GGGGhhhhGGG", ".GGgGhhhhGgG", ".GGGGhhhhGGG", "............", "............"],
  bag: ["....nnnn....", "...n....n...", "...n....n...", ".nnnnnnnnnn.", ".nSSSSSSSSn.", ".nSSSSSSSSn.", ".nSSnnnnSSn.", ".nSSSSSSSSn.", ".nSSSSSSSSn.", ".nnnnnnnnnn.", "............", "............"],
  info: ["...wwwwww...", "..wwwwwwww..", ".wwwwNNwwww.", ".wwwwwwwwww.", ".wwwwNNwwww.", ".wwwwNNwwww.", ".wwwwNNwwww.", ".wwwwNNwwww.", "..wwwwwwww..", "...wwwwww...", "............", "............"],
  refresh: ["wwwwwwwwwwww", "wwwwNNNNwwww", "wwwNwwwwNwww", "wwNwwwwwwNww", "wwNwwwwwwwww", "wwNwwwwwNNww", "wwNwwwwwNNww", "wwwNwwwwNNww", "wwwwNNNNNNww", "wwwwwwwwwwww", "............", "............"],
  check: ["GGGGGGGGGGGG", "GGGGGGGGGGGG", "GGGGGGGGwwGG", "GGGGGGGwwwGG", "GGwwGGwwwGGG", "GGwwwwwwGGGG", "GGGwwwwGGGGG", "GGGGwwGGGGGG", "GGGGGGGGGGGG", "GGGGGGGGGGGG", "............", "............"],
  mute: ["....w.......", "...ww.......", "..www.r..r..", "wwwww..rr...", "wwwww..rr...", "wwwww.r..r..", "..www.......", "...ww.......", "....w.......", "............", "............", "............"],
  sign: ["nnnnnnnnnnnn", "nwwwwwwwwwwn", "nwwwwwwwwwwn", "nwwwwwwwwwwn", "nnnnnnnnnnnn", ".....NN.....", ".....NN.....", ".....NN.....", ".....NN.....", "....NNNN....", "............", "............"],
};

const cache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

/** A pack icon as a canvas (outlined). Game icons are 18×18, small icons 14×14. */
export function uiIcon(name: string): HTMLCanvasElement | null {
  const key = name;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = GAME_ICONS[name] ?? SMALL_ICONS[name];
  if (!rows) return null;
  const c = ascii(rows, true, UI_PAL);
  cache.set(key, c);
  return c;
}

/** Same icon as a data URL (for <img> use). */
export function uiIconUrl(name: string): string | null {
  const hit = urlCache.get(name);
  if (hit) return hit;
  const c = uiIcon(name);
  if (!c) return null;
  const u = c.toDataURL();
  urlCache.set(name, u);
  return u;
}

/** Names that the pack provides. */
export const UI_GAME_ICON_NAMES = Object.keys(GAME_ICONS);
export const UI_SMALL_ICON_NAMES = Object.keys(SMALL_ICONS);
