// "Kənd Yolu" (Country Road) – top-down village highway.
// Graphics follow the supplied vehicle sheet: dark asphalt with a dashed centre line,
// grass verges with a dirt shoulder, detailed top-down cars/vans/trucks, roadside
// trees, bushes, fences, rocks and flowers, plus hit sparks and speed lines.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { mk, outlineCanvas } from "../game/sprites";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const ROAD_X = 34;
const ROAD_W = W - ROAD_X * 2;
const LANES = 3;
const LANE_W = ROAD_W / LANES;
const PLAYER_Y = H - 66;

/* ------------------------------------------------------------------ */
/* Vehicles                                                           */
/* ------------------------------------------------------------------ */
type VehicleKind = "car" | "van" | "truck";

interface VehicleLook {
  body: string;
  dark: string;
  light: string;
  kind: VehicleKind;
  roof?: string;
}

const PLAYER_LOOK: VehicleLook = { body: "#2f7d7a", dark: "#1f5a58", light: "#4fa8a2", kind: "car", roof: "#f2e6c4" };

/** Traffic mix taken from the sheet: red + cream + mustard + purple + blue truck + grey van. */
const TRAFFIC_LOOKS: VehicleLook[] = [
  { body: "#c8403f", dark: "#8f2d2d", light: "#e26a66", kind: "car" },
  { body: "#efe4c8", dark: "#c2b492", light: "#fff7e2", kind: "car" },
  { body: "#c99a33", dark: "#8f6a1e", light: "#e8bd5c", kind: "truck" },
  { body: "#8a7ab0", dark: "#5e5288", light: "#ab9ccd", kind: "car" },
  { body: "#3f6fa8", dark: "#2a4a78", light: "#6a9bd0", kind: "truck" },
  { body: "#b9b9bd", dark: "#8a8a90", light: "#dcdce0", kind: "van" },
];

const OUTLINE = "#2b2b33";

function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}

/** Fills a rounded rectangle by rows so the shape stays crisp at any zoom. */
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, col: string) {
  g.fillStyle = col;
  for (let row = 0; row < h; row++) {
    let inset = 0;
    if (row < r) inset = r - Math.round(Math.sqrt(r * r - (r - row - 0.5) * (r - row - 0.5)));
    if (row >= h - r) {
      const d = row - (h - r) + 0.5;
      inset = r - Math.round(Math.sqrt(Math.max(0, r * r - d * d)));
    }
    g.fillRect(x + inset, y + row, w - inset * 2, 1);
  }
}

interface VehicleSprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  /** hitbox, a little smaller than the art */
  hw: number;
  hh: number;
}

const spriteCache = new Map<string, VehicleSprite>();

/** Builds a top-down vehicle: wheels, body, glass, roof, mirrors and lights. */
function makeVehicle(look: VehicleLook, facing: "up" | "down"): VehicleSprite {
  const key = `${look.body}|${look.kind}|${facing}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const isTruck = look.kind === "truck";
  const isVan = look.kind === "van";
  const w = isTruck || isVan ? 32 : 28;
  const h = isTruck ? 56 : isVan ? 50 : 42;
  const c = mk(w, h);
  const g = c.getContext("2d")!;
  const bodyLeft = 3;
  const bodyW = w - 6;
  const glassDark = "#2f3a48";
  const glassMid = "#4d6376";
  const glassLight = "#9dc3d6";

  // --- tyres (drawn under the body) ---
  const tyre = (x: number, y: number) => {
    rect(g, x, y, 4, 9, "#20202a");
    rect(g, x, y, 4, 2, "#3a3a46");
    rect(g, x + 1, y + 3, 2, 5, "#111118");
  };
  const axleFront = isTruck ? 12 : 8;
  const axleRear = h - (isTruck ? 18 : 15);
  tyre(0, axleFront);
  tyre(w - 4, axleFront);
  tyre(0, axleRear);
  tyre(w - 4, axleRear);

  // --- body silhouette ---
  const radius = isTruck || isVan ? 3 : 5;
  roundRect(g, bodyLeft, 1, bodyW, h - 2, radius, look.dark);
  roundRect(g, bodyLeft, 1, bodyW - 1, h - 3, radius, look.body);
  // soft top highlight down the left side, shade on the right
  rect(g, bodyLeft + 1, 3, 2, h - 7, look.light);
  rect(g, w - bodyLeft - 3, 3, 2, h - 7, look.dark);

  if (isTruck) {
    // cab + cargo box
    roundRect(g, bodyLeft, 1, bodyW, 16, 4, look.dark);
    roundRect(g, bodyLeft, 1, bodyW - 1, 15, 4, look.body);
    rect(g, bodyLeft + 1, 4, 2, 9, look.light);
    // windscreen
    rect(g, bodyLeft + 3, 5, bodyW - 7, 6, glassMid);
    rect(g, bodyLeft + 3, 5, bodyW - 7, 2, glassLight);
    // cargo bed with slats
    roundRect(g, bodyLeft, 19, bodyW, h - 23, 3, "#c9b998");
    rect(g, bodyLeft, 19, bodyW, 2, "#e5d7b8");
    for (let y = 23; y < h - 7; y += 5) rect(g, bodyLeft + 2, y, bodyW - 4, 1, "#a8977a");
    rect(g, bodyLeft, h - 6, bodyW, 4, look.dark);
  } else if (isVan) {
    // long roof with a small windscreen close to the front
    roundRect(g, bodyLeft, 1, bodyW, h - 2, 3, look.dark);
    roundRect(g, bodyLeft, 1, bodyW - 1, h - 3, 3, look.body);
    rect(g, bodyLeft + 1, 4, 2, h - 9, look.light);
    rect(g, bodyLeft + 3, 4, bodyW - 7, 5, glassMid);
    rect(g, bodyLeft + 3, 4, bodyW - 7, 2, glassLight);
    rect(g, bodyLeft + 3, h - 9, bodyW - 7, 4, glassMid);
    rect(g, bodyLeft + 3, h - 9, bodyW - 7, 1, glassLight);
    rect(g, w / 2 - 1, 11, 2, h - 22, look.dark);
  } else {
    // bonnet
    rect(g, bodyLeft + 3, 3, bodyW - 6, 6, look.light);
    // windscreen
    rect(g, bodyLeft + 3, 9, bodyW - 6, 6, glassMid);
    rect(g, bodyLeft + 3, 9, bodyW - 6, 2, glassLight);
    rect(g, bodyLeft + 4, 11, bodyW - 8, 1, glassDark);
    // roof (cream or body colour) with side windows
    const roof = look.roof ?? look.light;
    rect(g, bodyLeft + 2, 16, bodyW - 4, 12, roof);
    rect(g, bodyLeft + 2, 16, bodyW - 4, 1, "#fff8e6");
    rect(g, bodyLeft + 2, 26, bodyW - 4, 2, look.dark);
    rect(g, bodyLeft + 1, 18, 2, 8, glassDark);
    rect(g, w - bodyLeft - 3, 18, 2, 8, glassDark);
    // rear window
    rect(g, bodyLeft + 3, 30, bodyW - 6, 5, glassMid);
    rect(g, bodyLeft + 3, 30, bodyW - 6, 1, glassLight);
    // boot
    rect(g, bodyLeft + 3, 36, bodyW - 6, 3, look.light);
  }

  // --- mirrors ---
  const mirrorY = isTruck ? 8 : isVan ? 7 : 15;
  rect(g, bodyLeft - 2, mirrorY, 3, 3, look.dark);
  rect(g, w - bodyLeft - 1, mirrorY, 3, 3, look.dark);

  // --- lights (front = top when facing up, bottom when facing the player) ---
  const frontY = facing === "up" ? 2 : h - 5;
  const backY = facing === "up" ? h - 5 : 2;
  rect(g, bodyLeft + 2, frontY, 4, 3, "#fff4c8");
  rect(g, w - bodyLeft - 6, frontY, 4, 3, "#fff4c8");
  rect(g, bodyLeft + 2, backY, 4, 3, "#d9453b");
  rect(g, w - bodyLeft - 6, backY, 4, 3, "#d9453b");

  const canvas = outlineCanvas(c, OUTLINE);
  const out = { canvas, w: canvas.width, h: canvas.height, hw: w - 8, hh: h - 10 };
  spriteCache.set(key, out);
  return out;
}

/* ------------------------------------------------------------------ */
/* Roadside scenery                                                   */
/* ------------------------------------------------------------------ */
type SceneryKind = "tree" | "bush" | "fence" | "rock" | "flowers";
const sceneryCache = new Map<SceneryKind, HTMLCanvasElement>();

function scenerySprite(kind: SceneryKind): HTMLCanvasElement {
  const hit = sceneryCache.get(kind);
  if (hit) return hit;
  const size: Record<SceneryKind, [number, number]> = {
    tree: [24, 32],
    bush: [18, 16],
    fence: [24, 16],
    rock: [17, 12],
    flowers: [18, 16],
  };
  const [w, h] = size[kind];
  const c = mk(w, h);
  const g = c.getContext("2d")!;
  if (kind === "tree") {
    rect(g, w / 2 - 2, h - 12, 4, 12, "#6b4a2a");
    rect(g, w / 2 - 2, h - 12, 1, 12, "#8a6238");
    for (let y = 0; y < h - 9; y++) {
      const t = (y - (h - 9) / 2) / ((h - 9) / 2);
      const half = Math.round((w / 2 - 1) * Math.sqrt(Math.max(0, 1 - t * t)));
      if (half <= 0) continue;
      g.fillStyle = y < 6 ? "#3f7a3a" : y < (h - 9) / 2 ? "#4f9442" : "#5aa04a";
      g.fillRect(w / 2 - half, y, half * 2, 1);
    }
    rect(g, w / 2 - 6, 4, 5, 3, "#6ab04f");
    rect(g, w / 2 + 1, 10, 4, 3, "#7cc45c");
    rect(g, w / 2 - 9, 2, 3, 2, "#d8a13c");
  } else if (kind === "bush") {
    roundRect(g, 1, 3, w - 2, h - 5, 5, "#3f7a3a");
    roundRect(g, 2, 2, w - 4, h - 6, 5, "#4f9442");
    rect(g, 4, 3, 5, 3, "#7cc45c");
    rect(g, w - 10, 7, 4, 2, "#6ab04f");
  } else if (kind === "fence") {
    rect(g, 0, 4, w, 2, "#a8784a");
    rect(g, 0, 10, w, 2, "#a8784a");
    rect(g, 0, 4, w, 1, "#c99a63");
    for (const x of [1, w - 4]) rect(g, x, 1, 3, h - 2, "#8a5f38");
    rect(g, w / 2 - 1, 1, 3, h - 2, "#8a5f38");
    for (const x of [1, w / 2 - 1, w - 4]) rect(g, x, 1, 1, h - 2, "#b98a54");
  } else if (kind === "rock") {
    roundRect(g, 1, 4, w - 2, h - 5, 4, "#6f6a70");
    rect(g, 2, 4, w - 4, 3, "#9a969e");
    rect(g, 3, 3, 6, 2, "#b9b4b8");
    rect(g, 2, h - 3, w - 4, 2, "#4f4a52");
  } else {
    // flower bush
    roundRect(g, 1, 4, w - 2, h - 5, 4, "#3f7a3a");
    roundRect(g, 2, 3, w - 4, h - 6, 4, "#4f9442");
    const dots: [number, number, string][] = [
      [4, 6, "#e86a8a"],
      [9, 4, "#f6e27a"],
      [13, 8, "#e86a8a"],
      [6, 10, "#ffffff"],
      [11, 11, "#b86fc6"],
    ];
    for (const [x, y, col] of dots) {
      rect(g, x, y, 2, 2, col);
      rect(g, x, y, 1, 1, "#fff6e8");
    }
  }
  const out = outlineCanvas(c, "#2f2419");
  sceneryCache.set(kind, out);
  return out;
}

/* ------------------------------------------------------------------ */
/* Particles                                                          */
/* ------------------------------------------------------------------ */
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: "spark" | "dust" | "smoke";
  col: string;
}

interface Traffic {
  x: number;
  y: number;
  lane: number;
  speed: number;
  look: VehicleLook;
}

interface Fuel {
  x: number;
  y: number;
  got: boolean;
}

interface SceneryItem {
  y: number;
  left: boolean;
  kind: SceneryKind;
}

/** Red jerrycan with a cap, handle and a cream stripe (doubles as the fuel pickup). */
let fuelSprite: HTMLCanvasElement | null = null;
function makeFuelCan(): HTMLCanvasElement {
  if (fuelSprite) return fuelSprite;
  const c = mk(11, 14);
  const g = c.getContext("2d")!;
  roundRect(g, 1, 3, 9, 11, 2, "#8f2d3b");
  roundRect(g, 1, 3, 8, 10, 2, "#d9453b");
  rect(g, 2, 4, 2, 7, "#ef6a5f");
  rect(g, 1, 8, 9, 3, "#f2e6c4");
  rect(g, 1, 8, 9, 1, "#fff8e6");
  // cap + handle
  rect(g, 7, 1, 3, 3, "#4a2d1c");
  rect(g, 2, 1, 5, 2, "#6b4426");
  rect(g, 2, 1, 5, 1, "#8a5a32");
  fuelSprite = outlineCanvas(c, "#2b2b33");
  return fuelSprite;
}

export default function CarRide({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    const laneX = (l: number) => ROAD_X + LANE_W * l + LANE_W / 2;
    const playerSprite = makeVehicle(PLAYER_LOOK, "up");
    const trafficSprites = TRAFFIC_LOOKS.map((l) => ({ look: l, sprite: makeVehicle(l, "down") }));

    const player = { x: laneX(1), lane: 1, tilt: 0 };
    let traffic: Traffic[] = [];
    let fuels: Fuel[] = [];
    let parts: Part[] = [];
    let lives = 3;
    api.setLives(lives);

    let time = 0;
    let scroll = 0; // asphalt texture phase
    let lineScroll = 0; // dashed-line phase
    let spawnT = 0.9;
    let fuelT = 5;
    let invuln = 0;
    let distAcc = 0;
    let flash = 0;
    let msg = "";
    let msgT = 0;
    let dead = false;
    let target: number | null = null;
    let shake = 0;

    const sceneryKinds: SceneryKind[] = ["tree", "bush", "fence", "rock", "flowers"];
    const scenery: SceneryItem[] = Array.from({ length: 16 }, (_, i) => ({
      y: i * 52,
      left: i % 2 === 0,
      kind: sceneryKinds[(i * 3) % sceneryKinds.length],
    }));

    const speed = () => 150 + Math.min(150, api.elapsed.current * 2.1);

    const spawnParts = (x: number, y: number, kind: Part["kind"], n: number, cols: string[]) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = kind === "spark" ? 60 + Math.random() * 110 : 15 + Math.random() * 40;
        const max = 0.35 + Math.random() * 0.3;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v + (kind === "dust" ? 20 : 0),
          life: max,
          max,
          kind,
          col: cols[i % cols.length],
        });
      }
    };

    const hurt = () => {
      if (invuln > 0) return;
      lives--;
      api.setLives(lives);
      flash = 0.3;
      shake = 0.25;
      sfx("hit");
      spawnParts(player.x, PLAYER_Y, "spark", 14, ["#fff6c8", "#fbd54a", "#ef8f3a", "#ffffff"]);
      spawnParts(player.x, PLAYER_Y + 6, "smoke", 5, ["#b9b4a8", "#8d8892"]);
      if (lives <= 0) {
        dead = true;
        api.finish("dead");
        return;
      }
      invuln = 1.8;
    };

    const update = (dt: number) => {
      if (dead) return;
      time += dt;
      if (invuln > 0) invuln -= dt;
      if (flash > 0) flash -= dt;
      if (shake > 0) shake -= dt;
      if (msgT > 0) msgT -= dt;

      const sp = speed();
      scroll = (scroll + sp * dt) % 64;
      lineScroll = (lineScroll + sp * dt) % 36;
      distAcc += sp * dt;
      if (distAcc >= 50) {
        const n = Math.floor(distAcc / 50);
        distAcc -= n * 50;
        api.addScore(n);
      }

      // steering
      if (keys.has("arrowleft") || keys.has("a")) {
        if (player.lane > 0 && target === null) {
          player.lane--;
          target = laneX(player.lane);
        }
      } else if (keys.has("arrowright") || keys.has("d")) {
        if (player.lane < LANES - 1 && target === null) {
          player.lane++;
          target = laneX(player.lane);
        }
      } else if (target !== null && Math.abs(target - player.x) < 1.5) target = null;
      if (target !== null) {
        const dx = target - player.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), 320 * dt);
        player.x += step;
        player.tilt += (Math.max(-1, Math.min(1, step / 6)) - player.tilt) * Math.min(1, dt * 10);
      } else {
        player.tilt += (0 - player.tilt) * Math.min(1, dt * 10);
      }
      player.x = Math.max(ROAD_X + playerSprite.w / 2, Math.min(W - ROAD_X - playerSprite.w / 2, player.x));

      // traffic
      spawnT -= dt;
      if (spawnT <= 0) {
        const lane = Math.floor(Math.random() * LANES);
        const laneBusy = traffic.some((t) => t.lane === lane && t.y < 170);
        const tooCrowded = traffic.filter((t) => t.y < 40).length >= LANES - 1;
        if (!laneBusy && !tooCrowded) {
          const pick = trafficSprites[Math.floor(Math.random() * trafficSprites.length)];
          traffic.push({
            x: laneX(lane),
            y: -pick.sprite.h,
            lane,
            speed: sp * (0.5 + lane * 0.06),
            look: pick.look,
          });
        }
        spawnT = Math.max(0.38, 1.0 - Math.min(1, api.elapsed.current / 60) * 0.6) * (0.75 + Math.random() * 0.45);
      }

      fuelT -= dt;
      if (fuelT <= 0) {
        fuels.push({ x: laneX(Math.floor(Math.random() * LANES)), y: -24, got: false });
        fuelT = 7 + Math.random() * 6;
      }

      for (const tr of traffic) tr.y += (sp - tr.speed) * dt;
      // keep same-lane traffic from overlapping
      for (let l = 0; l < LANES; l++) {
        const laneCars = traffic.filter((c) => c.lane === l).sort((a, b) => a.y - b.y);
        for (let i = 1; i < laneCars.length; i++) {
          const front = laneCars[i - 1];
          const back = laneCars[i];
          const gap = 54;
          if (back.y - front.y < gap) back.y = front.y + gap;
        }
      }
      for (const f of fuels) f.y += sp * dt;

      // collisions (hitboxes are tighter than the art)
      for (const tr of traffic) {
        if (invuln > 0) break;
        if (Math.abs(tr.x - player.x) < 20 && Math.abs(tr.y - PLAYER_Y) < 34) {
          hurt();
          tr.y = H + 200;
        }
      }
      for (const f of fuels) {
        if (f.got) continue;
        if (Math.abs(f.x - player.x) < 20 && Math.abs(f.y - PLAYER_Y) < 26) {
          f.got = true;
          api.addScore(40);
          sfx("coin");
          msg = "+40";
          msgT = 0.7;
          if (lives < 3 && Math.random() < 0.4) {
            lives++;
            api.setLives(lives);
          }
        }
      }

      traffic = traffic.filter((t) => t.y < H + 90);
      fuels = fuels.filter((f) => !f.got && f.y < H + 24);

      for (const s of scenery) {
        s.y += sp * dt;
        if (s.y > H + 40) {
          s.y -= 16 * 52;
          s.kind = sceneryKinds[Math.floor(Math.random() * sceneryKinds.length)];
        }
      }

      // speed lines / exhaust while driving fast
      if (Math.random() < dt * 18) {
        const x = ROAD_X - 8 - Math.random() * 14 + (Math.random() < 0.5 ? 0 : ROAD_W + 16 + Math.random() * 14);
        spawnParts(x, H - Math.random() * 60, "dust", 1, ["#e8dfc8"]);
      }
      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.kind === "spark" ? 90 * dt : p.kind === "smoke" ? -30 * dt : 40 * dt;
        p.life -= dt;
      }
      parts = parts.filter((p) => p.life > 0);
    };

    /** Road with dashed centre line, edge lines, grassy verges and a dirt shoulder. */
    const drawRoad = () => {
      // grass verges with tufts and small flowers
      rect(ctx, 0, 0, ROAD_X, H, "#6fae4a");
      rect(ctx, W - ROAD_X, 0, ROAD_X, H, "#6fae4a");
      for (let y = -((scroll * 0.6) % 32); y < H; y += 32) {
        rect(ctx, 0, y, ROAD_X, 10, "#639f42");
        rect(ctx, W - ROAD_X, y + 16, ROAD_X, 10, "#639f42");
      }
      for (let y = -((scroll * 0.8) % 26); y < H; y += 26) {
        rect(ctx, 6 + ((y * 3) % 12), y + 4, 2, 5, "#578f3b");
        rect(ctx, 16 + ((y * 5) % 10), y + 12, 2, 4, "#7bbf55");
        rect(ctx, W - 12 - ((y * 4) % 11), y + 8, 2, 5, "#578f3b");
        rect(ctx, W - 22 - ((y * 7) % 9), y + 18, 2, 4, "#7bbf55");
        // little flowers
        if ((y | 0) % 78 < 26) {
          rect(ctx, 10, y + 20, 2, 2, "#f5e08a");
          rect(ctx, W - 17, y + 2, 2, 2, "#efe0f0");
        }
      }
      // dirt shoulder next to the asphalt
      rect(ctx, ROAD_X - 7, 0, 7, H, "#8a6b3f");
      rect(ctx, W - ROAD_X, 0, 7, H, "#8a6b3f");
      for (let y = -((scroll * 0.8) % 18); y < H; y += 18) {
        rect(ctx, ROAD_X - 6, y, 2, 2, "#a8875a");
        rect(ctx, W - ROAD_X + 3, y + 7, 2, 2, "#6f5430");
      }
      // asphalt
      rect(ctx, ROAD_X, 0, ROAD_W, H, "#4b4f5b");
      rect(ctx, ROAD_X, 0, 2, H, "#3c404a");
      rect(ctx, W - ROAD_X - 2, 0, 2, H, "#3c404a");
      for (let y = -((scroll * 0.7) % 24); y < H; y += 24) {
        ctx.fillStyle = "#545968";
        ctx.fillRect(ROAD_X + 4 + ((y * 7) % 9), y, 5, 2);
        ctx.fillRect(W - ROAD_X - 16 - ((y * 5) % 11), y + 11, 4, 2);
      }
      // darker repair patches and hairline cracks
      for (let y = -((scroll * 0.45) % 150); y < H; y += 150) {
        rect(ctx, ROAD_X + 18, y + 20, 26, 12, "#464a55");
        rect(ctx, ROAD_X + 18, y + 20, 26, 1, "#3d414b");
        rect(ctx, W - ROAD_X - 44, y + 88, 20, 9, "#464a55");
        rect(ctx, W - ROAD_X - 30, y + 42, 1, 16, "#3f434d");
        rect(ctx, ROAD_X + 52, y + 120, 1, 12, "#3f434d");
      }
      // solid edge lines
      rect(ctx, ROAD_X + 4, 0, 3, H, "#d9d6a8");
      rect(ctx, W - ROAD_X - 7, 0, 3, H, "#d9d6a8");
      // dashed lane dividers
      for (let l = 1; l < LANES; l++) {
        const x = Math.round(ROAD_X + LANE_W * l) - 2;
        for (let y = -lineScroll; y < H; y += 36) {
          rect(ctx, x, y, 4, 18, "#ece7c0");
          rect(ctx, x, y, 4, 2, "#fffce8");
        }
      }
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
      ctx.save();
      ctx.translate(sx, 0);

      drawRoad();

      // roadside scenery (behind everything on the verge)
      for (const s of scenery) {
        const spr = scenerySprite(s.kind);
        const x = s.left ? Math.round(ROAD_X - 8 - spr.width + 4) : Math.round(W - ROAD_X + 8 - 4);
        const y = Math.round(s.y);
        if (y < -spr.height || y > H + 8) continue;
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(x + 2, y + spr.height - 3, spr.width - 4, 3);
        ctx.drawImage(spr, x, y);
      }

      // fuel cans
      for (const f of fuels) {
        if (f.got) continue;
        const ic = makeFuelCan();
        const bob = Math.round(Math.sin(time * 6 + f.x) * 2);
        const x = Math.round(f.x);
        const y = Math.round(f.y) + bob;
        // soft amber glow so it is easy to spot on the asphalt
        ctx.fillStyle = "rgba(251,213,74,0.18)";
        ctx.fillRect(x - 14, y - 14, 28, 28);
        ctx.fillStyle = "rgba(251,213,74,0.35)";
        ctx.fillRect(x - 10, y - 10, 20, 20);
        ctx.drawImage(ic, x - Math.round(ic.width / 2), y - Math.round(ic.height / 2));
      }

      // traffic (they drive away from the player, so we see their roofs/fronts)
      for (const tr of traffic) {
        const spr = makeVehicle(tr.look, "down");
        const x = Math.round(tr.x - spr.w / 2);
        const y = Math.round(tr.y - spr.h / 2);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x + 3, y + 5, spr.w, spr.h);
        ctx.drawImage(spr.canvas, x, y);
        // brake lights (rear of the vehicle faces the player) and a windscreen glint
        ctx.fillStyle = "#ff6b5e";
        ctx.fillRect(x + 6, y + spr.h - 7, 4, 2);
        ctx.fillRect(x + spr.w - 10, y + spr.h - 7, 4, 2);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x + 8, y + 8, 5, 2);
      }

      // player car
      const blink = invuln > 0 && Math.floor(time * 14) % 2 === 0;
      if (!blink) {
        const x = Math.round(player.x - playerSprite.w / 2);
        const y = PLAYER_Y - Math.round(playerSprite.h / 2);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(x + 3, y + 6, playerSprite.w, playerSprite.h);
        ctx.save();
        ctx.translate(player.x, PLAYER_Y);
        ctx.rotate(player.tilt * 0.06);
        ctx.drawImage(playerSprite.canvas, -playerSprite.w / 2, -playerSprite.h / 2);
        // rear window and boot glint (the player is seen from behind)
        ctx.fillStyle = "#bcd8e4";
        ctx.fillRect(-7, -2, 14, 3);
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(-6, -1, 5, 1);
        // tail lights
        ctx.fillStyle = "#e04b40";
        ctx.fillRect(-11, 14, 4, 3);
        ctx.fillRect(7, 14, 4, 3);
        // damage feedback: red rim while recovering
        if (invuln > 0.9) {
          ctx.globalAlpha = Math.min(1, (invuln - 0.9) * 2);
          ctx.strokeStyle = "#e0403a";
          ctx.lineWidth = 2;
          ctx.strokeRect(-playerSprite.w / 2 - 1, -playerSprite.h / 2 - 1, playerSprite.w + 2, playerSprite.h + 2);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        // headlight cones
        rect(ctx, x + 3, y - 8, 5, 8, "rgba(255,244,200,0.22)");
        rect(ctx, x + playerSprite.w - 8, y - 8, 5, 8, "rgba(255,244,200,0.22)");
      }

      // particles
      for (const p of parts) {
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = p.kind === "smoke" ? a * 0.5 : a;
        ctx.fillStyle = p.col;
        if (p.kind === "spark") {
          const s = p.life > 0.3 ? 3 : 2;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
        } else {
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      if (flash > 0) {
        ctx.fillStyle = `rgba(217,69,59,${flash * 0.55})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();

      // HUD: hearts + score plaque
      for (let i = 0; i < lives; i++) {
        const hx = 7 + i * 18;
        // outline
        ctx.fillStyle = "#2b2b33";
        ctx.fillRect(hx - 1, 10, 15, 10);
        ctx.fillRect(hx + 1, 7, 11, 13);
        // body
        ctx.fillStyle = "#e0404a";
        ctx.fillRect(hx, 10, 13, 9);
        ctx.fillRect(hx + 2, 8, 9, 11);
        ctx.fillStyle = "#ff8b94";
        ctx.fillRect(hx + 2, 10, 4, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(hx + 2, 10, 2, 2);
      }
      if (msgT > 0) {
        ctx.font = "26px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#2a1a10";
        ctx.fillText(msg, W / 2 + 1, 41);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(msg, W / 2, 40);
        ctx.textAlign = "left";
      }
      ctx.textBaseline = "alphabetic";
    };

    return {
      update,
      draw,
      down: (x) => {
        target = x;
      },
      move: (x) => {
        target = x;
      },
      up: () => {
        target = null;
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
