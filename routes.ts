import type { BuildingId, GameId } from "./data";

export type Route =
  | { name: "menu" }
  | { name: "welcome" }
  | { name: "village"; spawn?: BuildingId }
  | { name: "home" }
  | { name: "farm" }
  | { name: "shop" }
  | { name: "festival" }
  | { name: "building"; id: "arcade" | "school" | "cafe" | "cave" | "pond" }
  | { name: "play"; game: GameId; back: Route };

export type Overlay = "quests" | "settings" | null;

export interface Nav {
  go: (r: Route) => void;
  overlay: (o: Overlay) => void;
}
