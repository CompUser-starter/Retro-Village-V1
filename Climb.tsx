// "Kristal Qalxışı" (Crystal Climb) – bounce your way up the cave shaft. Drag to steer.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { charSprite, iconCanvas, playerLook } from "../game/sprites";
import { caveBackdrop } from "../game/assets";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const GRAV = 760;
const BOUNCE = -300;

type Kind = "solid" | "crumble" | "spike";
interface Plat {
  x: number;
  y: number;
  w: number;
  kind: Kind;
  used: boolean;
  vx: number;
}
interface Gem {
  x: number;
  y: number;
  got: boolean;
}
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
}

export default function Climb({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    let lives = 3;
    api.setLives(lives);
    const pl = { x: W / 2, y: 0, vy: BOUNCE };
    let camY = 0;
    let top = 0;
    let target: number | null = null;
    let invuln = 0;
    let time = 0;
    let gems = 0;
    let plats: Plat[] = [];
    let jewel: Gem[] = [];
    let parts: Part[] = [];
    let flash = 0;
    let msg = "";
    let msgT = 0;
    let dead = false;
    let pushed = 0;
    const look = playerLook();

    const burst = (x: number, y: number, cols: string[]) => {
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 80;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3 + Math.random() * 0.25, c: cols[i % cols.length] });
      }
    };

    const addPlat = (y: number) => {
      const d = Math.min(1, api.elapsed.current / api.duration);
      const w = 54 - Math.floor(Math.random() * (10 + d * 14));
      const x = 10 + Math.random() * (W - 20 - w);
      const r = Math.random();
      let kind: Kind = "solid";
      if (r < 0.16 + d * 0.12) kind = "crumble";
      else if (r < 0.28 + d * 0.16) kind = "spike";
      plats.push({ x, y, w, kind, used: false, vx: Math.random() < 0.18 ? (Math.random() < 0.5 ? -28 : 28) : 0 });
      if (Math.random() < 0.45) jewel.push({ x: x + w / 2, y: y - 26, got: false });
    };

    const buildStart = () => {
      plats = [];
      jewel = [];
      pl.x = W / 2;
      pl.y = 0;
      pl.vy = BOUNCE;
      camY = 0;
      top = 0;
      // wide platform directly under the player, so the very first landing is always safe
      plats.push({ x: W / 2 - 34, y: 40, w: 68, kind: "solid", used: false, vx: 0 });
      for (let y = 92; y < 2000; y += 46 + Math.random() * 14) addPlat(y);
    };
    buildStart();

    const hurt = () => {
      if (invuln > 0) return;
      lives--;
      api.setLives(lives);
      sfx("hit");
      flash = 0.3;
      burst(pl.x, pl.y, ["#d9453b", "#ef8f3a", "#ffffff"]);
      if (lives <= 0) {
        dead = true;
        api.finish("dead");
        return;
      }
      invuln = 1.5;
      msg = "✖";
      msgT = 0.7;
      pl.vy = BOUNCE;
    };

    const update = (dt: number) => {
      if (dead) return;
      time += dt;
      if (invuln > 0) invuln -= dt;
      if (flash > 0) flash -= dt;
      if (msgT > 0) msgT -= dt;

      // horizontal control
      const spd = 168;
      if (keys.has("arrowleft") || keys.has("a")) {
        pl.x -= spd * dt;
        target = null;
      }
      if (keys.has("arrowright") || keys.has("d")) {
        pl.x += spd * dt;
        target = null;
      }
      if (target !== null) {
        const dx = target - pl.x;
        const mv = Math.min(Math.abs(dx), spd * dt);
        pl.x += Math.sign(dx) * mv;
      }
      pl.x = Math.max(10, Math.min(W - 10, pl.x));

      pl.vy += GRAV * dt;
      const prevY = pl.y;
      pl.y += pl.vy * dt;

      // platform collision (only while falling)
      if (pl.vy > 0) {
        for (const p of plats) {
          if (pl.x + 5 < p.x || pl.x - 5 > p.x + p.w) continue;
          if (prevY <= p.y + 1 && pl.y >= p.y) {
            pl.y = p.y;
            if (p.kind === "spike") {
              hurt();
              pl.vy = BOUNCE * 0.9;
            } else {
              pl.vy = BOUNCE;
              sfx("jump");
              burst(pl.x, pl.y, ["#b9b4a8", "#6f6a6f"]);
              if (p.kind === "crumble") p.used = true;
            }
            break;
          }
        }
      }

      // camera only climbs
      if (pl.y < top) top = pl.y;
      if (pl.y - 130 < camY) camY = pl.y - 130;
      // score = climbed height + gems (pushed as a delta so the HUD stays in sync)
      const total = Math.floor(Math.max(0, -top) / 8) + gems * 15;
      if (total > pushed) {
        api.addScore(total - pushed);
        pushed = total;
      }
      // gems
      for (const g of jewel) {
        if (g.got) continue;
        if (Math.abs(g.x - pl.x) < 11 && Math.abs(g.y - pl.y + 8) < 14) {
          g.got = true;
          gems++;
          sfx("gem");
          burst(g.x, g.y, ["#7fd6e8", "#ffffff"]);
          msg = "+15";
          msgT = 0.5;
        }
      }

      // fell off the bottom
      if (pl.y > camY + H + 24) {
        lives--;
        api.setLives(lives);
        sfx("hit");
        flash = 0.35;
        if (lives <= 0) {
          dead = true;
          api.finish("dead");
          return;
        }
        invuln = 1.2;
        msg = "✖";
        msgT = 0.7;
        // respawn on a safe platform below the camera; if there is none, make one
        const cands = plats
          .filter((p) => p.kind !== "spike" && !p.used && p.y > camY + 60 && p.y < camY + H - 20)
          .sort((a, b) => a.y - b.y);
        let p = cands[0];
        if (!p) {
          p = { x: W / 2 - 34, y: camY + 150, w: 68, kind: "solid", used: false, vx: 0 };
          plats.push(p);
        }
        pl.x = p.x + p.w / 2;
        pl.y = p.y;
        pl.vy = BOUNCE;
      }

      // moving platforms
      for (const p of plats) {
        if (!p.vx) continue;
        p.x += p.vx * dt;
        if (p.x < 6 || p.x + p.w > W - 6) p.vx = -p.vx;
      }

      // generate ahead / clean behind
      let lowest = Math.min(...plats.map((p) => p.y));
      while (lowest > camY - 500) {
        addPlat(lowest - (52 + Math.random() * 18));
        lowest -= 52 + Math.random() * 18;
      }
      const cut = camY + H + 60;
      plats = plats.filter((p) => p.y < cut && !(p.kind === "crumble" && p.used && p.y > camY + H));
      jewel = jewel.filter((g) => !g.got && g.y < cut);

      parts.forEach((q) => {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 300 * dt;
        q.life -= dt;
      });
      parts = parts.filter((q) => q.life > 0);
    };

    const draw = () => {
      const cam = camY;
      ctx.imageSmoothingEnabled = false;
      const backdrop = caveBackdrop(W, H, 0.25);
      if (backdrop) ctx.drawImage(backdrop, 0, 0);
      else {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#14122a");
        g.addColorStop(1, "#2c2958");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // shaft walls
      for (let y = 0; y < H; y += 4) {
        const wy = cam + y;
        const l = 6 + Math.round(Math.sin(wy / 26) * 4);
        const r = 6 + Math.round(Math.cos(wy / 31) * 4);
        ctx.fillStyle = backdrop ? "#2a2833" : "#3a3670";
        ctx.fillRect(0, y, l, 4);
        ctx.fillRect(W - r, y, r, 4);
        ctx.fillStyle = "#1b1a2e";
        ctx.fillRect(0, y, 1, 4);
        ctx.fillRect(W - 1, y, 1, 4);
      }

      // crystals in the background
      for (let i = 0; i < (backdrop ? 0 : 14); i++) {
        const wy = -(((-cam * 0.5 + i * 137) % 1400) - 200);
        const x = 20 + ((i * 71) % (W - 40));
        ctx.fillStyle = ["#7fd6e8", "#b86fc6", "#f48fb1"][i % 3];
        ctx.globalAlpha = 0.35 + Math.sin(time * 2 + i) * 0.15;
        ctx.fillRect(x, ((wy % H) + H) % H, 3, 5);
        ctx.globalAlpha = 1;
      }

      const sy = (y: number) => Math.round(y - cam);

      // gems
      for (const gm of jewel) {
        if (gm.got) continue;
        const y = sy(gm.y);
        if (y < -20 || y > H + 20) continue;
        const ic = iconCanvas("gem");
        const bob = Math.round(Math.sin(time * 5 + gm.x) * 2);
        ctx.drawImage(ic, Math.round(gm.x - ic.width / 2), y - ic.height / 2 + bob);
      }

      // platforms
      for (const p of plats) {
        const y = sy(p.y);
        if (y < -20 || y > H + 20) continue;
        if (p.kind === "spike") {
          // dark stone ledge bristling with sharp rocks
          ctx.fillStyle = "#15131c";
          ctx.fillRect(Math.round(p.x) - 1, y + 3, p.w + 2, 8);
          ctx.fillStyle = "#3a3747";
          ctx.fillRect(Math.round(p.x), y + 4, p.w, 6);
          for (let i = 0; i < p.w / 8; i++) {
            const bx = Math.round(p.x) + i * 8;
            ctx.fillStyle = "#6e6a7d";
            ctx.fillRect(bx + 2, y + 1, 4, 4);
            ctx.fillRect(bx + 3, y - 1, 2, 3);
            ctx.fillStyle = "#938fa6";
            ctx.fillRect(bx + 3, y - 1, 1, 4);
          }
        } else {
          // carved stone ledge; crumbling ones are cracked and sandy
          const crumble = p.kind === "crumble";
          const body = crumble ? (p.used ? "#4a4038" : "#6d6050") : "#4f4b5e";
          const top = crumble ? (p.used ? "#6b5e50" : "#8e8068") : "#767188";
          ctx.fillStyle = "#15131c";
          ctx.fillRect(Math.round(p.x) - 1, y - 1, p.w + 2, 12);
          ctx.fillStyle = body;
          ctx.fillRect(Math.round(p.x), y, p.w, 10);
          ctx.fillStyle = top;
          ctx.fillRect(Math.round(p.x), y, p.w, 3);
          ctx.fillStyle = "#2c2938";
          for (let bx = Math.round(p.x) + 7; bx < p.x + p.w - 3; bx += 11) ctx.fillRect(bx, y + 4, 1, 6);
          ctx.fillRect(Math.round(p.x), y + 9, p.w, 1);
          if (crumble && !p.used) {
            ctx.fillStyle = "#a89478";
            ctx.fillRect(Math.round(p.x) + 3, y + 5, 5, 1);
            ctx.fillRect(Math.round(p.x) + p.w - 9, y + 6, 4, 1);
          }
        }
      }

      // player
      if (invuln <= 0 || Math.floor(time * 14) % 2 === 0) {
        const spr = charSprite(look, "right", pl.vy < -40 ? 3 : pl.vy > 120 ? 1 : 0);
        const py = sy(pl.y);
        if (pl.vy > 0) {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(Math.round(pl.x) - 5, py - 1, 10, 3);
        }
        ctx.drawImage(spr, Math.round(pl.x - spr.width / 2), py - spr.height + 2);
      }

      for (const q of parts) {
        ctx.globalAlpha = Math.min(1, q.life * 3);
        ctx.fillStyle = q.c;
        ctx.fillRect(Math.round(q.x), sy(q.y), 2, 2);
      }
      ctx.globalAlpha = 1;

      if (flash > 0) {
        ctx.fillStyle = `rgba(217,69,59,${flash})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.font = "16px VT323, monospace";
      ctx.fillStyle = "#fbd54a";
      ctx.textBaseline = "top";
      ctx.fillText(`♥ ${lives}   ↑ ${Math.floor(-top / 8)}m`, 8, 6);
      if (msgT > 0) {
        ctx.font = "26px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#1b1a2e";
        ctx.fillText(msg, W / 2 + 1, 30);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(msg, W / 2, 29);
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
