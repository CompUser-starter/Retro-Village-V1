// "Sərçə Uçuşu" (Sparrow Flight) – tap to flap, fly through the gaps between logs.
// Visual style follows the supplied asset sheet: teal sky, village skyline, orange
// sparrow with a teal wing, wooden log obstacles in three colours and a grassy ground strip.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { mk, outlineCanvas } from "../game/sprites";
import { sfx } from "../game/audio";
import { t } from "../game/i18n";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const GROUND_H = 44;
const GROUND_Y = H - GROUND_H;
const BIRD_X = 70;
const LOG_W = 30;
const GRAVITY = 900;
const FLAP_V = -255;
const MAX_FALL = 380;

/* ------------------------------------------------------------------ */
/* Sprites (built once)                                               */
/* ------------------------------------------------------------------ */
type BirdFrame = 0 | 1 | 2; // wing up / level / down

function birdSprite(frame: BirdFrame, hurt: boolean): HTMLCanvasElement {
  const c = mk(19, 15);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const body = "#f0a83c";
  const bodyLit = "#f8c560";
  const bodyDark = "#c97f22";
  const belly = "#f7e2a8";
  const wing = "#2f8a84";
  const wingLit = "#4fb5aa";
  // round body
  const rows: [number, number, number][] = [
    [2, 6, 11],
    [3, 4, 13],
    [4, 3, 14],
    [5, 2, 15],
    [6, 2, 15],
    [7, 2, 15],
    [8, 2, 15],
    [9, 2, 15],
    [10, 3, 14],
    [11, 4, 13],
    [12, 6, 11],
  ];
  for (const [y, x0, x1] of rows) R(x0, y, x1 - x0 + 1, 1, body);
  R(6, 2, 6, 1, bodyLit);
  R(4, 3, 4, 2, bodyLit);
  R(3, 10, 2, 2, bodyDark);
  R(4, 11, 3, 1, bodyDark);
  // cream belly
  for (const [y, x0, x1] of [
    [8, 8, 14],
    [9, 7, 14],
    [10, 7, 13],
    [11, 7, 12],
  ] as [number, number, number][])
    R(x0, y, x1 - x0 + 1, 1, belly);
  // tail feathers
  R(0, 6, 2, 2, wing);
  R(0, 8, 2, 1, bodyDark);
  // eye
  R(11, 4, 3, 3, "#ffffff");
  if (hurt) {
    R(11, 4, 1, 1, "#2a1a10");
    R(13, 4, 1, 1, "#2a1a10");
    R(12, 5, 1, 1, "#2a1a10");
    R(11, 6, 1, 1, "#2a1a10");
    R(13, 6, 1, 1, "#2a1a10");
  } else {
    R(12, 5, 2, 2, "#2a1a10");
    R(12, 5, 1, 1, "#ffffff");
  }
  // beak
  R(15, 6, 3, 2, "#e8743c");
  R(15, 8, 2, 1, "#b8501f");
  // wing (three positions)
  if (frame === 0) {
    R(4, 1, 3, 2, wing);
    R(3, 2, 5, 2, wing);
    R(3, 4, 6, 2, wing);
    R(4, 2, 2, 2, wingLit);
  } else if (frame === 1) {
    R(1, 6, 8, 3, wing);
    R(2, 6, 4, 1, wingLit);
  } else {
    R(3, 8, 5, 2, wing);
    R(3, 10, 4, 2, wing);
    R(4, 12, 2, 1, wing);
    R(4, 8, 2, 1, wingLit);
  }
  return outlineCanvas(c, "#3a2414");
}

/** Log colour variants from the sheet: natural wood, teal, red. */
const LOG_COLORS: [string, string, string, string][] = [
  ["#a8743c", "#7d5228", "#c9945a", "#5e3b1d"],
  ["#2f8a84", "#1f625d", "#4fb5aa", "#164844"],
  ["#c8603c", "#94401f", "#e08560", "#6e2b14"],
];

/** A vertical log segment of any height (cut end drawn at the gap side). */
function drawLog(g: CanvasRenderingContext2D, x: number, y: number, h: number, ci: number, endAtBottom: boolean) {
  if (h <= 0) return;
  const [base, dark, lit, edge] = LOG_COLORS[ci];
  const xi = Math.round(x);
  const yi = Math.round(y);
  const hi = Math.round(h);
  // outline
  g.fillStyle = "#3a2414";
  g.fillRect(xi - 1, yi, LOG_W + 2, hi);
  // bark body
  g.fillStyle = base;
  g.fillRect(xi, yi, LOG_W, hi);
  g.fillStyle = lit;
  g.fillRect(xi + 2, yi, 4, hi);
  g.fillStyle = dark;
  g.fillRect(xi + LOG_W - 6, yi, 5, hi);
  g.fillStyle = edge;
  g.fillRect(xi + LOG_W - 1, yi, 1, hi);
  // bark grooves (world-anchored so they do not crawl)
  g.fillStyle = dark;
  for (let yy = yi + ((yi * 7) % 9); yy < yi + hi - 4; yy += 13) {
    g.fillRect(xi + 9, yy, 2, 7);
    g.fillRect(xi + 17, yy + 5, 2, 6);
  }
  // notch near the cut end, like the sheet
  const ny = endAtBottom ? yi + hi - 12 : yi + 6;
  g.fillStyle = edge;
  g.fillRect(xi - 1, ny, 3, 6);
  g.fillRect(xi + LOG_W - 2, ny + 2, 3, 6);
  // cut end band
  const ey = endAtBottom ? yi + hi - 4 : yi;
  g.fillStyle = "#3a2414";
  g.fillRect(xi - 1, ey, LOG_W + 2, 4);
  g.fillStyle = lit;
  g.fillRect(xi + 1, ey + 1, LOG_W - 2, 2);
}

/** Sky, clouds, hills and the village skyline (static, no ground). */
function buildSky(): HTMLCanvasElement {
  const c = mk(W, GROUND_Y);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  // flat teal bands (pixel-art sky, not a smooth gradient)
  const bands = ["#8fd0c6", "#97d4ca", "#a0d8ce", "#a9dcd2", "#b2e0d6"];
  const bh = Math.ceil(GROUND_Y / bands.length);
  bands.forEach((col, i) => R(0, i * bh, W, bh, col));
  // soft clouds
  const cloud = (cx: number, cy: number, s: number) => {
    R(cx, cy, 34 * s, 7, "#eef8f5");
    R(cx + 6, cy - 6, 20 * s, 7, "#eef8f5");
    R(cx + 3, cy - 3, 9 * s, 5, "#ffffff");
    R(cx, cy + 6, 34 * s, 2, "#cbe9e2");
  };
  cloud(140, 70, 1);
  cloud(20, 110, 0.85);
  cloud(170, 150, 0.7);
  // blue-grey hills
  g.fillStyle = "#7d9a9c";
  for (let x = 0; x < W; x += 2) g.fillRect(x, GROUND_Y - 78 + Math.sin(x / 34) * 8, 2, 80);
  g.fillStyle = "#6f9c7a";
  for (let x = 0; x < W; x += 2) g.fillRect(x, GROUND_Y - 58 + Math.sin(x / 22 + 1.5) * 6, 2, 60);
  return c;
}

/** One repeating tile of village houses and trees (scrolls slowly). */
function buildVillage(): HTMLCanvasElement {
  const TW = 240;
  const c = mk(TW, 70);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const base = 70;
  const tree = (x: number, s: number) => {
    R(x + 4 * s, base - 12 * s, 3 * s, 12 * s, "#5e3b26");
    R(x - 3 * s, base - 26 * s, 17 * s, 15 * s, "#3e7a3a");
    R(x, base - 31 * s, 11 * s, 7 * s, "#4f9442");
    R(x - 1 * s, base - 24 * s, 5 * s, 4 * s, "#6ab04f");
  };
  const house = (x: number, w: number, h: number, roof: string, roofDark: string, wall: string, chimney: boolean) => {
    const top = base - h;
    R(x - 1, top, w + 2, h, "#3a2414");
    R(x, top + 1, w, h - 1, wall);
    // roof
    for (let i = 0; i < 9; i++) R(x - 3 + i, top - 9 + i, w + 6 - i * 2, 1, i % 3 === 0 ? roofDark : roof);
    R(x - 3, top - 1, w + 6, 2, roofDark);
    // windows + door
    R(x + 3, top + 5, 5, 5, "#3a2414");
    R(x + 4, top + 6, 3, 3, "#f6d27a");
    R(x + w - 8, top + 5, 5, 5, "#3a2414");
    R(x + w - 7, top + 6, 3, 3, "#f6d27a");
    R(x + Math.floor(w / 2) - 3, base - 9, 6, 9, "#6b4426");
    if (chimney) R(x + w - 7, top - 13, 4, 8, "#8d8577");
  };
  tree(6, 1);
  house(22, 34, 22, "#8d8c94", "#6b6a74", "#d9cdb4", true); // grey slate roof
  house(62, 22, 18, "#c0583a", "#94401f", "#e8d8b8", false);
  tree(92, 0.8);
  house(110, 18, 14, "#c0583a", "#94401f", "#e8d8b8", false);
  house(140, 34, 22, "#d8a548", "#a87a28", "#e8d8b8", true); // straw roof
  tree(186, 1.1);
  house(206, 22, 16, "#c0583a", "#94401f", "#d9cdb4", false);
  return c;
}

/** One tile of the scrolling ground: grass, flowers, rocks and dark soil. */
function buildGround(): HTMLCanvasElement {
  const TW = 96;
  const c = mk(TW, GROUND_H);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  R(0, 0, TW, GROUND_H, "#5e3b1d");
  // grass band
  R(0, 0, TW, 9, "#6abe30");
  R(0, 0, TW, 2, "#8ed45e");
  R(0, 9, TW, 2, "#3e8948");
  for (let x = 0; x < TW; x += 4) R(x, 9 + ((x / 4) % 2), 2, 2, "#3e8948");
  // tufts and flowers on top
  for (const fx of [8, 34, 61, 85]) {
    R(fx, -1 + 1, 1, 3, "#3e8948");
    R(fx - 1, 0, 3, 1, ["#ef8f8f", "#f6e27a", "#ffffff", "#ef8f8f"][(fx / 8) % 4 | 0]);
  }
  // small grey rocks resting on the grass edge
  for (const rx of [22, 72]) {
    R(rx, 3, 9, 5, "#8d8c94");
    R(rx + 1, 2, 6, 2, "#a5a4ae");
    R(rx, 7, 9, 1, "#6b6a74");
  }
  // soil texture and pebbles
  for (let i = 0; i < 40; i++) R((i * 37) % TW, 14 + ((i * 23) % (GROUND_H - 16)), 2, 2, i % 3 ? "#4a2f17" : "#704a28");
  for (const [px, py] of [[14, 24], [50, 32], [80, 20], [38, 38]] as [number, number][]) {
    R(px, py, 4, 3, "#6b6a74");
    R(px, py, 3, 1, "#8d8c94");
  }
  return c;
}

/* ------------------------------------------------------------------ */
/* Game                                                               */
/* ------------------------------------------------------------------ */
interface Log {
  x: number;
  gapY: number; // centre of the gap
  gap: number;
  color: number;
  passed: boolean;
}
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: "puff" | "spark" | "feather" | "dust";
  rot: number;
}

export default function Flap({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    const sky = buildSky();
    const village = buildVillage();
    const ground = buildGround();
    const frames = [birdSprite(0, false), birdSprite(1, false), birdSprite(2, false)];
    const hurtFrame = birdSprite(1, true);

    const bird = { y: H * 0.42, vy: 0, rot: 0 };
    let started = false; // waits for the first tap, like the "Ready" panel
    let state: "fly" | "hit" | "done" = "fly";
    let logs: Log[] = [];
    let parts: Part[] = [];
    let time = 0;
    let scroll = 0; // world distance travelled
    let nextLogAt = 0;
    let passed = 0;
    let flapT = 0;
    let hitT = 0;
    let shake = 0;
    let flash = 0;
    let keyPrev = false;

    const speed = () => 72 + Math.min(48, api.elapsed.current * 0.55);
    const gapSize = () => Math.max(78, 104 - api.elapsed.current * 0.32);

    const spawnLog = () => {
      const gap = gapSize();
      const minY = 46 + gap / 2;
      const maxY = GROUND_Y - 30 - gap / 2;
      const last = logs[logs.length - 1];
      // keep consecutive gaps reachable
      const lo = last ? Math.max(minY, last.gapY - 90) : minY;
      const hi = last ? Math.min(maxY, last.gapY + 90) : maxY;
      logs.push({ x: W + 8, gapY: lo + Math.random() * (hi - lo), gap, color: Math.floor(Math.random() * 3), passed: false });
    };

    const burst = (x: number, y: number, kind: Part["kind"], n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = kind === "puff" ? 18 + Math.random() * 20 : kind === "dust" ? 20 + Math.random() * 40 : 40 + Math.random() * 70;
        const max = kind === "puff" ? 0.35 : kind === "spark" ? 0.5 : 0.7;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * v - (kind === "puff" ? 30 : 0),
          vy: Math.sin(a) * v - (kind === "dust" ? 30 : 0),
          life: max,
          max,
          kind,
          rot: Math.random() * 6,
        });
      }
    };

    const flap = () => {
      if (state !== "fly") return;
      if (!started) started = true;
      bird.vy = FLAP_V;
      flapT = 0.18;
      burst(BIRD_X - 6, bird.y + 3, "puff", 2);
      sfx("jump");
    };

    const crash = () => {
      if (state !== "fly") return;
      state = "hit";
      hitT = 0;
      shake = 0.3;
      flash = 0.35;
      burst(BIRD_X, bird.y, "feather", 8);
      api.setLives(0);
      sfx("hit");
      if (bird.vy < 0) bird.vy = 0;
    };

    api.setLives(1);

    const update = (dt: number) => {
      time += dt;
      if (shake > 0) shake -= dt;
      if (flash > 0) flash -= dt;
      if (flapT > 0) flapT -= dt;

      const k = keys.has(" ") || keys.has("arrowup") || keys.has("w");
      if (k && !keyPrev) flap();
      keyPrev = k;

      const sp = state === "fly" ? speed() : 0;

      if (!started) {
        // hover before the first tap
        bird.y = H * 0.42 + Math.sin(time * 4) * 5;
        bird.rot = 0;
        scroll += 40 * dt;
      } else if (state !== "done") {
        bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY * dt);
        bird.y += bird.vy * dt;
        // nose up when climbing, dive when falling
        const target = state === "hit" ? 1.3 : bird.vy < 0 ? -0.45 : Math.min(1.25, bird.vy / 300);
        bird.rot += (target - bird.rot) * Math.min(1, dt * 9);
        if (bird.y < 8) {
          bird.y = 8;
          bird.vy = 0;
        }
        if (bird.y >= GROUND_Y - 6) {
          bird.y = GROUND_Y - 6;
          if (state === "fly") crash();
          if (state === "hit") {
            state = "done";
            burst(BIRD_X, GROUND_Y - 2, "dust", 7);
            setTimeout(() => api.finish("dead"), 650);
          }
        }
        scroll += sp * dt;
      }

      if (started && state === "fly") {
        // spawn logs every ~150 px of travel
        if (scroll >= nextLogAt) {
          spawnLog();
          nextLogAt = scroll + 140 + Math.random() * 20;
        }
        for (const l of logs) {
          l.x -= sp * dt;
          // collision: bird approximated by a small circle
          const r = 6;
          const nearX = Math.max(l.x, Math.min(BIRD_X, l.x + LOG_W));
          const topH = l.gapY - l.gap / 2;
          const botY = l.gapY + l.gap / 2;
          const inTop = Math.hypot(BIRD_X - nearX, bird.y - Math.min(bird.y, topH)) < r && bird.y - r < topH;
          const inBot = Math.hypot(BIRD_X - nearX, bird.y - Math.max(bird.y, botY)) < r && bird.y + r > botY;
          if ((inTop || inBot) && BIRD_X + r > l.x && BIRD_X - r < l.x + LOG_W) crash();
          if (!l.passed && l.x + LOG_W < BIRD_X - 6) {
            l.passed = true;
            passed++;
            api.addScore(10);
            burst(l.x + LOG_W, l.gapY, "spark", 4);
            sfx("coin");
          }
        }
        logs = logs.filter((l) => l.x > -LOG_W - 4);
      }

      if (state !== "fly") hitT += dt;

      parts.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === "feather" || p.kind === "dust") p.vy += 160 * dt;
        p.rot += dt * 5;
        p.life -= dt;
      });
      parts = parts.filter((p) => p.life > 0);
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * 5) : 0;
      ctx.save();
      ctx.translate(sx, 0);

      // background layers
      ctx.drawImage(sky, 0, 0);
      const vOff = Math.round((scroll * 0.25) % village.width);
      ctx.drawImage(village, -vOff, GROUND_Y - village.height);
      ctx.drawImage(village, -vOff + village.width, GROUND_Y - village.height);

      // logs
      for (const l of logs) {
        const topH = l.gapY - l.gap / 2;
        const botY = l.gapY + l.gap / 2;
        drawLog(ctx, l.x, -4, topH + 4, l.color, true);
        drawLog(ctx, l.x, botY, GROUND_Y - botY, l.color, false);
      }

      // ground strip (scrolls at full speed)
      const gOff = Math.round(scroll % ground.width);
      for (let x = -gOff; x < W; x += ground.width) ctx.drawImage(ground, x, GROUND_Y);

      // bird
      const frame = state !== "fly" ? hurtFrame : !started ? frames[Math.floor(time * 6) % 3 === 0 ? 0 : Math.floor(time * 6) % 3 === 1 ? 1 : 2] : flapT > 0 ? frames[flapT > 0.09 ? 0 : 1] : frames[bird.vy > 120 ? 2 : 1];
      ctx.save();
      ctx.translate(BIRD_X, Math.round(bird.y));
      ctx.rotate(bird.rot);
      ctx.drawImage(frame, -Math.floor(frame.width / 2), -Math.floor(frame.height / 2));
      ctx.restore();
      // dizzy stars after a hit
      if (state !== "fly") {
        for (let i = 0; i < 3; i++) {
          const a = time * 6 + (i * Math.PI * 2) / 3;
          const px = BIRD_X + Math.cos(a) * 9;
          const py = bird.y - 11 + Math.sin(a) * 3;
          ctx.fillStyle = "#fbd54a";
          ctx.fillRect(Math.round(px) - 1, Math.round(py), 3, 1);
          ctx.fillRect(Math.round(px), Math.round(py) - 1, 1, 3);
        }
      }

      // particles
      for (const p of parts) {
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a;
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        if (p.kind === "puff") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - 2, y - 2, 5, 4);
          ctx.fillStyle = "#cbe9e2";
          ctx.fillRect(x - 2, y + 1, 5, 1);
        } else if (p.kind === "spark") {
          ctx.fillStyle = "#fbd54a";
          ctx.fillRect(x - 2, y, 5, 1);
          ctx.fillRect(x, y - 2, 1, 5);
          ctx.fillStyle = "#fff6c8";
          ctx.fillRect(x, y, 1, 1);
        } else if (p.kind === "feather") {
          ctx.fillStyle = Math.floor(p.rot) % 2 ? "#c8603c" : "#e08560";
          ctx.fillRect(x - 2, y, 4, 2);
          ctx.fillRect(x - 1, y - 1, 2, 1);
        } else {
          ctx.fillStyle = "#b9a07a";
          ctx.fillRect(x - 2, y - 1, 4, 3);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(0, 0, W, H);
      }

      // big passed-logs counter on a cream plate (numbers only, so no translation needed)
      if (started) {
        const s = String(passed);
        const pw = 20 + s.length * 12;
        const px = Math.round((W - pw) / 2);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(px - 2, 10, pw + 4, 28);
        ctx.fillStyle = "#a8743c";
        ctx.fillRect(px, 12, pw, 24);
        ctx.fillStyle = "#f7e9c8";
        ctx.fillRect(px + 2, 14, pw - 4, 20);
        ctx.font = "26px VT323, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#3a2414";
        ctx.fillText(s, W / 2, 25);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      } else {
        // "tap to fly" hint with a bouncing arrow (translated)
        const bob = Math.round(Math.sin(time * 5) * 2);
        const msg = t("mini_games.bird.tap");
        ctx.font = "20px VT323, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const tw = Math.max(90, msg.length * 9 + 24);
        const bx = Math.round((W - tw) / 2);
        const by = Math.round(H * 0.62);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(bx - 2, by - 2, tw + 4, 26);
        ctx.fillStyle = "#f7e9c8";
        ctx.fillRect(bx, by, tw, 22);
        ctx.fillStyle = "#3a2414";
        ctx.fillText(msg, W / 2, by + 11);
        // arrow pointing up at the bird
        ctx.fillStyle = "#c97f22";
        ctx.fillRect(W / 2 - 1, by - 14 + bob, 3, 8);
        ctx.fillRect(W / 2 - 4, by - 14 + bob, 9, 2);
        ctx.fillRect(W / 2 - 2, by - 16 + bob, 5, 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }
    };

    return { update, draw, down: () => flap() };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
