// "Sakit Balıqçılıq" (Calm Fishing) – tap when the fish bites, then stop the needle in the green zone.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { iconCanvas, spriteWith } from "../game/sprites";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const WATER_Y = 120;
const BAR_X = 22;
const BAR_W = W - 44;
const BAR_Y = 318;
const BOBBER_X = 120;
const BOBBER_Y = 205;

type FishKind = "small" | "medium" | "big" | "junk";
const FISH: Record<FishKind, { value: number; speed: number; w: number; h: number; name: string }> = {
  small: { value: 25, speed: 1, w: 20, h: 12, name: "small" },
  medium: { value: 45, speed: 1.25, w: 28, h: 16, name: "medium" },
  big: { value: 70, speed: 1.55, w: 38, h: 20, name: "big" },
  junk: { value: 10, speed: 0.8, w: 22, h: 18, name: "junk" },
};

interface Shadow {
  kind: FishKind;
  x: number;
  y: number;
  vx: number;
  ph: number;
  decoy: boolean;
}

export default function Fishing({ api }: { api: MiniApi }) {
  const setup = ({ ctx }: GameCtx): GameLogic => {
    let phase: "idle" | "bite" | "reel" | "caught" = "idle";
    let time = 0;
    let biteT = 0;
    let stage = 0;
    let needle = 0;
    let needleDir = 1;
    let zone = 0.3;
    let zonePos = 0.35;
    let combo = 0;
    let target: Shadow | null = null;
    let caught: { kind: FishKind; t: number } | null = null;
    let shadows: Shadow[] = [];
    let msg = "";
    let msgT = 0;
    let ripples: { x: number; y: number; r: number; life: number }[] = [];
    let bubbles: { x: number; y: number; s: number }[] = [];

    const pickKind = (): FishKind => {
      const r = Math.random();
      if (r < 0.12) return "junk";
      if (r < 0.5) return "small";
      if (r < 0.85) return "medium";
      return "big";
    };

    const spawnDecoys = () => {
      shadows = [];
      for (let i = 0; i < 3; i++) {
        const kind = pickKind();
        shadows.push({
          kind,
          x: Math.random() < 0.5 ? -40 : W + 40,
          y: 210 + Math.random() * 110,
          vx: 0,
          ph: Math.random() * 6,
          decoy: true,
        });
        shadows[i].vx = shadows[i].x < 0 ? 22 + Math.random() * 26 : -(22 + Math.random() * 26);
      }
    };
    spawnDecoys();

    const newRound = () => {
      phase = "idle";
      target = null;
      stage = 0;
      needle = 0;
      needleDir = 1;
      zone = 0.3;
      zonePos = 0.25 + Math.random() * 0.45;
      // pick the fish that will bite, others swim by
      const kind = pickKind();
      target = { kind, x: Math.random() < 0.5 ? -40 : W + 40, y: BOBBER_Y + 24, vx: 0, ph: Math.random() * 6, decoy: false };
      target.vx = target.x < 0 ? 34 : -34;
      if (shadows.length > 3) shadows = shadows.slice(0, 3);
      shadows.push(target);
      spawnDecoysKeep();
    };
    const spawnDecoysKeep = () => {
      while (shadows.filter((s) => s.decoy).length < 2) {
        const kind = pickKind();
        const fromLeft = Math.random() < 0.5;
        shadows.push({
          kind,
          x: fromLeft ? -40 : W + 40,
          y: 215 + Math.random() * 105,
          vx: fromLeft ? 20 + Math.random() * 30 : -(20 + Math.random() * 30),
          ph: Math.random() * 6,
          decoy: true,
        });
      }
    };
    newRound();

    const say = (text: string, t = 0.9) => {
      msg = text;
      msgT = t;
    };

    const update = (dt: number) => {
      time += dt;
      if (msgT > 0) msgT -= dt;
      ripples = ripples.filter((r) => (r.life -= dt) > 0);
      ripples.forEach((r) => (r.r += 26 * dt));
      bubbles = bubbles.filter((b) => (b.y -= 18 * dt) > WATER_Y);
      if (Math.random() < dt * 2.2) bubbles.push({ x: 20 + Math.random() * (W - 40), y: H - 10, s: 1 + Math.random() * 2 });

      for (const s of shadows) {
        s.ph += dt * 2;
        s.x += s.vx * dt * (s.decoy ? 1 : 1);
        if (s.x < -60 || s.x > W + 60) {
          if (s.decoy) {
            const fromLeft = Math.random() < 0.5;
            s.x = fromLeft ? -40 : W + 40;
            s.vx = fromLeft ? 20 + Math.random() * 30 : -(20 + Math.random() * 30);
            s.y = 215 + Math.random() * 105;
          }
        }
      }

      if (phase === "idle") {
        // the target fish swims toward the bobber
        if (target) {
          const dx = BOBBER_X - target.x;
          const dy = BOBBER_Y + 22 - target.y;
          const d = Math.hypot(dx, dy);
          const sp = 46 * FISH[target.kind].speed;
          if (d > 6) {
            target.x += (dx / d) * sp * dt;
            target.y += (dy / d) * sp * dt;
          } else {
            phase = "bite";
            biteT = 1.15;
            sfx("tick");
            ripples.push({ x: BOBBER_X, y: BOBBER_Y, r: 2, life: 0.6 });
          }
        }
      } else if (phase === "bite") {
        biteT -= dt;
        if (biteT <= 0) {
          // missed it
          if (target) {
            target.decoy = true;
            target.vx = target.x < BOBBER_X ? -40 : 40;
            target.y += 24;
          }
          combo = 0;
          say("…");
          newRound();
        }
      } else if (phase === "reel") {
        needle += needleDir * dt * (0.62 + Math.min(1, api.elapsed.current / api.duration) * 0.7);
        if (needle >= 1) {
          needle = 1;
          needleDir = -1;
        }
        if (needle <= 0) {
          needle = 0;
          needleDir = 1;
        }
      } else if (phase === "caught") {
        if (caught) {
          caught.t -= dt;
          if (caught.t <= 0) {
            caught = null;
            newRound();
          }
        }
      }
    };

    const tap = () => {
      if (phase === "bite") {
        phase = "reel";
        stage = 0;
        zone = 0.3;
        needle = 0;
        needleDir = 1;
        sfx("place");
        return;
      }
      if (phase === "reel") {
        const inside = needle >= zonePos && needle <= zonePos + zone;
        if (inside) {
          stage++;
          const center = zonePos + zone / 2;
          const closeness = 1 - Math.abs(needle - center) / (zone / 2);
          sfx("gem");
          if (stage >= 3) {
            const kind = target?.kind ?? "small";
            const bonus = Math.round(closeness * 15);
            const gain = FISH[kind].value + bonus + combo * 5;
            api.addScore(gain);
            combo++;
            caught = { kind, t: 1.3 };
            phase = "caught";
            sfx("coin");
            say(`+${gain}`, 1.2);
            ripples.push({ x: BOBBER_X, y: BOBBER_Y, r: 2, life: 0.8 });
          } else {
            say(`✔ ${stage}/3`, 0.6);
            zone = Math.max(0.2, zone - 0.045);
            zonePos = 0.12 + Math.random() * (0.88 - zone);
            needle = needleDir > 0 ? 0 : 1;
          }
        } else {
          // escaped
          if (target) {
            target.decoy = true;
            target.vx = target.x < BOBBER_X ? -50 : 50;
          }
          combo = 0;
          phase = "idle";
          say("✖", 0.8);
          sfx("error");
          newRound();
        }
      }
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      // sky
      const g = ctx.createLinearGradient(0, 0, 0, WATER_Y);
      g.addColorStop(0, "#4a90d9");
      g.addColorStop(0.55, "#7fd6e8");
      g.addColorStop(1, "#d8f2f8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, WATER_Y);
      // sun with rays
      ctx.fillStyle = "rgba(251,213,74,0.35)";
      ctx.fillRect(188, 6, 34, 34);
      ctx.fillStyle = "#fbd54a";
      ctx.fillRect(196, 14, 18, 18);
      ctx.fillStyle = "#fff6c8";
      ctx.fillRect(199, 17, 12, 12);
      for (let i = 0; i < 4; i++) {
        const a = time * 0.6 + (i * Math.PI) / 2;
        ctx.fillStyle = "rgba(251,213,74,0.7)";
        ctx.fillRect(Math.round(205 + Math.cos(a) * 15), Math.round(23 + Math.sin(a) * 15), 3, 3);
      }
      // drifting clouds
      for (let i = 0; i < 3; i++) {
        const cx = ((time * (6 + i * 3) + i * 97) % (W + 60)) - 30;
        const cy = 18 + i * 22;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(Math.round(cx), cy, 34, 8);
        ctx.fillRect(Math.round(cx) + 7, cy - 6, 18, 7);
        ctx.fillStyle = "rgba(185,180,216,0.8)";
        ctx.fillRect(Math.round(cx), cy + 6, 34, 2);
      }
      // birds
      ctx.fillStyle = "#1b1a2e";
      for (let i = 0; i < 3; i++) {
        const bx = ((time * (16 + i * 5) + i * 80) % (W + 40)) - 20;
        const by = 44 + i * 12 + Math.sin(time * 2 + i) * 4;
        const w2 = Math.floor(time * 8 + i * 2) % 2;
        ctx.fillRect(Math.round(bx) - 4, Math.round(by) - w2, 4, 1);
        ctx.fillRect(Math.round(bx) + 1, Math.round(by) - w2, 4, 1);
      }
      // distant mountains
      ctx.fillStyle = "#8d94b8";
      for (let x = 0; x < W; x += 2) {
        const hgt = 26 + Math.round(Math.abs(Math.sin(x / 34)) * 16);
        ctx.fillRect(x, WATER_Y - 30 - hgt + 26, 2, hgt);
      }
      ctx.fillStyle = "#e8ecf8";
      for (let x = 0; x < W; x += 2) {
        const hgt = 26 + Math.round(Math.abs(Math.sin(x / 34)) * 16);
        if (hgt > 36) ctx.fillRect(x, WATER_Y - 30 - hgt + 26, 2, 4);
      }
      // far + near hills
      ctx.fillStyle = "#5fae3f";
      for (let x = 0; x < W; x += 2) ctx.fillRect(x, WATER_Y - 22 + Math.round(Math.sin(x / 40) * 6), 2, 30);
      ctx.fillStyle = "#3e8948";
      for (let x = 0; x < W; x += 2) ctx.fillRect(x, WATER_Y - 12 + Math.round(Math.sin(x / 26 + 2) * 4), 2, 20);
      // village houses with windows
      for (const [bx, bw, bh] of [
        [10, 26, 16],
        [46, 20, 12],
        [150, 22, 14],
        [186, 30, 20],
      ] as [number, number, number][]) {
        ctx.fillStyle = "#f6ecd0";
        ctx.fillRect(bx, WATER_Y - bh, bw, bh);
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(bx - 2, WATER_Y - bh - 4, bw + 4, 5);
        ctx.fillStyle = "#fbd54a";
        ctx.fillRect(bx + 3, WATER_Y - bh + 4, 5, 6);
        ctx.fillRect(bx + bw - 8, WATER_Y - bh + 4, 5, 6);
        ctx.fillStyle = "#5e3b26";
        ctx.fillRect(bx + bw / 2 - 3, WATER_Y - 8, 6, 8);
      }
      // pine trees on the shore
      for (const tx of [70, 120, 138, 228]) {
        ctx.fillStyle = "#265c42";
        ctx.fillRect(tx, WATER_Y - 20, 8, 10);
        ctx.fillRect(tx + 1, WATER_Y - 26, 6, 7);
        ctx.fillRect(tx + 2, WATER_Y - 30, 4, 5);
        ctx.fillStyle = "#5e3b26";
        ctx.fillRect(tx + 3, WATER_Y - 10, 2, 10);
      }
      // sandy shoreline
      ctx.fillStyle = "#ecd9a0";
      ctx.fillRect(0, WATER_Y - 3, W, 4);
      // water
      const wg = ctx.createLinearGradient(0, WATER_Y, 0, H);
      wg.addColorStop(0, "#5aa3e6");
      wg.addColorStop(0.4, "#3d7dc4");
      wg.addColorStop(1, "#1f3d7a");
      ctx.fillStyle = wg;
      ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
      ctx.fillStyle = "#aee7f5";
      ctx.fillRect(0, WATER_Y, W, 2);
      // layered surface waves
      for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < 9; i++) {
          const x = (i * 41 + layer * 17 + ((time * (10 + layer * 7)) % 41) + W) % W;
          ctx.fillStyle = `rgba(174,231,245,${0.55 - layer * 0.13})`;
          ctx.fillRect(Math.round(x), WATER_Y + 5 + layer * 9 + (i % 2) * 3, 14 - layer * 3, 1);
        }
      }
      // sun rays under water
      ctx.fillStyle = "rgba(174,231,245,0.10)";
      for (let i = 0; i < 3; i++) {
        const rx = 60 + i * 60 + Math.sin(time * 0.5 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(rx, WATER_Y + 4);
        ctx.lineTo(rx + 22, WATER_Y + 4);
        ctx.lineTo(rx + 44, H);
        ctx.lineTo(rx + 12, H);
        ctx.closePath();
        ctx.fill();
      }
      // sandy bottom + pebbles + seaweed
      ctx.fillStyle = "#c9b180";
      ctx.fillRect(0, H - 14, W, 14);
      ctx.fillStyle = "#a68d5e";
      for (let i = 0; i < 16; i++) ctx.fillRect((i * 53 + 7) % W, H - 12 + ((i * 7) % 8), 4, 2);
      for (let i = 0; i < 6; i++) {
        const sx = 12 + i * 42;
        const sway = Math.round(Math.sin(time * 1.6 + i * 1.3) * 3);
        const hh = 22 + (i % 3) * 8;
        ctx.fillStyle = "#2f7a4e";
        ctx.fillRect(sx, H - 14 - hh, 4, hh);
        ctx.fillRect(sx + sway, H - 20 - hh, 6, 4);
        ctx.fillStyle = "#4fa03f";
        ctx.fillRect(sx + 1, H - 14 - hh, 1, hh);
      }
      // lily pads + flower
      for (const [lx, ly] of [[30, 168], [196, 158], [168, 250]] as [number, number][]) {
        const drift = Math.round(Math.sin(time * 0.8 + lx) * 2);
        ctx.fillStyle = "#2f7a4e";
        ctx.fillRect(lx + drift, ly, 20, 6);
        ctx.fillStyle = "#4fa03f";
        ctx.fillRect(lx + drift + 2, ly - 1, 16, 3);
        if (lx < 100) {
          ctx.fillStyle = "#f48fb1";
          ctx.fillRect(lx + drift + 8, ly - 5, 5, 4);
          ctx.fillStyle = "#fbd54a";
          ctx.fillRect(lx + drift + 10, ly - 4, 2, 2);
        }
      }
      // reeds at the edges
      for (const rx of [4, 10, W - 14, W - 8]) {
        const sway = Math.round(Math.sin(time * 1.8 + rx) * 2);
        ctx.fillStyle = "#3e8948";
        ctx.fillRect(rx + sway, WATER_Y - 22, 3, 26);
        ctx.fillStyle = "#5e3b26";
        ctx.fillRect(rx + sway, WATER_Y - 28, 3, 7);
      }
      // bubbles
      for (const b of bubbles) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s);
      }

      // fish (colored by kind, tail wiggle, target glows)
      for (const s of shadows) {
        const def = FISH[s.kind];
        const spr =
          s.kind === "junk"
            ? iconCanvas("boot")
            : s.kind === "big"
              ? spriteWith("fish", "b", "o")
              : s.kind === "medium"
                ? spriteWith("fish", "b", "t")
                : iconCanvas("fish");
        const bob = Math.sin(s.ph) * 2;
        const wig = Math.round(Math.sin(s.ph * 3) * 1.5);
        const fx = Math.round(s.x - def.w / 2);
        const fy = Math.round(s.y - def.h / 2 + bob);
        const flip = s.vx < 0;
        if (!s.decoy && phase !== "caught") {
          ctx.fillStyle = `rgba(251,213,74,${(0.14 + 0.08 * Math.sin(time * 6)).toFixed(2)})`;
          ctx.fillRect(fx - 4, fy - 4, def.w + 8, def.h + 8);
        }
        ctx.globalAlpha = s.decoy ? 0.55 : 0.95;
        if (flip) {
          ctx.save();
          ctx.translate(fx + def.w / 2, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(spr, -def.w / 2, fy + wig, def.w, def.h);
          ctx.restore();
        } else {
          ctx.drawImage(spr, fx, fy + wig, def.w, def.h);
        }
        ctx.globalAlpha = 1;
      }

      // ripples
      for (const r of ripples) {
        ctx.globalAlpha = Math.max(0, r.life);
        ctx.fillStyle = "#7fd6e8";
        ctx.fillRect(Math.round(r.x - r.r), Math.round(r.y), Math.round(r.r * 2), 1);
        ctx.fillRect(Math.round(r.x - r.r * 0.6), Math.round(r.y - 3), Math.round(r.r * 1.2), 1);
        ctx.globalAlpha = 1;
      }

      // wooden pier (foreground, left)
      const pierY = WATER_Y + 66;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, pierY + 12, 66, 4);
      ctx.fillStyle = "#7d5632";
      ctx.fillRect(0, pierY, 62, 12);
      ctx.fillStyle = "#9a6b3f";
      for (let x = 2; x < 60; x += 10) ctx.fillRect(x, pierY, 7, 12);
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(0, pierY + 10, 62, 2);
      for (const px of [8, 30, 52]) {
        ctx.fillStyle = "#4a2d1c";
        ctx.fillRect(px, pierY + 12, 5, 40);
      }
      // bucket on the pier
      ctx.fillStyle = "#b9b4a8";
      ctx.fillRect(40, pierY - 12, 14, 12);
      ctx.fillStyle = "#6f6a6f";
      ctx.fillRect(40, pierY - 12, 14, 2);
      ctx.fillRect(40, pierY - 6, 14, 1);
      ctx.fillStyle = "#4a90d9";
      ctx.fillRect(42, pierY - 10, 10, 3);
      // coiled rope
      ctx.fillStyle = "#c9a06a";
      ctx.fillRect(8, pierY - 5, 12, 5);
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(10, pierY - 3, 8, 1);

      // fishing rod resting on the pier
      const rodTipX = 66;
      const rodTipY = pierY - 40;
      ctx.strokeStyle = "#5e3b26";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(20, pierY - 2);
      ctx.lineTo(rodTipX, rodTipY);
      ctx.stroke();
      ctx.strokeStyle = "#9a6b3f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, pierY - 2);
      ctx.lineTo(rodTipX, rodTipY);
      ctx.stroke();
      // line with a natural sag
      ctx.strokeStyle = "#f6f1e4";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      const sag = phase === "bite" || phase === "reel" ? 2 : 10;
      ctx.quadraticCurveTo((rodTipX + BOBBER_X) / 2, Math.max(rodTipY, BOBBER_Y - 6) + sag, BOBBER_X, BOBBER_Y - 6);
      ctx.stroke();

      // bobber
      const dip = phase === "bite" ? 5 : phase === "reel" ? 3 : Math.sin(time * 3) * 1.5;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(BOBBER_X - 7, BOBBER_Y + 7, 14, 2);
      ctx.fillStyle = "#1b1a2e";
      ctx.fillRect(BOBBER_X - 5, Math.round(BOBBER_Y - 7 + dip), 10, 14);
      ctx.fillStyle = "#d9453b";
      ctx.fillRect(BOBBER_X - 4, Math.round(BOBBER_Y - 6 + dip), 8, 6);
      ctx.fillStyle = "#ff8a80";
      ctx.fillRect(BOBBER_X - 3, Math.round(BOBBER_Y - 5 + dip), 2, 2);
      ctx.fillStyle = "#f6f1e4";
      ctx.fillRect(BOBBER_X - 4, Math.round(BOBBER_Y + dip), 8, 6);
      ctx.fillStyle = "#1b1a2e";
      ctx.fillRect(BOBBER_X - 1, Math.round(BOBBER_Y - 9 + dip), 2, 3);

      // bite marker with pulsing ring
      if (phase === "bite") {
        const pr = 10 + ((time * 30) % 12);
        ctx.globalAlpha = Math.max(0, 1 - pr / 24);
        ctx.fillStyle = "#fbd54a";
        ctx.fillRect(Math.round(BOBBER_X - pr), BOBBER_Y - 22, Math.round(pr * 2), 2);
        ctx.fillRect(Math.round(BOBBER_X - pr), BOBBER_Y - 8, Math.round(pr * 2), 2);
        ctx.globalAlpha = 1;
        ctx.font = "34px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#1b1a2e";
        ctx.fillText("!", BOBBER_X + 1, BOBBER_Y - 19);
        ctx.fillStyle = Math.floor(time * 12) % 2 ? "#fbd54a" : "#ff8a80";
        ctx.fillText("!", BOBBER_X, BOBBER_Y - 20);
        ctx.textAlign = "left";
      }
      if (phase === "reel") {
        // splashes while reeling
        if (Math.random() < 0.5) {
          ctx.fillStyle = "#aee7f5";
          ctx.fillRect(BOBBER_X - 8 + Math.floor(Math.random() * 16), BOBBER_Y + 6, 2, 4);
        }
      }

      // reel bar (wood-framed gauge)
      if (phase === "reel" || phase === "caught") {
        ctx.fillStyle = "#1b1a2e";
        ctx.fillRect(BAR_X - 7, BAR_Y - 17, BAR_W + 14, 34);
        ctx.fillStyle = "#7d5632";
        ctx.fillRect(BAR_X - 5, BAR_Y - 15, BAR_W + 10, 30);
        ctx.fillStyle = "#5e3b26";
        ctx.fillRect(BAR_X - 5, BAR_Y + 12, BAR_W + 10, 3);
        ctx.fillStyle = "#20304a";
        ctx.fillRect(BAR_X, BAR_Y - 10, BAR_W, 18);
        // zone with glow
        const zx = BAR_X + zonePos * BAR_W;
        const zw = Math.max(6, Math.round(zone * BAR_W));
        ctx.fillStyle = "rgba(106,190,48,0.35)";
        ctx.fillRect(Math.round(zx) - 2, BAR_Y - 12, zw + 4, 22);
        const zg = ctx.createLinearGradient(0, BAR_Y - 10, 0, BAR_Y + 8);
        zg.addColorStop(0, "#8be04a");
        zg.addColorStop(1, "#3e8948");
        ctx.fillStyle = zg;
        ctx.fillRect(Math.round(zx), BAR_Y - 10, zw, 18);
        ctx.fillStyle = "#fbd54a";
        ctx.fillRect(Math.round(zx), BAR_Y - 10, zw, 2);
        // ticks
        for (let i = 0; i <= 10; i++) {
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(BAR_X + Math.round((i / 10) * BAR_W), BAR_Y - 4, 1, 8);
        }
        // needle with glow
        const nx = BAR_X + needle * BAR_W;
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(Math.round(nx) - 4, BAR_Y - 16, 9, 30);
        ctx.fillStyle = "#1b1a2e";
        ctx.fillRect(Math.round(nx) - 2, BAR_Y - 16, 5, 30);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(nx) - 1, BAR_Y - 16, 3, 30);
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(Math.round(nx) - 1, BAR_Y - 16, 3, 4);
        // stage pips (fish hooks)
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = "#1b1a2e";
          ctx.fillRect(BAR_X + i * 14, BAR_Y + 16, 12, 6);
          ctx.fillStyle = i < stage ? "#fbd54a" : "#3a3670";
          ctx.fillRect(BAR_X + i * 14 + 1, BAR_Y + 17, 10, 4);
        }
        ctx.font = "14px VT323, monospace";
        ctx.fillStyle = "#f6ecd0";
        ctx.textAlign = "right";
        ctx.fillText("ÇƏK!", BAR_X + BAR_W, BAR_Y + 22);
        ctx.textAlign = "left";
      }

      // caught card
      if (phase === "caught" && caught) {
        const def = FISH[caught.kind];
        const spr =
          caught.kind === "junk"
            ? iconCanvas("boot")
            : caught.kind === "big"
              ? spriteWith("fish", "b", "o")
              : caught.kind === "medium"
                ? spriteWith("fish", "b", "t")
                : spriteWith("fish", "b", "c");
        ctx.fillStyle = "rgba(20,18,42,0.82)";
        ctx.fillRect(0, 112, W, 128);
        // wooden frame card
        ctx.fillStyle = "#1b1a2e";
        ctx.fillRect(W / 2 - 54, 122, 108, 96);
        ctx.fillStyle = "#7d5632";
        ctx.fillRect(W / 2 - 51, 125, 102, 90);
        ctx.fillStyle = "#20304a";
        ctx.fillRect(W / 2 - 46, 130, 92, 52);
        ctx.fillStyle = "rgba(174,231,245,0.25)";
        for (let i = 0; i < 5; i++) ctx.fillRect(W / 2 - 42 + i * 18, 134 + (i % 2) * 22, 10, 1);
        const bounce = Math.round(Math.abs(Math.sin(time * 8)) * -3);
        ctx.drawImage(spr, W / 2 - def.w / 2, 168 - def.h + bounce, def.w, def.h);
        if (caught.kind === "big") {
          ctx.fillStyle = "#fbd54a";
          const tw = Math.floor(time * 6) % 2;
          ctx.fillRect(W / 2 - 44 + tw, 132, 3, 3);
          ctx.fillRect(W / 2 + 40 - tw, 140, 3, 3);
          ctx.fillRect(W / 2 - 40 + tw, 172, 2, 2);
        }
        ctx.font = "26px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#1b1a2e";
        ctx.fillText(msg, W / 2 + 1, 190);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(msg, W / 2, 189);
        ctx.textAlign = "left";
      }

      // HUD text
      ctx.font = "18px VT323, monospace";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(20,18,42,0.65)";
      ctx.fillRect(4, 4, 52, 20);
      ctx.fillStyle = "#fbd54a";
      ctx.fillText(`★${combo}x`, 8, 6);
      if (msgT > 0 && phase !== "caught") {
        ctx.font = "28px VT323, monospace";
        ctx.textAlign = "center";
        const bw = Math.max(70, msg.length * 15 + 26);
        const bx = Math.round((W - bw) / 2);
        ctx.fillStyle = "rgba(74,45,28,0.85)";
        ctx.fillRect(bx, 40, bw, 28);
        ctx.fillStyle = "#a8784a";
        ctx.fillRect(bx, 40, bw, 2);
        ctx.fillRect(bx, 66, bw, 2);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(msg, W / 2, 42);
        ctx.textAlign = "left";
      }
      ctx.textBaseline = "alphabetic";
    };

    return { update, draw, down: () => tap() };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
