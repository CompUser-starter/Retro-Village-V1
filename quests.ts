// QuestManager (web edition).
// - Uses the device's local date only.
// - 3 daily quests (2 mini-game quests + 1 village quest) and 3 weekly quests.
// - Quests are generated from a date-seeded RNG, so they never re-roll during the same day/week.
// - Everything is persisted through the store (SaveManager).
//
// How other code reports progress:
//   report("harvest", 2)                       // farming
//   report("play", 1, { game: "maze" })        // any mini game (done by recordGameResult)
//   report("score", 240, { game: "maze" })     // "max" style quests
//   report("festival_score", 780)              // festival total

import { GAMES, GAME_IDS, type GameId } from "./data";
import { getState, mutate } from "./store";
import type { ItemReward, QuestObj, SaveData } from "./save";
import { questTitle, t } from "./i18n";
import { toast } from "./toast";
import { sfx } from "./audio";

/* ---------------- date helpers (local time) ---------------- */
const pad = (n: number) => n.toString().padStart(2, "0");

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Key of the Monday that starts the current week (local time). */
export function weekKey(d = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - offset);
  return dateKey(x);
}

export function msUntilTomorrow(): number {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
}

export function msUntilNextWeek(): number {
  const n = new Date();
  const offset = (n.getDay() + 6) % 7;
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() - offset + 7).getTime() - n.getTime();
}

/* ---------------- seeded RNG ---------------- */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- quest pool (easy to extend) ---------------- */
interface Tpl {
  key: string;
  title_key: string;
  args: Record<string, string | number>;
  event: string;
  game?: GameId;
  mode: "sum" | "max";
  target: number;
  coin: number;
  item?: ItemReward;
}

function unlockedGames(d: SaveData): GameId[] {
  return GAME_IDS.filter((g) => d.unlocked_buildings.includes(GAMES[g].building));
}

function miniPool(d: SaveData): Tpl[] {
  const out: Tpl[] = [];
  for (const g of unlockedGames(d)) {
    out.push({
      key: `play_${g}`,
      title_key: "quests.pool.play_game",
      args: { game_key: `mini_games.${g}.name`, count: 2 },
      event: "play",
      game: g,
      mode: "sum",
      target: 2,
      coin: 10,
    });
    const target = GAMES[g].scoreQuest;
    out.push({
      key: `score_${g}`,
      title_key: "quests.pool.score_game",
      args: { game_key: `mini_games.${g}.name`, score: target },
      event: "score",
      game: g,
      mode: "max",
      target,
      coin: 16,
      item: { seed: "carrot", count: 2 },
    });
  }
  out.push({
    key: "play_any",
    title_key: "quests.pool.play_any",
    args: { count: 3 },
    event: "play",
    mode: "sum",
    target: 3,
    coin: 12,
  });
  return out;
}

function villagePool(d: SaveData): Tpl[] {
  const out: Tpl[] = [
    { key: "plant", title_key: "quests.pool.plant", args: { count: 3 }, event: "plant", mode: "sum", target: 3, coin: 8 },
    {
      key: "harvest",
      title_key: "quests.pool.harvest",
      args: { count: 4 },
      event: "harvest",
      mode: "sum",
      target: 4,
      coin: 11,
      item: { seed: "wheat", count: 3 },
    },
    { key: "purchase", title_key: "quests.pool.purchase", args: { count: 1 }, event: "purchase", mode: "sum", target: 1, coin: 7 },
    { key: "sell", title_key: "quests.pool.sell", args: { count: 4 }, event: "sell", mode: "sum", target: 4, coin: 9 },
  ];
  if (d.farm.animals.length > 0) {
    out.push({ key: "collect", title_key: "quests.pool.collect", args: { count: 2 }, event: "collect", mode: "sum", target: 2, coin: 11 });
  }
  return out;
}

function weeklyPool(): Tpl[] {
  return [
    { key: "w_play", title_key: "quests.pool.play_any", args: { count: 12 }, event: "play", mode: "sum", target: 12, coin: 40 },
    {
      key: "w_harvest",
      title_key: "quests.pool.harvest",
      args: { count: 16 },
      event: "harvest",
      mode: "sum",
      target: 16,
      coin: 35,
      item: { seed: "pumpkin", count: 3 },
    },
    {
      key: "w_fscore",
      title_key: "quests.pool.festival_score",
      args: { score: 1500 },
      event: "festival_score",
      mode: "sum",
      target: 1500,
      coin: 60,
    },
    { key: "w_frun", title_key: "quests.pool.festival_run", args: { count: 3 }, event: "festival_run", mode: "sum", target: 3, coin: 45 },
    { key: "w_buy", title_key: "quests.pool.purchase", args: { count: 5 }, event: "purchase", mode: "sum", target: 5, coin: 30 },
  ];
}

function toQuest(tpl: Tpl, type: QuestObj["type"], prefix: string, i: number): QuestObj {
  return {
    id: `${prefix}_${i}_${tpl.key}`,
    type,
    title_key: tpl.title_key,
    args: { ...tpl.args },
    event: tpl.event,
    game: tpl.game,
    mode: tpl.mode,
    progress: 0,
    target: tpl.target,
    completed: false,
    claimed: false,
    coin_reward: tpl.coin,
    item_reward: tpl.item ? { ...tpl.item } : null,
  };
}

/** Exactly 3 daily quests: 2 mini-game + 1 village. */
export function generateDaily(d: SaveData, key: string): QuestObj[] {
  const rng = mulberry32(hash("daily:" + key));
  const pool = shuffle(rng, miniPool(d));
  const first = pool[0];
  const second = pool.find((p) => p.key !== first.key && (!p.game || p.game !== first.game)) ?? pool[1];
  const village = shuffle(rng, villagePool(d))[0];
  return [
    toQuest(first, "daily_mini", key, 0),
    toQuest(second, "daily_mini", key, 1),
    toQuest(village, "daily_village", key, 2),
  ];
}

/** 3 weekly quests with bigger goals. */
export function generateWeekly(key: string): QuestObj[] {
  const rng = mulberry32(hash("weekly:" + key));
  return shuffle(rng, weeklyPool())
    .slice(0, 3)
    .map((tpl, i) => toQuest(tpl, "weekly", key, i));
}

/** Call on startup, on focus and periodically. Regenerates only when the day/week key changed. */
export function checkResets(): void {
  const d = getState();
  const today = dateKey();
  const wk = weekKey();
  const needDaily = d.last_daily_reset !== today || d.daily_quests.length !== 3;
  const needWeekly = d.last_weekly_reset !== wk || d.weekly_quests.length < 2;
  if (!needDaily && !needWeekly) return;
  mutate((s) => {
    if (needDaily) {
      s.daily_quests = generateDaily(s, today);
      s.last_daily_reset = today;
    }
    if (needWeekly) {
      s.weekly_quests = generateWeekly(wk);
      s.last_weekly_reset = wk;
    }
  });
}

/** update_progress(event_type, amount, metadata) */
export function report(event: string, amount = 1, meta: { game?: string } = {}): void {
  if (!(amount > 0)) return;
  const done: QuestObj[] = [];
  mutate((d) => {
    for (const q of [...d.daily_quests, ...d.weekly_quests]) {
      if (q.completed || q.event !== event) continue;
      if (q.game && q.game !== meta.game) continue;
      q.progress = q.mode === "max" ? Math.max(q.progress, amount) : q.progress + amount;
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        done.push(q);
      }
    }
  });
  if (done.length) {
    sfx("quest");
    toast(`${t("quests.completed")} ${questTitle(done[0].title_key, done[0].args)}`, "good", "scroll");
  }
}

export function getDailyQuests(): QuestObj[] {
  return getState().daily_quests;
}
export function getWeeklyQuests(): QuestObj[] {
  return getState().weekly_quests;
}

export function claimReward(id: string): boolean {
  let ok = false;
  let coins = 0;
  mutate((d) => {
    const q = [...d.daily_quests, ...d.weekly_quests].find((x) => x.id === id);
    if (q && q.completed && !q.claimed) {
      q.claimed = true;
      d.coins += q.coin_reward;
      coins = q.coin_reward;
      if (q.item_reward) {
        const { seed, count } = q.item_reward;
        d.inventory.seeds[seed] = (d.inventory.seeds[seed] ?? 0) + count;
      }
      ok = true;
    }
  });
  if (ok) {
    sfx("coin");
    toast(t("quests.reward_claimed", { coins }), "good", "coin");
  }
  return ok;
}

export function claimableCount(d: SaveData): number {
  const all = [...(d.daily_quests ?? []), ...(d.weekly_quests ?? [])];
  return all.filter((q) => q && q.completed && !q.claimed).length;
}
