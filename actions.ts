// Gameplay actions: economy, farming, shop, mini-game results, festival payout.
// Every action writes through the store (SaveManager) and reports quest progress.

import {
  ANIMALS,
  BUILDING_UNLOCK_COST,
  CROPS,
  DECOR,
  FESTIVAL_ROUNDS,
  FESTIVAL_TIERS,
  GAMES,
  GOODS,
  MAX_PLOTS,
  PLOT_PRICES,
  SKINS,
  WATER_FACTOR,
  type BuildingId,
  type GameId,
} from "./data";
import { getState, mutate } from "./store";
import type { Plot, SaveData } from "./save";
import { t } from "./i18n";
import { toast } from "./toast";
import { sfx } from "./audio";
import { claimableCount, report } from "./quests";

/* ------------------------------ economy ------------------------------ */
function canPay(cost: number): boolean {
  if (getState().coins >= cost) return true;
  sfx("error");
  toast(t("errors.not_enough_coins"), "bad", "coin");
  return false;
}

export function itemName(kind: "crops" | "goods" | "animals" | "decor", id: string): string {
  return t(`items.${kind}.${id}`);
}
export function seedName(id: string): string {
  return t("items.seed_pack", { name: itemName("crops", id) });
}

function purchased(name: string) {
  mutate((d) => {
    d.stats.purchases++;
  });
  report("purchase", 1);
  sfx("purchase");
  toast(t("shop.bought", { name }), "good", "coin");
}

export function buySeed(id: string, qty = 1): boolean {
  const cost = CROPS[id].price * qty;
  if (!canPay(cost)) return false;
  mutate((d) => {
    d.coins -= cost;
    d.inventory.seeds[id] = (d.inventory.seeds[id] ?? 0) + qty;
  });
  purchased(seedName(id));
  return true;
}

export function buyDecor(id: string): boolean {
  const d0 = getState();
  if (d0.decorations.owned.includes(id)) return false;
  const cost = DECOR[id].price;
  if (!canPay(cost)) return false;
  mutate((d) => {
    d.coins -= cost;
    d.decorations.owned.push(id);
    const slot = d.decorations.placed.findIndex((p) => p === null);
    if (slot >= 0) d.decorations.placed[slot] = id;
  });
  purchased(itemName("decor", id));
  return true;
}

export function nextPlotPrice(d: SaveData): number | null {
  if (d.farm.plot_count >= MAX_PLOTS) return null;
  return PLOT_PRICES[d.farm.plot_count];
}

export function buyPlot(): boolean {
  const price = nextPlotPrice(getState());
  if (price === null || !canPay(price)) return false;
  mutate((d) => {
    d.coins -= price;
    d.farm.plot_count++;
  });
  purchased(t("shop.extra_plot"));
  return true;
}

export const MAX_PER_ANIMAL = 3;
export function animalCount(d: SaveData, type: string): number {
  return d.farm.animals.filter((a) => a.type === type).length;
}

export function buyAnimal(type: string): boolean {
  const d0 = getState();
  if (animalCount(d0, type) >= MAX_PER_ANIMAL) return false;
  const cost = ANIMALS[type].price;
  if (!canPay(cost)) return false;
  mutate((d) => {
    d.coins -= cost;
    d.farm.animals.push({ type, last: Date.now() });
  });
  purchased(itemName("animals", type));
  return true;
}

export function unlockBuilding(id: BuildingId): boolean {
  const cost = BUILDING_UNLOCK_COST[id];
  if (cost === undefined) return false;
  if (getState().unlocked_buildings.includes(id)) return false;
  if (!canPay(cost)) return false;
  mutate((d) => {
    d.coins -= cost;
    d.unlocked_buildings.push(id);
  });
  sfx("quest");
  toast(t("map.unlocked", { name: t(`buildings.${id}.name`) }), "good", "star");
  return true;
}

export function sellItem(kind: "crops" | "goods", id: string, qty: number): number {
  const have = getState().inventory[kind][id] ?? 0;
  const n = Math.min(have, qty);
  if (n <= 0) return 0;
  const price = kind === "crops" ? CROPS[id].sell : GOODS[id].sell;
  const coins = n * price;
  mutate((d) => {
    d.inventory[kind][id] -= n;
    d.coins += coins;
    d.stats.sold += n;
  });
  report("sell", n);
  return coins;
}

export function sellAll(): number {
  const d = getState();
  let total = 0;
  for (const id of Object.keys(d.inventory.crops)) total += sellItem("crops", id, 999);
  for (const id of Object.keys(d.inventory.goods)) total += sellItem("goods", id, 999);
  if (total > 0) {
    sfx("coin");
    toast(t("shop.sold", { coins: total }), "good", "coin");
  } else {
    toast(t("shop.nothing_sell"), "info");
  }
  return total;
}

export function sellableCount(d: SaveData): number {
  return (
    Object.values(d.inventory.crops).reduce((a, b) => a + b, 0) +
    Object.values(d.inventory.goods).reduce((a, b) => a + b, 0)
  );
}

/* ------------------------------- farming ------------------------------- */
export function plotStatus(p: Plot | null, now = Date.now()) {
  if (!p) return { empty: true, ready: false, remaining: 0, pct: 0 };
  const total = CROPS[p.crop].grow * 1000 * (p.watered ? WATER_FACTOR : 1);
  const elapsed = now - p.planted_at;
  const ready = elapsed >= total;
  return { empty: false, ready, remaining: Math.max(0, (total - elapsed) / 1000), pct: Math.min(1, elapsed / total) };
}

export function plantSeed(i: number, crop: string): boolean {
  const d0 = getState();
  if ((d0.inventory.seeds[crop] ?? 0) <= 0) {
    sfx("error");
    toast(t("farming.no_seed", { name: itemName("crops", crop) }), "bad");
    return false;
  }
  if (d0.farm.plots[i]) return false;
  mutate((d) => {
    d.farm.plots[i] = { crop, planted_at: Date.now(), watered: false };
    d.inventory.seeds[crop] -= 1;
    d.stats.planted++;
  });
  report("plant", 1);
  sfx("plant");
  return true;
}

export function waterPlot(i: number): boolean {
  const p = getState().farm.plots[i];
  if (!p || p.watered || plotStatus(p).ready) return false;
  mutate((d) => {
    d.farm.plots[i]!.watered = true;
  });
  sfx("plant");
  toast(t("farming.water_done"), "info");
  return true;
}

export function harvestPlot(i: number): boolean {
  const p = getState().farm.plots[i];
  if (!p || !plotStatus(p).ready) return false;
  const n = CROPS[p.crop].yield;
  mutate((d) => {
    d.farm.plots[i] = null;
    d.inventory.crops[p.crop] = (d.inventory.crops[p.crop] ?? 0) + n;
    d.stats.harvested += n;
  });
  report("harvest", n);
  sfx("harvest");
  toast(t("farming.harvested", { name: itemName("crops", p.crop), count: n }), "good", CROPS[p.crop].icon);
  return true;
}

export function animalStatus(a: { type: string; last: number }, now = Date.now()) {
  const def = ANIMALS[a.type];
  const interval = def.interval * 1000;
  const stored = Math.min(def.cap, Math.floor((now - a.last) / interval));
  const nextIn = stored >= def.cap ? 0 : (interval - ((now - a.last) % interval)) / 1000;
  return { stored, nextIn, product: def.product };
}

export function collectAnimal(i: number): boolean {
  const a = getState().farm.animals[i];
  if (!a) return false;
  const s = animalStatus(a);
  if (s.stored <= 0) return false;
  mutate((d) => {
    d.inventory.goods[s.product] = (d.inventory.goods[s.product] ?? 0) + s.stored;
    d.farm.animals[i].last = Date.now();
  });
  report("collect", s.stored);
  sfx("harvest");
  toast(t("farming.collected", { name: itemName("goods", s.product), count: s.stored }), "good", GOODS[s.product].icon);
  return true;
}

/* ------------------------------- skins ------------------------------- */
export function skinName(id: string): string {
  return t(`items.skins.${id}`);
}

export function ownsSkin(id: string): boolean {
  return getState().owned_skins.includes(id);
}

export function buySkin(id: string): boolean {
  const d0 = getState();
  if (!SKINS[id] || d0.owned_skins.includes(id)) return false;
  const cost = SKINS[id].price;
  if (cost > 0 && !canPay(cost)) return false;
  mutate((d) => {
    d.coins -= cost;
    d.owned_skins.push(id);
    d.player_skin = id;
  });
  report("purchase", 1);
  sfx("purchase");
  toast(t("shop.bought", { name: skinName(id) }), "good", "star");
  return true;
}

export function equipSkin(id: string): boolean {
  if (!getState().owned_skins.includes(id)) return false;
  mutate((d) => {
    d.player_skin = id;
  });
  sfx("place");
  return true;
}

/* ------------------------------- home ------------------------------- */
export function placeDecor(slot: number, id: string | null): void {
  mutate((d) => {
    if (id) {
      const prev = d.decorations.placed.indexOf(id);
      if (prev >= 0) d.decorations.placed[prev] = null;
    }
    d.decorations.placed[slot] = id;
  });
  sfx("place");
}

export function setPlayerName(name: string): void {
  mutate((d) => {
    d.player_name = name.trim().slice(0, 14);
  });
}

/* --------------------------- mini-game results --------------------------- */
export interface GameResult {
  game: GameId;
  score: number;
  reason: string;
  best_before: number;
  best: number;
  new_record: boolean;
  coins: number;
  festival: boolean;
}

/** Called by the mini-game shell when a run ends. */
export function recordGameResult(game: GameId, score: number, reason: string, festival: boolean): GameResult {
  const def = GAMES[game];
  const before = getState().mini_games[game].personal_best;
  const newRecord = !festival && score > 0 && score > before;
  const coins = festival ? 0 : Math.min(def.maxCoins, Math.floor(score / def.coinDiv));
  mutate((d) => {
    const g = d.mini_games[game];
    g.plays++;
    g.last_score = score;
    if (!festival && score > g.personal_best) g.personal_best = score;
    d.coins += coins;
    d.stats.played++;
  });
  report("play", 1, { game });
  report("score", score, { game });
  return {
    game,
    score,
    reason,
    best_before: before,
    best: Math.max(before, festival ? before : score),
    new_record: newRecord,
    coins,
    festival,
  };
}

export function festivalTier(total: number, rounds = FESTIVAL_ROUNDS) {
  const k = Math.max(1, rounds / FESTIVAL_ROUNDS);
  return FESTIVAL_TIERS.find((x) => total >= x.min * k) ?? FESTIVAL_TIERS[FESTIVAL_TIERS.length - 1];
}

export function finishFestival(total: number, rounds = FESTIVAL_ROUNDS) {
  const tier = festivalTier(total, rounds);
  const before = getState().festival_best_score;
  const newBest = total > before;
  const coins = tier.coins + Math.max(0, rounds - FESTIVAL_ROUNDS) * 5;
  mutate((d) => {
    d.coins += coins;
    d.festival_last_score = total;
    d.festival_runs++;
    if (total > d.festival_best_score) d.festival_best_score = total;
  });
  report("festival_score", total);
  report("festival_run", 1);
  return { tier, newBest, coins, best: Math.max(before, total) };
}

/* ------------------------------- goals ------------------------------- */
export function nextGoal(d: SaveData): { key: string; args?: Record<string, number> } | null {
  const plays = (g: string) => d.mini_games?.[g as GameId]?.plays ?? 0;
  if (!d.stats || d.stats.planted === 0) return { key: "map.goals.plant" };
  if (d.stats.harvested === 0) return { key: "map.goals.harvest" };
  if (plays("blocks") === 0) return { key: "map.goals.blocks" };
  if (plays("maze") === 0) return { key: "map.goals.maze" };
  if (d.festival_runs === 0) return { key: "map.goals.festival" };
  if (!d.unlocked_buildings.includes("cafe")) return { key: "map.goals.cafe", args: { coins: BUILDING_UNLOCK_COST.cafe ?? 90 } };
  if (!d.unlocked_buildings.includes("pond")) return { key: "map.goals.pond", args: { coins: BUILDING_UNLOCK_COST.pond ?? 150 } };
  if (!d.unlocked_buildings.includes("cave")) return { key: "map.goals.cave", args: { coins: BUILDING_UNLOCK_COST.cave ?? 200 } };
  if (claimableCount(d) > 0 || d.daily_quests.some((q) => !q.claimed)) return { key: "map.goals.quests" };
  return null;
}
