// Tiny reactive store around SaveData. React components use useSave();
// game logic (canvas loops, managers) uses getState()/mutate().

import { useSyncExternalStore } from "react";
import { clearSave, deepClone, defaultSave, loadGame, saveGame, type SaveData } from "./save";

const loaded = loadGame();
let state: SaveData = loaded.data;
export const saveWasRecovered = loaded.recovered;

const listeners = new Set<() => void>();

export function getState(): SaveData {
  return state;
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Apply a change to a cloned copy, persist, and notify subscribers. */
export function mutate(fn: (draft: SaveData) => void): void {
  const next = deepClone(state);
  fn(next);
  state = next;
  saveGame(state);
  listeners.forEach((l) => l());
}

export function useSave(): SaveData {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function resetSaveForTesting(keepLanguage = true): void {
  const lang = state.selected_language;
  clearSave();
  state = defaultSave();
  if (keepLanguage) state.selected_language = lang;
  saveGame(state);
  listeners.forEach((l) => l());
}
