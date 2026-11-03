// Static game data (balance tables, ids). Everything here is original.

export type Lang = "az" | "tr" | "en" | "ru";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "az", label: "Azərbaycanca" },
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
];

export type GameId = "maze" | "blocks" | "shooter" | "cave" | "cafe" | "snake" | "climb" | "rhythm" | "fish" | "castle" | "apples" | "car" | "bird";
export const GAME_IDS: GameId[] = ["maze", "blocks", "shooter", "cave", "cafe", "snake", "climb", "rhythm", "fish", "castle", "apples", "car", "bird"];

export type BuildingId =
  | "home"
  | "farm"
  | "square"
  | "arcade"
  | "school"
  | "cafe"
  | "shop"
  | "cave"
  | "pond";

export interface GameDef {
  building: BuildingId;
  duration: number; // seconds in normal mode
  festDuration: number; // seconds in festival mode
  coinDiv: number; // score / coinDiv = coins (higher = fewer coins)
  maxCoins: number;
  icon: string;
  scoreQuest: number; // typical "score X" daily target
}

export const GAMES: Record<GameId, GameDef> = {
  // `icon` = name in the shared UI pack (src/game/uipack.ts): one style for every game card
  maze: { building: "arcade", duration: 90, festDuration: 60, coinDiv: 30, maxCoins: 20, icon: "maze", scoreQuest: 150 },
  snake: { building: "arcade", duration: 90, festDuration: 60, coinDiv: 28, maxCoins: 20, icon: "snake", scoreQuest: 120 },
  shooter: { building: "arcade", duration: 90, festDuration: 60, coinDiv: 48, maxCoins: 22, icon: "shooter", scoreQuest: 300 },
  blocks: { building: "school", duration: 120, festDuration: 75, coinDiv: 26, maxCoins: 22, icon: "blocks", scoreQuest: 150 },
  rhythm: { building: "school", duration: 90, festDuration: 60, coinDiv: 22, maxCoins: 22, icon: "rhythm", scoreQuest: 320 },
  cave: { building: "cave", duration: 90, festDuration: 60, coinDiv: 30, maxCoins: 20, icon: "cave", scoreQuest: 200 },
  climb: { building: "cave", duration: 90, festDuration: 60, coinDiv: 26, maxCoins: 22, icon: "climb", scoreQuest: 220 },
  cafe: { building: "cafe", duration: 90, festDuration: 60, coinDiv: 26, maxCoins: 20, icon: "cafe", scoreQuest: 200 },
  fish: { building: "pond", duration: 90, festDuration: 60, coinDiv: 24, maxCoins: 22, icon: "fish", scoreQuest: 220 },
  castle: { building: "arcade", duration: 120, festDuration: 80, coinDiv: 20, maxCoins: 26, icon: "castle", scoreQuest: 280 },
  car: { building: "arcade", duration: 90, festDuration: 60, coinDiv: 30, maxCoins: 22, icon: "car", scoreQuest: 260 },
  bird: { building: "arcade", duration: 90, festDuration: 60, coinDiv: 6, maxCoins: 22, icon: "bird", scoreQuest: 100 },
  apples: { building: "farm", duration: 90, festDuration: 60, coinDiv: 26, maxCoins: 22, icon: "apples", scoreQuest: 240 },
};

export const START_BUILDINGS: BuildingId[] = ["home", "farm", "square", "arcade", "school", "shop"];
export const BUILDING_UNLOCK_COST: Partial<Record<BuildingId, number>> = { cafe: 90, pond: 150, cave: 200 };

/* ------------------------------ farming ------------------------------ */
export interface CropDef {
  grow: number; // seconds
  price: number;
  sell: number;
  yield: number;
  icon: string;
}
export const CROPS: Record<string, CropDef> = {
  wheat: { grow: 45, price: 8, sell: 6, yield: 2, icon: "wheat" },
  carrot: { grow: 90, price: 14, sell: 10, yield: 2, icon: "carrot" },
  pumpkin: { grow: 180, price: 26, sell: 18, yield: 2, icon: "pumpkin" },
};
export const CROP_IDS = Object.keys(CROPS);
export const WATER_FACTOR = 0.6; // watered crops need 60% of the time

export const GOODS: Record<string, { sell: number; icon: string }> = {
  egg: { sell: 6, icon: "egg" },
  wool: { sell: 14, icon: "wool" },
};

export const ANIMALS: Record<string, { price: number; interval: number; cap: number; product: string }> = {
  chicken: { price: 150, interval: 90, cap: 3, product: "egg" },
  sheep: { price: 320, interval: 180, cap: 3, product: "wool" },
};

/* ------------------------------ decor ------------------------------ */
export const DECOR: Record<string, { price: number }> = {
  plant: { price: 45 },
  clock: { price: 55 },
  picture: { price: 65 },
  flower: { price: 80 },
  lamp: { price: 95 },
  shelf: { price: 120 },
  rug: { price: 150 },
  tv: { price: 180 },
  guitar: { price: 220 },
  bird: { price: 260 },
  cat: { price: 300 },
  dog: { price: 380 },
};
export const DECOR_IDS = Object.keys(DECOR);
export const DECOR_SLOTS = 8;

/* ------------------------------ skins ------------------------------ */
export interface SkinDef {
  gender: "boy" | "girl" | "neutral";
  price: number;
}
/** id === look id in sprites.ts */
export const SKINS: Record<string, SkinDef> = {
  player: { gender: "neutral", price: 0 },
  hero: { gender: "boy", price: 150 },
  ranger: { gender: "boy", price: 240 },
  astro: { gender: "neutral", price: 360 },
  gardener: { gender: "girl", price: 170 },
  student: { gender: "girl", price: 210 },
  star: { gender: "girl", price: 450 },
};
export const SKIN_IDS = Object.keys(SKINS);

/* ------------------------------ village ------------------------------ */
export const MAX_PLOTS = 9;
export const START_PLOTS = 4;
export const PLOT_PRICES = [0, 0, 0, 0, 70, 110, 160, 220, 300];

export const INGREDIENTS = ["cup", "coffee", "milk", "sugar", "cake", "tea"];

export type GameLength = "short" | "medium" | "long" | "endless";
export const GAME_LENGTHS: GameLength[] = ["short", "medium", "long", "endless"];

/**
 * Real seconds for a length choice. "endless" returns a ramp window for
 * difficulty scaling but the run never auto-finishes (it ends on lives/stuck
 * or when the player taps Finish in the pause menu).
 */
export function lengthDuration(game: GameId, length: GameLength): number {
  const base = GAMES[game].duration;
  if (length === "short") return Math.max(30, Math.round(base * 0.5));
  if (length === "long") return Math.round(base * 1.7);
  if (length === "endless") return 120;
  return base;
}

export type ControlMode = "fixed" | "free" | "buttons";
export const CONTROL_MODES: ControlMode[] = ["fixed", "free", "buttons"];

export const FESTIVAL_ROUNDS = 3;
export const FESTIVAL_MAX_ROUNDS = 9;
export const FESTIVAL_TIERS: { min: number; id: "bronze" | "silver" | "gold" | "star"; coins: number }[] = [
  { min: 1000, id: "star", coins: 55 },
  { min: 600, id: "gold", coins: 35 },
  { min: 300, id: "silver", coins: 20 },
  { min: 0, id: "bronze", coins: 8 },
];

export function fmtTime(sec: number): string {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
