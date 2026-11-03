// "Ritim Dərsi" (Music Lesson) – notes slide down a perspective runway in a music room.
// Four lanes, each with its own shape and colour; tap the pad while the note is over it.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { mk } from "../game/sprites";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const LANES = 4;
const HORIZON = 86; // where the runway starts, far away
const HIT_Y = 286; // the judgement line
const PAD_Y = 306; // the row of pads
const TOP_HALF = 26; // runway half-width at the horizon
const BOT_HALF = 112; // runway half-width at the bottom
const HIT_WINDOW = 0.1; // |p - 1| that still counts
const PERFECT = 0.042;

type Shape = "circle" | "diamond" | "triangle" | "square";
const LANE_SHAPE: Shape[] = ["circle", "diamond", "triangle", "square"];
/** face, dark, light – taken from the reference art */
const LANE_COLOR: [string, string, string][] = [
  ["#e8a63c", "#9c6414", "#ffd98f"], // amber circle
  ["#4fd0c4", "#1d8278", "#b4f3ec"], // teal diamond
  ["#d9697e", "#8e3245", "#ffb3c0"], // rose triangle
  ["#a98fd8", "#5f4596", "#ddcbf7"], // violet square
];
const KEY_FOR = ["a", "s", "d", "f"];

interface Note {
  lane: number;
  p: number; // 0 at the horizon, 1 at the judgement line
  state: "fall" | "hit" | "miss";
  t: number;
}
interface Ring {
  lane: number;
  t: number;
  good: boolean;
}
interface Float {
  lane: number;
  y: number;
  text: string;
  t: number;
  col: string;
}

export default function Rhythm({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    let notes: Note[] = [];
    let rings: Ring[] = [];
    let floats: Float[] = [];
    let lives = 3;
    api.setLives(lives);
    let combo = 0;
    let best = 0;
    let spawnT = 1.1;
    let time = 0;
    const press = [0, 0, 0, 0];
    let judge = { text: "", t: 0, col: "#fff" };
    let dead = false;
    const held = [false, false, false, false];

    /* ---------------- geometry ---------------- */
    // y on screen for a progress value, eased so notes appear to accelerate
    const yAt = (p: number) => HORIZON + (HIT_Y - HORIZON) * p * p * 0.72 + (HIT_Y - HORIZON) * p * 0.28;
    const halfAt = (y: number) => {
      const t = Math.max(0, Math.min(1, (y - HORIZON) / (HIT_Y - HORIZON)));
      return TOP_HALF + (BOT_HALF - TOP_HALF) * t;
    };
    const laneX = (lane: number, y: number) => W / 2 + ((lane - (LANES - 1) / 2) / (LANES / 2)) * halfAt(y) * 0.78;
    const padX = (lane: number) => laneX(lane, HIT_Y);
    const noteSize = (y: number) => 7 + 12 * Math.max(0, Math.min(1, (y - HORIZON) / (HIT_Y - HORIZON)));

    /* ---------------- painted music room (drawn once) ---------------- */
    const room = mk(W, H);
    {
      const g = room.getContext("2d")!;
      const R = (x: number, y: number, w: number, h: number, c: string) => {
        g.fillStyle = c;
        g.fillRect(x, y, w, h);
      };
      // plaster wall + wooden wainscoting
      R(0, 0, W, H, "#efe3cd");
      R(0, 0, W, 10, "#c9b48f");
      for (let i = 0; i < 300; i++) R((i * 83) % W, (i * 47) % 170, 2, 2, "#e6d8bf");
      // side walls in perspective
      g.fillStyle = "#8a5f38";
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(W / 2 - TOP_HALF - 16, HORIZON - 16);
      g.lineTo(W / 2 - BOT_HALF - 30, H);
      g.lineTo(0, H);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(W, 0);
      g.lineTo(W / 2 + TOP_HALF + 16, HORIZON - 16);
      g.lineTo(W / 2 + BOT_HALF + 30, H);
      g.lineTo(W, H);
      g.closePath();
      g.fill();
      // plank lines on the side walls
      g.save();
      g.globalAlpha = 0.25;
      for (let i = 1; i < 9; i++) {
        g.strokeStyle = "#5e3b26";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, (i * H) / 9);
        g.lineTo(W / 2 - TOP_HALF - 10, HORIZON + (i * 8));
        g.stroke();
        g.beginPath();
        g.moveTo(W, (i * H) / 9);
        g.lineTo(W / 2 + TOP_HALF + 10, HORIZON + (i * 8));
        g.stroke();
      }
      g.restore();
      // window on the left with a mountain view
      R(10, 34, 62, 58, "#6b4426");
      R(14, 38, 54, 50, "#9fd8ef");
      R(14, 66, 54, 22, "#7fb86a");
      R(20, 52, 18, 16, "#8c93a8");
      R(38, 46, 22, 22, "#a7aec2");
      R(14, 60, 54, 2, "#cfe9f5");
      R(40, 38, 3, 50, "#6b4426");
      R(14, 60, 54, 3, "#6b4426");
      // shelf with instruments on the right
      R(170, 30, 66, 6, "#6b4426");
      R(170, 74, 66, 6, "#6b4426");
      R(188, 36, 10, 26, "#8c4a22"); // violin body
      R(191, 20, 4, 18, "#5e3b26"); // neck
      R(186, 42, 16, 14, "#a3561f");
      R(208, 40, 22, 20, "#c9c4b8"); // drum
      R(208, 40, 22, 4, "#d9453b");
      R(208, 56, 22, 4, "#d9453b");
      R(176, 82, 54, 10, "#f3ead6"); // stack of sheet music
      R(176, 86, 54, 2, "#d9cfb6");
      // bookshelf colours
      for (let i = 0; i < 8; i++) R(176 + i * 7, 44, 5, 28, ["#d9453b", "#4a90d9", "#6abe30", "#fbd54a", "#b86fc6"][i % 5]);
      R(170, 72, 66, 4, "#6b4426");
      // floor
      R(0, 300, W, H - 300, "#b07e4a");
      for (let x = 0; x < W; x += 24) R(x, 300, 2, H - 300, "#8a5f38");
      R(0, 300, W, 3, "#c99a63");
    }

    /* ---------------- runway, rebuilt once ---------------- */
    const runway = mk(W, H);
    {
      const g = runway.getContext("2d")!;
      // carpet
      g.fillStyle = "#1f5f5c";
      g.beginPath();
      g.moveTo(W / 2 - TOP_HALF, HORIZON);
      g.lineTo(W / 2 + TOP_HALF, HORIZON);
      g.lineTo(W / 2 + BOT_HALF, H);
      g.lineTo(W / 2 - BOT_HALF, H);
      g.closePath();
      g.fill();
      // lighter centre strip
      g.fillStyle = "#246b67";
      g.beginPath();
      g.moveTo(W / 2 - TOP_HALF * 0.6, HORIZON);
      g.lineTo(W / 2 + TOP_HALF * 0.6, HORIZON);
      g.lineTo(W / 2 + BOT_HALF * 0.6, H);
      g.lineTo(W / 2 - BOT_HALF * 0.6, H);
      g.closePath();
      g.fill();
      // lane dividers
      g.strokeStyle = "rgba(255,255,255,0.18)";
      g.lineWidth = 1;
      for (let i = 1; i < LANES; i++) {
        const t = (i - LANES / 2) / (LANES / 2);
        g.beginPath();
        g.moveTo(W / 2 + t * TOP_HALF * 0.78, HORIZON);
        g.lineTo(W / 2 + t * BOT_HALF * 0.78, H);
        g.stroke();
      }
      // carpet edges
      g.strokeStyle = "#143f3d";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(W / 2 - TOP_HALF, HORIZON);
      g.lineTo(W / 2 - BOT_HALF, H);
      g.moveTo(W / 2 + TOP_HALF, HORIZON);
      g.lineTo(W / 2 + BOT_HALF, H);
      g.stroke();
      // soft haze where the runway disappears
      const fade = g.createLinearGradient(0, HORIZON - 10, 0, HORIZON + 46);
      fade.addColorStop(0, "rgba(239,227,205,0.95)");
      fade.addColorStop(1, "rgba(239,227,205,0)");
      g.fillStyle = fade;
      g.fillRect(0, HORIZON - 12, W, 58);
    }

    /* ---------------- shapes ---------------- */
    const drawShape = (shape: Shape, x: number, y: number, size: number, ci: number, alpha = 1) => {
      const [face, dark, light] = LANE_COLOR[ci];
      ctx.globalAlpha = alpha;
      const s = size;
      const path = () => {
        ctx.beginPath();
        if (shape === "circle") ctx.arc(x, y, s / 2, 0, Math.PI * 2);
        else if (shape === "diamond") {
          ctx.moveTo(x, y - s / 2);
          ctx.lineTo(x + s / 2, y);
          ctx.lineTo(x, y + s / 2);
          ctx.lineTo(x - s / 2, y);
        } else if (shape === "triangle") {
          ctx.moveTo(x, y - s / 2);
          ctx.lineTo(x + s / 2, y + s / 2);
          ctx.lineTo(x - s / 2, y + s / 2);
        } else ctx.rect(x - s / 2, y - s / 2, s, s);
        ctx.closePath();
      };
      // dark rim
      ctx.fillStyle = dark;
      ctx.save();
      ctx.translate(0, 1);
      path();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = face;
      path();
      ctx.fill();
      // top highlight
      ctx.save();
      path();
      ctx.clip();
      ctx.fillStyle = light;
      ctx.fillRect(x - s / 2, y - s / 2, s, Math.max(1, s * 0.28));
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    /* ---------------- gameplay ---------------- */
    const speed = () => 0.3 + Math.min(0.34, api.elapsed.current * 0.0052); // progress per second
    const interval = () => Math.max(0.42, 0.95 - Math.min(1, api.elapsed.current / 75) * 0.5);

    const spawn = () => {
      const lane = Math.floor(Math.random() * LANES);
      notes.push({ lane, p: 0, state: "fall", t: 0 });
      if (Math.random() < 0.14 + Math.min(1, api.elapsed.current / 90) * 0.2) {
        const other = (lane + 1 + Math.floor(Math.random() * (LANES - 1))) % LANES;
        notes.push({ lane: other, p: -0.16, state: "fall", t: 0 });
      }
    };

    const tap = (lane: number) => {
      if (dead) return;
      press[lane] = 0.16;
      let pick: Note | null = null;
      let bd = 1e9;
      for (const n of notes) {
        if (n.state !== "fall" || n.lane !== lane) continue;
        const d = Math.abs(n.p - 1);
        if (d < bd) {
          bd = d;
          pick = n;
        }
      }
      if (!pick || bd > HIT_WINDOW) {
        combo = 0;
        sfx("error");
        judge = { text: "…", t: 0.3, col: "#b9b4a8" };
        return;
      }
      pick.state = "hit";
      pick.t = 0;
      combo++;
      best = Math.max(best, combo);
      const mult = 1 + Math.min(4, Math.floor(combo / 5)) * 0.5;
      const perfect = bd < PERFECT;
      const gain = Math.round((perfect ? 40 : bd < HIT_WINDOW * 0.6 ? 24 : 14) * mult);
      api.addScore(gain);
      rings.push({ lane, t: 0, good: true });
      floats.push({ lane, y: HIT_Y - 26, text: `+${gain}`, t: 0.6, col: perfect ? "#fbd54a" : LANE_COLOR[lane][0] });
      judge = perfect ? { text: "Mükəmməl!", t: 0.4, col: "#fbd54a" } : { text: "Yaxşı!", t: 0.4, col: LANE_COLOR[lane][0] };
      sfx(perfect ? "gem" : "place");
    };

    const miss = (n: Note) => {
      n.state = "miss";
      n.t = 0;
      combo = 0;
      lives--;
      api.setLives(lives);
      rings.push({ lane: n.lane, t: 0, good: false });
      sfx("hit");
      if (lives <= 0) {
        dead = true;
        api.finish("dead");
      }
    };

    const update = (dt: number) => {
      if (dead) return;
      time += dt;
      if (judge.t > 0) judge.t -= dt;
      for (let i = 0; i < LANES; i++) {
        if (press[i] > 0) press[i] -= dt;
        const k = keys.has(KEY_FOR[i]) || keys.has(["arrowleft", "arrowdown", "arrowup", "arrowright"][i]);
        if (k && !held[i]) tap(i);
        held[i] = k;
      }
      spawnT -= dt;
      if (spawnT <= 0) {
        spawn();
        spawnT = interval() * (0.85 + Math.random() * 0.3);
      }
      const sp = speed();
      for (const n of notes) {
        if (n.state === "fall") {
          n.p += sp * dt;
          if (n.p > 1 + HIT_WINDOW) miss(n);
        } else n.t += dt;
      }
      notes = notes.filter((n) => n.state === "fall" || n.t < 0.4);
      rings = rings.filter((r) => (r.t += dt) < 0.45);
      floats = floats.filter((f) => (f.t -= dt) > 0);
      floats.forEach((f) => (f.y -= 34 * dt));
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(room, 0, 0);
      ctx.drawImage(runway, 0, 0);

      const beat = Math.max(0, Math.sin(time * 5.2));

      // judgement line
      const hl = halfAt(HIT_Y) * 0.92;
      ctx.fillStyle = "#f3ead6";
      ctx.fillRect(W / 2 - hl, HIT_Y - 1, hl * 2, 2);
      ctx.fillStyle = `rgba(251,213,74,${0.25 + beat * 0.25})`;
      ctx.fillRect(W / 2 - hl, HIT_Y - 4, hl * 2, 3);

      // falling notes (far ones first so near ones overlap them)
      for (const n of [...notes].sort((a, b) => a.p - b.p)) {
        if (n.state !== "fall" || n.p < 0) continue;
        const y = yAt(n.p);
        const x = laneX(n.lane, y);
        drawShape(LANE_SHAPE[n.lane], x, y, noteSize(y), n.lane);
      }

      // pads
      for (let i = 0; i < LANES; i++) {
        const x = padX(i);
        const down = press[i] > 0;
        const [face, dark, light] = LANE_COLOR[i];
        const r = 17;
        ctx.fillStyle = "#4a2d1c";
        ctx.beginPath();
        ctx.arc(x, PAD_Y + (down ? 2 : 0), r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = down ? light : dark;
        ctx.beginPath();
        ctx.arc(x, PAD_Y + (down ? 2 : 0), r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = down ? "#ffffff" : face;
        ctx.beginPath();
        ctx.arc(x, PAD_Y - 1 + (down ? 2 : 0), r - 5, 0, Math.PI * 2);
        ctx.fill();
        // the lane's shape is embossed on its pad
        drawShape(LANE_SHAPE[i], x, PAD_Y + (down ? 2 : 0), 13, i, 0.85);
      }

      // hit / miss rings
      for (const r of rings) {
        const x = padX(r.lane);
        const k = r.t / 0.45;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 3;
        ctx.strokeStyle = r.good ? "#fbd54a" : "#d9453b";
        ctx.beginPath();
        ctx.arc(x, PAD_Y, 18 + k * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // floating scores
      ctx.font = "22px VT323, monospace";
      ctx.textAlign = "center";
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.t * 2.5);
        const x = padX(f.lane);
        ctx.fillStyle = "#2a1a10";
        ctx.fillText(f.text, x + 1, f.y + 1);
        ctx.fillStyle = f.col;
        ctx.fillText(f.text, x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";

      // HUD
      ctx.font = "18px VT323, monospace";
      ctx.textBaseline = "top";
      for (let i = 0; i < lives; i++) {
        const hx = 10 + i * 18;
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(hx, 8, 12, 10);
        ctx.fillRect(hx + 2, 6, 8, 10);
        ctx.fillStyle = "#f6f1e4";
        ctx.fillRect(hx + 3, 9, 2, 2);
      }
      if (combo > 1) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#2a1a10";
        ctx.fillText(`KOMBO x${combo}`, W / 2 + 1, 7);
        ctx.fillStyle = combo >= 10 ? "#e8a63c" : "#1f8278";
        ctx.fillText(`KOMBO x${combo}`, W / 2, 6);
        ctx.textAlign = "left";
      }
      if (best >= 5) {
        ctx.textAlign = "right";
        ctx.fillStyle = "#8a6a4e";
        ctx.fillText(`max ${best}`, W - 8, 6);
        ctx.textAlign = "left";
      }
      if (judge.t > 0) {
        ctx.globalAlpha = Math.min(1, judge.t * 3);
        ctx.font = "28px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#2a1a10";
        ctx.fillText(judge.text, W / 2 + 1, 243);
        ctx.fillStyle = judge.col;
        ctx.fillText(judge.text, W / 2, 242);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
      ctx.textBaseline = "alphabetic";
    };

    return {
      update,
      draw,
      down: (x, y) => {
        // anywhere in the lower half: pick the nearest pad
        if (y < HORIZON) return;
        let bestLane = 0;
        let bd = 1e9;
        for (let i = 0; i < LANES; i++) {
          const d = Math.abs(padX(i) - x);
          if (d < bd) {
            bd = d;
            bestLane = i;
          }
        }
        tap(bestLane);
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
