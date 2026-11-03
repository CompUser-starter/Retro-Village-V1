// "Alma Yağışı" (Apple Rain) – move the basket, catch ripe apples, dodge rocks and worms.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { iconCanvas, mk, outlineCanvas } from "../game/sprites";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const GROUND = 322;
const BASKET_W = 34;

type Kind = "apple" | "gold" | "rock" | "worm";
interface Item {
  x: number;
  y: number;
  kind: Kind;
  vx: number;
  vy: number;
  rot: number;
}

/** Woven wicker basket, exactly as wide as the catch area. */
function basketSprite(w: number): HTMLCanvasElement {
  const h = Math.round(w * 0.62);
  const c = mk(w, h);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, ww: number, hh: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, ww, hh);
  };
  // rim
  R(0, 0, w, 5, "#8a5a2a");
  R(1, 1, w - 2, 2, "#c08a46");
  // body tapers slightly toward the base
  for (let y = 5; y < h; y++) {
    const inset = Math.round(((y - 5) / (h - 5)) * (w * 0.12));
    R(inset, y, w - inset * 2, 1, (y - 5) % 4 < 2 ? "#a86f33" : "#96602b");
  }
  // weave: vertical stakes + horizontal bands
  for (let x = 3; x < w - 3; x += 6) R(x, 6, 2, h - 7, "#7d4f24");
  for (let y = 9; y < h - 2; y += 6) R(2, y, w - 4, 1, "#c08a46");
  // dark base and a highlight on the rim
  R(Math.round(w * 0.1), h - 2, Math.round(w * 0.8), 2, "#6b4320");
  R(2, 1, Math.round(w * 0.35), 1, "#e0b06a");
  return outlineCanvas(c);
}

export default function Apples({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    const basket = { x: W / 2, y: GROUND - 12 };
    let items: Item[] = [];
    let lives = 3;
    api.setLives(lives);
    let spawnT = 0.7;
    let time = 0;
    let combo = 0;
    let comboT = 0;
    let msg = "";
    let msgT = 0;
    let flash = 0;
    let dead = false;
    let dragging = false;
    let dragBase = 0;

    const appleImg = iconCanvas("apple");
    const basketImg = basketSprite(BASKET_W);
    const starImg = iconCanvas("star");
    const rockImg = iconCanvas("rock");
    const wormImg = iconCanvas("caterpillar");

    const speed = () => 52 + Math.min(70, api.elapsed.current * 1.1);

    const spawn = () => {
      const d = Math.min(1, api.elapsed.current / api.duration);
      const r = Math.random();
      let kind: Kind = "apple";
      if (r < 0.09 + d * 0.06) kind = "gold";
      else if (r < 0.24 + d * 0.1) kind = "rock";
      else if (r < 0.33 + d * 0.08) kind = "worm";
      items.push({
        x: 12 + Math.random() * (W - 24),
        y: -14,
        kind,
        vx: (Math.random() - 0.5) * 18,
        vy: speed() * (0.85 + Math.random() * 0.3),
        rot: 0,
      });
    };

    const say = (text: string, t = 0.8) => {
      msg = text;
      msgT = t;
    };

    const update = (dt: number) => {
      if (dead) return;
      time += dt;
      if (msgT > 0) msgT -= dt;
      if (flash > 0) flash -= dt;
      if (comboT > 0) comboT -= dt;
      else if (comboT <= 0) combo = 0;

      // movement
      const spd = 210;
      if (keys.has("arrowleft") || keys.has("a")) {
        basket.x -= spd * dt;
        dragging = false;
      }
      if (keys.has("arrowright") || keys.has("d")) {
        basket.x += spd * dt;
        dragging = false;
      }
      basket.x = Math.max(BASKET_W / 2, Math.min(W - BASKET_W / 2, basket.x));

      spawnT -= dt;
      if (spawnT <= 0) {
        spawn();
        spawnT = Math.max(0.34, 0.78 - Math.min(1, api.elapsed.current / 70) * 0.36) * (0.8 + Math.random() * 0.5);
      }

      for (const it of items) {
        it.vy += 26 * dt;
        it.y += it.vy * dt;
        it.x += it.vx * dt;
        it.rot += dt * 2;
        if (it.x < 10) {
          it.x = 10;
          it.vx = Math.abs(it.vx);
        }
        if (it.x > W - 10) {
          it.x = W - 10;
          it.vx = -Math.abs(it.vx);
        }
        // catch
        if (it.y > basket.y - 12 && it.y < basket.y + 10 && Math.abs(it.x - basket.x) < BASKET_W / 2) {
          it.y = 9999;
          if (it.kind === "apple") {
            combo++;
            comboT = 1.6;
            const gain = 10 + Math.min(20, combo * 2);
            api.addScore(gain);
            sfx("gem");
          } else if (it.kind === "gold") {
            combo++;
            comboT = 2.2;
            api.addScore(50);
            sfx("coin");
            say("Qızıl alma! +50");
          } else {
            combo = 0;
            lives--;
            api.setLives(lives);
            flash = 0.3;
            sfx("hit");
            if (lives <= 0) {
              dead = true;
              api.finish("dead");
              return;
            }
          }
        }
        // missed
        if (it.y > GROUND + 10 && it.kind === "apple" && Math.random() < 0.02) {
          combo = 0;
        }
      }
      items = items.filter((it) => it.y < GROUND + 30);
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      // paint every pixel each frame, otherwise falling items leave trails
      ctx.fillStyle = "#63b343";
      ctx.fillRect(0, 0, W, H);
      // sky
      const g = ctx.createLinearGradient(0, 0, 0, 150);
      g.addColorStop(0, "#7fd6e8");
      g.addColorStop(1, "#d8f0f5");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 150);
      // sun
      ctx.fillStyle = "#fbd54a";
      ctx.fillRect(206, 12, 18, 18);
      ctx.fillStyle = "#fff6c8";
      ctx.fillRect(209, 15, 12, 12);
      // clouds
      for (const [cx0, cy0, cs] of [
        [16, 26, 1],
        [140, 44, 0.7],
      ] as [number, number, number][]) {
        const cx = (cx0 + time * 6 * cs) % (W + 60) - 40;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(cx, cy0, 24 * cs, 6);
        ctx.fillRect(cx + 5, cy0 - 5, 14 * cs, 6);
      }
      // orchard tree hanging into the top of the screen
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(104, 0, 11, 40);
      ctx.fillStyle = "#43301f";
      ctx.fillRect(104, 0, 4, 40);
      for (let y = 0; y < 34; y++) {
        const k = y / 34;
        const half = Math.round(78 * Math.sqrt(Math.max(0, 1 - k * k)));
        if (half <= 0) continue;
        ctx.fillStyle = y < 8 ? "#2f6b34" : y < 20 ? "#3e8948" : "#4a9a3e";
        ctx.fillRect(110 - half, y, half * 2, 1);
      }
      ctx.fillStyle = "#6abe30";
      for (const [lx, ly, lw] of [[62, 6, 16], [140, 10, 14], [98, 2, 12], [78, 22, 11]] as [number, number, number][])
        ctx.fillRect(lx, ly, lw, 5);
      ctx.fillStyle = "#2f6b34";
      ctx.fillRect(44, 28, 132, 4);
      // apples hanging in the tree
      for (const [ax, ay] of [[74, 22], [118, 26], [152, 20], [96, 28]] as [number, number][]) {
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(ax, ay, 5, 5);
        ctx.fillStyle = "#ef6a5f";
        ctx.fillRect(ax, ay, 5, 2);
      }
      // rolling hills behind the orchard
      ctx.fillStyle = "#7cc24f";
      for (let x = 0; x < W; x += 2) ctx.fillRect(x, 150 + Math.sin(x / 40) * 7, 2, 40);
      ctx.fillStyle = "#68ae43";
      for (let x = 0; x < W; x += 2) ctx.fillRect(x, 172 + Math.sin(x / 26 + 2) * 5, 2, 40);
      // distant orchard row
      for (let i = 0; i < 7; i++) {
        const tx = 10 + i * 36;
        const ty = 168 + Math.sin(tx / 26 + 2) * 5;
        ctx.fillStyle = "#4f7d33";
        ctx.fillRect(tx + 5, ty, 3, 10);
        ctx.fillStyle = "#59993d";
        ctx.fillRect(tx, ty - 9, 14, 11);
      }
      // grass field
      ctx.fillStyle = "#63b343";
      ctx.fillRect(0, GROUND - 26, W, H - GROUND + 26);
      ctx.fillStyle = "#7fcf3a";
      ctx.fillRect(0, GROUND - 26, W, 3);
      for (let i = 0; i < 50; i++) {
        const gx = (i * 37) % W;
        const gy = GROUND - 18 + ((i * 53) % 40);
        ctx.fillStyle = "#5fae3f";
        ctx.fillRect(gx, gy, 1, 4);
      }
      // fence
      ctx.fillStyle = "#7d5632";
      for (let x = 6; x < W; x += 22) ctx.fillRect(x, GROUND - 36, 3, 12);
      ctx.fillRect(0, GROUND - 32, W, 2);

      // falling items
      for (const it of items) {
        if (it.kind === "apple") {
          ctx.drawImage(appleImg, Math.round(it.x - 4), Math.round(it.y - 5));
        } else if (it.kind === "gold") {
          ctx.drawImage(starImg, Math.round(it.x - 5), Math.round(it.y - 5));
        } else if (it.kind === "rock") {
          ctx.drawImage(rockImg, Math.round(it.x - 5), Math.round(it.y - 4));
        } else {
          ctx.save();
          ctx.translate(Math.round(it.x), Math.round(it.y));
          ctx.rotate(Math.sin(it.rot) * 0.4);
          ctx.drawImage(wormImg, -6, -3, 12, 6);
          ctx.restore();
        }
      }

      // basket
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(Math.round(basket.x - BASKET_W / 2), GROUND + 2, BASKET_W, 4);
      ctx.drawImage(basketImg, Math.round(basket.x - basketImg.width / 2), Math.round(basket.y - basketImg.height + 8));

      if (flash > 0) {
        ctx.fillStyle = `rgba(217,69,59,${flash * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      ctx.font = "18px VT323, monospace";
      ctx.textBaseline = "top";
      for (let i = 0; i < lives; i++) {
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(8 + i * 16, 6, 11, 9);
        ctx.fillRect(10 + i * 16, 4, 7, 9);
        ctx.fillStyle = "#f6f1e4";
        ctx.fillRect(11 + i * 16, 7, 2, 2);
      }
      if (combo > 1) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#14122a";
        ctx.fillText(`x${combo}`, W / 2 + 1, 5);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(`x${combo}`, W / 2, 4);
        ctx.textAlign = "left";
      }
      if (msgT > 0) {
        ctx.font = "24px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#14122a";
        ctx.fillText(msg, W / 2 + 1, 60);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(msg, W / 2, 59);
        ctx.textAlign = "left";
      }
      ctx.textBaseline = "alphabetic";
    };

    return {
      update,
      draw,
      down: (x) => {
        dragging = true;
        dragBase = basket.x - x;
      },
      move: (x) => {
        if (!dragging) return;
        basket.x = Math.max(BASKET_W / 2, Math.min(W - BASKET_W / 2, x + dragBase));
      },
      up: () => {
        dragging = false;
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
