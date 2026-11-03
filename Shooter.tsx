// "Orbit Sweeper" – drag to fly, the ship fires automatically. Blast the space junk.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { iconCanvas, mk, outlineCanvas } from "../game/sprites";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface Enemy {
  kind: "rock" | "big" | "sat";
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  r: number;
  sc: number;
  score: number;
  flash: number;
  phase: number;
  flip: boolean;
}
interface Power {
  x: number;
  y: number;
  kind: "double" | "shield" | "heart";
}
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
  s: number;
}

/** Teal-and-cream shuttle with a glass cockpit and swept wings (reference image 6). */
function shipSprite(): HTMLCanvasElement {
  const c = mk(22, 26);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const hull = "#efe6d2";
  const hullDark = "#b9ad93";
  const teal = "#2f8a84";
  const tealDark = "#1d615d";
  const gold = "#e8a63c";
  // swept wings
  R(1, 12, 5, 9, teal);
  R(16, 12, 5, 9, teal);
  R(1, 19, 5, 2, tealDark);
  R(16, 19, 5, 2, tealDark);
  R(0, 15, 2, 5, gold);
  R(20, 15, 2, 5, gold);
  // fuselage
  R(8, 1, 6, 24, hull);
  R(7, 5, 8, 18, hull);
  R(6, 10, 10, 12, hull);
  R(6, 10, 2, 12, hullDark);
  R(14, 10, 2, 12, hullDark);
  // nose
  R(9, 0, 4, 2, teal);
  R(8, 2, 6, 2, teal);
  // cockpit glass
  R(9, 5, 4, 7, "#1d3a4a");
  R(9, 5, 4, 2, "#79c8e0");
  R(10, 7, 2, 3, "#3f7f9c");
  // engine block + nozzles
  R(7, 21, 8, 4, tealDark);
  R(7, 21, 8, 1, teal);
  R(8, 24, 2, 2, "#6b6256");
  R(12, 24, 2, 2, "#6b6256");
  return outlineCanvas(c);
}

/** Brown cratered meteor. */
function meteorSprite(size: number, seed: number): HTMLCanvasElement {
  const c = mk(size, size);
  const g = c.getContext("2d")!;
  const r = size / 2;
  let n = seed * 9301 + 49297;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - r + 0.5, y - r + 0.5);
      if (d > r - 0.4) continue;
      const lit = (x - r) * 0.6 + (y - r) * 0.8 < -r * 0.25;
      g.fillStyle = lit ? "#a98863" : d > r - 2 ? "#5e4630" : "#8a6c4a";
      g.fillRect(x, y, 1, 1);
    }
  }
  for (let i = 0; i < 3 + (seed % 3); i++) {
    const cx = 2 + rnd() * (size - 5);
    const cy = 2 + rnd() * (size - 5);
    if (Math.hypot(cx - r, cy - r) > r - 2.5) continue;
    g.fillStyle = "#6b5138";
    g.fillRect(Math.round(cx), Math.round(cy), 2, 2);
    g.fillStyle = "#59432e";
    g.fillRect(Math.round(cx), Math.round(cy) + 1, 2, 1);
  }
  return outlineCanvas(c);
}

/** Broken solar-panel satellite. */
function satSprite(): HTMLCanvasElement {
  const c = mk(20, 12);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  R(0, 2, 7, 8, "#2f6fb8");
  R(13, 2, 7, 8, "#2f6fb8");
  R(0, 2, 7, 1, "#6ba7e0");
  R(13, 2, 7, 1, "#6ba7e0");
  for (let x = 2; x < 7; x += 2) R(x, 2, 1, 8, "#1d4a80");
  for (let x = 15; x < 20; x += 2) R(x, 2, 1, 8, "#1d4a80");
  R(7, 4, 6, 5, "#b9ad93");
  R(7, 4, 6, 1, "#efe6d2");
  R(9, 0, 2, 4, "#6b6256");
  return outlineCanvas(c);
}

export default function Shooter({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    const ship = { x: W / 2, y: H - 60 };
    let lives = 3;
    api.setLives(lives);
    let invuln = 0;
    let shield = false;
    let doubleT = 0;
    let fireT = 0;
    let spawnT = 0.6;
    let time = 0;
    let shots = 0;
    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let powers: Power[] = [];
    let parts: Part[] = [];
    const shipImg = shipSprite();
    const satImg = satSprite();
    const meteors = [meteorSprite(14, 1), meteorSprite(18, 2), meteorSprite(22, 3)];
    const stars = Array.from({ length: 50 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, z: 1 + (i % 3) }));
    let dragging = false;
    let dsx = 0;
    let dsy = 0;
    let shipSx = 0;
    let shipSy = 0;

    const burst = (x: number, y: number, n: number, colors: string[], speed = 90) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = Math.random() * speed + 20;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0.35 + Math.random() * 0.3,
          c: colors[Math.floor(Math.random() * colors.length)],
          s: 2 + Math.floor(Math.random() * 3),
        });
      }
    };

    const spawn = () => {
      const d = Math.min(1, api.elapsed.current / api.duration);
      const roll = Math.random();
      const speed = 38 + d * 50 + Math.random() * 18;
      if (roll < 0.14 + d * 0.14) {
        enemies.push({ kind: "big", x: 24 + Math.random() * (W - 48), y: -24, vx: (Math.random() - 0.5) * 24, vy: speed * 0.65, hp: 4, r: 13, sc: 2.2, score: 30, flash: 0, phase: 0, flip: Math.random() < 0.5 });
      } else if (roll < 0.3 + d * 0.2) {
        enemies.push({ kind: "sat", x: 24 + Math.random() * (W - 48), y: -12, vx: 0, vy: speed * 0.8, hp: 2, r: 9, sc: 1.5, score: 25, flash: 0, phase: Math.random() * 6, flip: false });
      } else {
        enemies.push({ kind: "rock", x: 12 + Math.random() * (W - 24), y: -10, vx: (Math.random() - 0.5) * 36, vy: speed, hp: 1, r: 7, sc: 1.2, score: 10, flash: 0, phase: 0, flip: Math.random() < 0.5 });
      }
    };

    const hurt = () => {
      if (invuln > 0) return;
      if (shield) {
        shield = false;
        invuln = 1;
        sfx("hit");
        burst(ship.x, ship.y, 10, ["#7fd6e8", "#ffffff"]);
        return;
      }
      lives--;
      api.setLives(lives);
      sfx("hit");
      burst(ship.x, ship.y, 18, ["#ef8f3a", "#fbd54a", "#ffffff", "#d9453b"], 130);
      if (lives <= 0) {
        api.finish("dead");
        return;
      }
      invuln = 1.8;
    };

    const update = (dt: number) => {
      time += dt;
      if (invuln > 0) invuln -= dt;
      if (doubleT > 0) doubleT -= dt;
      const d = Math.min(1, api.elapsed.current / api.duration);

      // keyboard
      const spd = 130;
      if (keys.has("arrowleft") || keys.has("a")) ship.x -= spd * dt;
      if (keys.has("arrowright") || keys.has("d")) ship.x += spd * dt;
      if (keys.has("arrowup") || keys.has("w")) ship.y -= spd * dt;
      if (keys.has("arrowdown") || keys.has("s")) ship.y += spd * dt;
      ship.x = Math.max(14, Math.min(W - 14, ship.x));
      ship.y = Math.max(40, Math.min(H - 20, ship.y));

      // auto fire
      fireT -= dt;
      if (fireT <= 0) {
        fireT = doubleT > 0 ? 0.15 : 0.22;
        if (doubleT > 0) {
          bullets.push({ x: ship.x - 6, y: ship.y - 12, vx: -12, vy: -260 }, { x: ship.x + 6, y: ship.y - 12, vx: 12, vy: -260 });
        } else bullets.push({ x: ship.x, y: ship.y - 14, vx: 0, vy: -270 });
        if (shots++ % 2 === 0) sfx("shoot");
      }

      // spawn
      spawnT -= dt;
      if (spawnT <= 0) {
        spawn();
        spawnT = Math.max(0.34, 1.0 - d * 0.62) * (0.7 + Math.random() * 0.6);
      }

      bullets.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      });
      bullets = bullets.filter((b) => b.y > -10);

      for (const e of enemies) {
        e.phase += dt * 3;
        e.y += e.vy * dt;
        e.x += (e.kind === "sat" ? Math.sin(e.phase) * 38 : e.vx) * dt;
        if (e.flash > 0) e.flash -= dt;
        if (e.x < 8 || e.x > W - 8) e.vx = -e.vx;
        // bullets
        for (const b of bullets) {
          if (b.y < -50) continue;
          if (Math.abs(b.x - e.x) < e.r + 2 && Math.abs(b.y - e.y) < e.r + 4) {
            b.y = -999;
            e.hp--;
            e.flash = 0.08;
            if (e.hp <= 0) {
              api.addScore(e.score);
              sfx("boom");
              burst(e.x, e.y, e.kind === "big" ? 16 : 9, ["#b9b4a8", "#6f6a6f", "#fbd54a", "#ef8f3a"]);
              if (Math.random() < (e.kind === "rock" ? 0.06 : 0.16)) {
                const r = Math.random();
                powers.push({ x: e.x, y: e.y, kind: r < 0.45 ? "double" : r < 0.8 ? "shield" : "heart" });
              }
              e.y = 9999;
              break;
            }
          }
        }
        // ship collision
        if (e.y < 9000 && Math.hypot(e.x - ship.x, e.y - ship.y) < e.r + 5) {
          hurt();
          e.hp = 0;
          burst(e.x, e.y, 8, ["#b9b4a8", "#6f6a6f"]);
          e.y = 9999;
        }
      }
      bullets = bullets.filter((b) => b.y > -50);
      // junk that reaches the bottom damages the station: you cannot idle safely
      for (const e of enemies) {
        if (e.y > H + 10 && e.y < 9000 && e.hp > 0) {
          e.hp = 0;
          hurt();
        }
      }
      enemies = enemies.filter((e) => e.y < H + 30);

      for (const p of powers) {
        p.y += 42 * dt;
        if (Math.hypot(p.x - ship.x, p.y - ship.y) < 14) {
          p.y = 9999;
          sfx("coin");
          api.addScore(15);
          if (p.kind === "double") doubleT = 9;
          else if (p.kind === "shield") shield = true;
          else if (lives < 3) {
            lives++;
            api.setLives(lives);
          }
        }
      }
      powers = powers.filter((p) => p.y < H + 10);

      parts.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      });
      parts = parts.filter((p) => p.life > 0);
      stars.forEach((s) => {
        s.y += s.z * 14 * dt;
        if (s.y > H) {
          s.y = 0;
          s.x = Math.random() * W;
        }
      });
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0a0a18");
      g.addColorStop(0.55, "#141231");
      g.addColorStop(1, "#1d1a40");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        ctx.fillStyle = s.z === 3 ? "#ffffff" : s.z === 2 ? "#b9b4d8" : "#6a66a8";
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.z === 3 ? 2 : 1, s.z === 3 ? 2 : 1);
      }
      // distant pixel planet
      {
        const cx = 190;
        const cy = 90 + Math.round(Math.sin(time * 0.3) * 2);
        const rr = 26;
        for (let y = -rr; y <= rr; y++) {
          const hw = Math.floor(Math.sqrt(rr * rr - y * y));
          ctx.fillStyle = y < -8 ? "#4b4790" : y < 8 ? "#3a3670" : "#2a2758";
          ctx.fillRect(cx - hw, cy + y, hw * 2, 1);
        }
        ctx.fillStyle = "#5a56a0";
        ctx.fillRect(cx - 12, cy - 10, 8, 2);
        ctx.fillRect(cx + 2, cy + 6, 10, 2);
        ctx.fillStyle = "#6a66b8";
        ctx.fillRect(cx - 34, cy + 2, 68, 2);
      }

      // power-ups
      for (const p of powers) {
        const bob = Math.sin(time * 6 + p.x) * 2;
        const icon = iconCanvas(p.kind === "double" ? "star" : p.kind === "shield" ? "shield" : "heart");
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(Math.round(p.x - 9), Math.round(p.y - 9 + bob), 18, 18);
        ctx.drawImage(icon, Math.round(p.x - icon.width), Math.round(p.y - icon.height + bob), icon.width * 2, icon.height * 2);
      }

      // enemies
      for (const e of enemies) {
        const spr = e.kind === "sat" ? satImg : e.kind === "big" ? meteors[2] : meteors[e.flip ? 1 : 0];
        const w = spr.width;
        const h = spr.height;
        ctx.save();
        ctx.translate(Math.round(e.x), Math.round(e.y));
        if (e.kind !== "sat") ctx.rotate(e.phase * 0.25);
        else if (e.flip) ctx.scale(-1, 1);
        ctx.drawImage(spr, -w / 2, -h / 2);
        ctx.restore();
        if (e.flash > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillRect(Math.round(e.x - w / 2 + 2), Math.round(e.y - h / 2 + 2), w - 4, h - 4);
        }
      }

      // bullets
      for (const b of bullets) {
        const x = Math.round(b.x);
        const y = Math.round(b.y);
        ctx.fillStyle = "rgba(93,224,216,0.25)";
        ctx.fillRect(x - 3, y - 8, 6, 14);
        ctx.fillStyle = "#2aa8a0";
        ctx.fillRect(x - 2, y - 7, 4, 12);
        ctx.fillStyle = "#7df0e8";
        ctx.fillRect(x - 1, y - 7, 2, 12);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 1, y - 7, 2, 3);
      }

      // ship
      if (invuln <= 0 || Math.floor(time * 14) % 2 === 0) {
        const sx = Math.round(ship.x);
        const sy = Math.round(ship.y);
        // twin cyan exhaust flames
        const fl = Math.floor(time * 22) % 2 ? 7 : 11;
        for (const dx of [-4, 2]) {
          ctx.fillStyle = "rgba(93,224,216,0.35)";
          ctx.fillRect(sx + dx - 1, sy + 12, 4, fl + 2);
          ctx.fillStyle = "#2aa8a0";
          ctx.fillRect(sx + dx, sy + 12, 2, fl);
          ctx.fillStyle = "#bdf6f1";
          ctx.fillRect(sx + dx, sy + 12, 2, Math.max(2, fl - 5));
        }
        ctx.drawImage(shipImg, sx - shipImg.width / 2, sy - shipImg.height / 2);
        if (shield) {
          const r = 21 + Math.sin(time * 6) * 1.5;
          ctx.fillStyle = "rgba(93,224,216,0.16)";
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(125,240,232,0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, r, Math.PI * 1.1, Math.PI * 1.45);
          ctx.stroke();
        }
      }

      for (const p of parts) {
        ctx.globalAlpha = Math.min(1, p.life * 3);
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      ctx.globalAlpha = 1;

      if (doubleT > 0) {
        const ic = iconCanvas("star");
        ctx.drawImage(ic, 4, 4);
        ctx.fillStyle = "#fbd54a";
        ctx.font = "16px VT323, monospace";
        ctx.textBaseline = "top";
        ctx.fillText(`${doubleT.toFixed(0)}s`, 18, 3);
      }
    };

    return {
      update,
      draw,
      down: (x, y) => {
        dragging = true;
        dsx = x;
        dsy = y;
        shipSx = ship.x;
        shipSy = ship.y;
      },
      move: (x, y) => {
        if (!dragging) return;
        ship.x = Math.max(14, Math.min(W - 14, shipSx + (x - dsx) * 1.15));
        ship.y = Math.max(40, Math.min(H - 20, shipSy + (y - dsy) * 1.15));
      },
      up: () => {
        dragging = false;
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
