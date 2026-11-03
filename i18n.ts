// LocalizationManager (web edition).
// Nested keys ("main_menu.play"), {placeholders}, fallback: current -> English -> key path.

import { useSyncExternalStore } from "react";
import az from "../locales/az.json";
import tr from "../locales/tr.json";
import en from "../locales/en.json";
import ru from "../locales/ru.json";
import { LANGS, type Lang } from "./data";
import { getState, mutate, subscribe } from "./store";

const dictionaries: Record<Lang, unknown> = { az, tr, en, ru };

function lookup(dict: unknown, path: string): string | undefined {
  let cur: unknown = dict;
  for (const part of path.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

export type TArgs = Record<string, string | number>;

/**
 * Last-resort defaults (Azerbaijani). If a key is missing in the current language
 * and in English, these are used, so a raw key path like "settings.control_fixed"
 * never reaches the screen.
 */
const DEFAULTS: Record<string, string> = {
  "settings.control_fixed": "Sabit çubuq",
  "settings.control_free": "Sərbəst çubuq",
  "settings.control_dpad": "Düymələr",
  "settings.controls": "İdarəetmə",
  "settings.controls_hint": "Bu seçim kənd xəritəsindəki gediş-gəlişə təsir edir.",
  "mini_games.modes.short": "Qısa",
  "mini_games.modes.medium": "Orta",
  "mini_games.modes.long": "Uzun",
  "mini_games.modes.endless": "Vaxtsız",
  "mini_games.modes.endless_hint": "Vaxt yoxdur — nə vaxt istəsən, qoyub get.",
  "festival.rounds": "Oyun sayı",
  "festival.random": "Təsadüfi",
  "festival.choose": "Oyunları seç",
  "festival.selected": "Seçilib: {count} oyun",
};

export function getLanguage(): Lang {
  return getState().selected_language;
}

export function getAvailableLanguages() {
  return LANGS;
}

export function setLanguage(code: Lang): void {
  mutate((d) => {
    d.selected_language = code;
  });
  if (typeof document !== "undefined") document.documentElement.lang = code;
}

/** Turns "settings.control_fixed" into "Control fixed" so a raw key never reaches the screen. */
function humanize(path: string): string {
  const last = path.split(".").pop() ?? path;
  const words = last.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** tr_key(key_path, replacements) */
export function t(path: string, args?: TArgs): string {
  const lang = getLanguage();
  let s = lookup(dictionaries[lang], path) ?? lookup(dictionaries.en, path) ?? DEFAULTS[path];
  if (s === undefined) s = humanize(path);
  if (args) {
    s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in args ? String(args[k]) : m));
  }
  return s;
}

/** Hook: re-renders the component when the language changes; returns t. */
export function useT(): typeof t {
  useSyncExternalStore(
    subscribe,
    () => getState().selected_language,
    () => getState().selected_language
  );
  return t;
}

/** Picks one random line like dialogue.elder.l1..l3 */
export function tRandom(prefix: string, count = 3): string {
  const n = 1 + Math.floor(Math.random() * count);
  return t(`${prefix}.l${n}`);
}

/** Translates quest args that carry a *_key entry (e.g. game_key -> game). */
export function questTitle(titleKey: string, args: Record<string, string | number>): string {
  const out: TArgs = {};
  for (const [k, v] of Object.entries(args)) {
    if (k.endsWith("_key")) out[k.slice(0, -4)] = t(String(v));
    else out[k] = v;
  }
  return t(titleKey, out);
}
