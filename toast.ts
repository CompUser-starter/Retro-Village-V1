import { useSyncExternalStore } from "react";

export interface ToastItem {
  id: number;
  text: string;
  kind: "info" | "good" | "bad";
  icon?: string;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toast(text: string, kind: ToastItem["kind"] = "info", icon?: string): void {
  const id = nextId++;
  items = [...items.slice(-2), { id, text, kind, icon }];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 2600);
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items
  );
}
