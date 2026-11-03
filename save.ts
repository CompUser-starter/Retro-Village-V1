// SaveManager (web edition): local JSON save in localStorage.
// - Safe load: missing / corrupted / partial data is merged with defaults, never crashes.
// - Nested path helpers: getValue(data, "mini_games.maze.personal_best", 0)
// - No network, no analytics, no cloud.

import { DECOR_SLOTS, START_BUILDINGS, START_PLOTS, MAX_PLOTS, type ControlMode, type GameId, type GameLength, type Lang } from "./data";

export const SAVE_KEY = "retro_kend_save_v1";
export const SAVE_VERSION = 1;

export interface ItemReward {
  seed: string;
  count: number;
}

export interface QuestObj {
  id: string;
  type: "daily_mini" | "daily_village" | "weekly";
  title_key: string;
  args: Record<string, string | number>;
  event: string;
  game?: string;
  mode: "sum" | "max";
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  coin_reward: number;
  item_reward: ItemReward | null;
}

export interface Plot {
  crop: string;
  planted_at: number;
  watered: boolean;
}

export interface MiniGameSave {
  personal_best: number;
  plays: number;
  last_score: number;
}

export interface SaveData {
  version: number;
  player_name: string;
  player_skin: string;
  owned_skins: string[];
  coins: number;
  unlocked_buildings: string[];
  inventory: {
    seeds: Record<string, number>;
    crops: Record<string, number>;
    goods: Record<string, number>;
  };
  decorations: { owned: string[]; placed: (string | null)[] };
  farm: { plot_count: number; plots: (Plot | null)[]; animals: { type: string; last: number }[] };
  daily_quests: QuestObj[];
  weekly_quests: QuestObj[];
  mini_games: Record<GameId, MiniGameSave>;
  festival_best_score: number;
  festival_last_score: number;
  festival_runs: number;
  last_daily_reset: string;
  last_weekly_reset: string;
  selected_language: Lang;
  control_mode: ControlMode;
  game_length: GameLength;
  audio: { music: boolean; sfx: boolean; volume: number };
  stats: { planted: number; harvested: number; purchases: number; sold: number; played: number };
  onboarded: boolean;
  tip_seen: boolean;
}

export function defaultSave(): SaveData {
  const mg = (): MiniGameSave => ({ personal_best: 0, plays: 0, last_score: 0 });
  return {
    version: SAVE_VERSION,
    player_name: "",
    player_skin: "player",
    owned_skins: ["player"],
    coins: 35,
    unlocked_buildings: [...START_BUILDINGS],
    inventory: { seeds: { wheat: 3, carrot: 0, pumpkin: 0 }, crops: {}, goods: {} },
    decorations: { owned: [], placed: Array.from({ length: DECOR_SLOTS }, () => null) },
    farm: {
      plot_count: START_PLOTS,
      plots: Array.from({ length: MAX_PLOTS }, () => null),
      animals: [],
    },
    daily_quests: [],
    weekly_quests: [],
    mini_games: {
      maze: mg(),
      blocks: mg(),
      shooter: mg(),
      cave: mg(),
      cafe: mg(),
      snake: mg(),
      climb: mg(),
      rhythm: mg(),
      fish: mg(),
      castle: mg(),
      apples: mg(),
      car: mg(),
      bird: mg(),
    },
    festival_best_score: 0,
    festival_last_score: 0,
    festival_runs: 0,
    last_daily_reset: "",
    last_weekly_reset: "",
    selected_language: "en",
    control_mode: "fixed",
    game_length: "medium",
    audio: { music: true, sfx: true, volume: 0.7 },
    stats: { planted: 0, harvested: 0, purchases: 0, sold: 0, played: 0 },
    onboarded: false,
    tip_seen: false,
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** JSON clone – works everywhere (structuredClone is missing on older Android WebViews). */
export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Recursively merge loaded data on top of defaults (type-checked for primitives). */
export function mergeDefaults<T>(def: T, data: unknown): T {
  if (Array.isArray(def)) return (Array.isArray(data) ? data : def) as T;
  if (isObj(def)) {
    const src = isObj(data) ? data : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(def)) {
      out[k] = k in src ? mergeDefaults((def as Record<string, unknown>)[k], src[k]) : deepClone((def as Record<string, unknown>)[k]);
    }
    for (const k of Object.keys(src)) if (!(k in out)) out[k] = src[k];
    return out as T;
  }
  if (typeof data === typeof def) {
    if (typeof def === "number" && !Number.isFinite(data as number)) return def;
    return data as T;
  }
  return def;
}

function sanitize(d: SaveData): SaveData {
  d.coins = Math.max(0, Math.floor(d.coins));
  d.farm.plot_count = Math.min(MAX_PLOTS, Math.max(START_PLOTS, d.farm.plot_count));
  while (d.farm.plots.length < MAX_PLOTS) d.farm.plots.push(null);
  while (d.decorations.placed.length < DECOR_SLOTS) d.decorations.placed.push(null);
  if (!["az", "tr", "en", "ru"].includes(d.selected_language)) d.selected_language = "en";
  if (!["fixed", "free", "buttons"].includes(d.control_mode)) d.control_mode = "fixed";
  if (!["short", "medium", "long", "endless"].includes(d.game_length)) d.game_length = "medium";
  if (!d.owned_skins.includes("player")) d.owned_skins.push("player");
  if (!d.owned_skins.includes(d.player_skin)) d.player_skin = "player";
  for (const b of START_BUILDINGS) if (!d.unlocked_buildings.includes(b)) d.unlocked_buildings.push(b);
  d.audio.volume = Math.min(1, Math.max(0, d.audio.volume));
  return d;
}

export interface LoadResult {
  data: SaveData;
  recovered: boolean; // true if the stored data was unreadable and defaults were used
}

export function loadGame(): LoadResult {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { data: defaultSave(), recovered: false };
    const parsed = JSON.parse(raw);
    if (!isObj(parsed)) return { data: defaultSave(), recovered: true };
    return { data: sanitize(mergeDefaults(defaultSave(), parsed)), recovered: false };
  } catch {
    return { data: defaultSave(), recovered: true };
  }
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: ignore, game keeps working in memory */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/** getValue(data, "mini_games.maze.personal_best", 0) */
export function getValue<T>(data: unknown, path: string, fallback: T): T {
  let cur: unknown = data;
  for (const key of path.split(".")) {
    if (isObj(cur) && key in cur) cur = cur[key];
    else return fallback;
  }
  return (cur === undefined ? fallback : cur) as T;
}

/** setValue(draft, "mini_games.maze.personal_best", 120) – creates missing dictionaries. */
export function setValue(data: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cur = data;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isObj(cur[keys[i]])) cur[keys[i]] = {};
    cur = cur[keys[i]] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}
