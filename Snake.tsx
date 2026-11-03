// "Yılan Balığı" (Eel Pond) – guide an eel around the pond floor, eat the shrimp.
// Smooth interpolated movement, swipe to steer.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { mk, outlineCanvas } from "../game/sprites";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const COLS = 15;
const ROWS = 15;
const CELL = 16;
const OY = 30;
const W = COLS * CELL;
const H = 320;

type Vec = [number, number];
const DIRS: Vec[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

function board(): HTMLCanvasElement {
  const c = mk(W, ROWS * CELL);
  const g = c.getContext("2d")!;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // sunlit pond floor, subtle checker so the grid stays readable
      g.fillStyle = (x + y) % 2 ? "#1d5159" : "#1f565f";
      g.fillRect(x * CELL, y * CELL, CELL, CELL);
      g.fillStyle = "rgba(255,255,255,0.03)";
      g.fillRect(x * CELL, y * CELL, CELL, 1);
      // sand patches, pebbles and little weeds
      if ((x * 5 + y * 3) % 11 === 0) {
        g.fillStyle = "#2f6b6b";
        g.fillRect(x * CELL + 3, y * CELL + 5, 9, 6);
        g.fillStyle = "#38787a";
        g.fillRect(x * CELL + 4, y * CELL + 5, 7, 2);
      } else if ((x * 7 + y * 4) % 13 === 0) {
        g.fillStyle = "#2b7a63";
        g.fillRect(x * CELL + 6, y * CELL + 8, 2, 5);
        g.fillRect(x * CELL + 9, y * CELL + 9, 2, 4);
        g.fillStyle = "#39a07f";
        g.fillRect(x * CELL + 6, y * CELL + 7, 2, 2);
      }
    }
  }
  // soft light rays drifting across the floor
  g.globalAlpha = 0.06;
  g.fillStyle = "#bdf0ff";
  for (let i = 0; i < 5; i++) {
    g.save();
    g.translate(i * 54 - 20, 0);
    g.rotate(0.22);
    g.fillRect(0, -40, 16, ROWS * CELL + 120);
    g.restore();
  }
  g.globalAlpha = 1;
  return c;
}

/** Curled shrimp – the food (reference image 7). */
function shrimpSprite(): HTMLCanvasElement {
  const c = mk(12, 12);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  R(3, 2, 6, 2, "#e8873c");
  R(2, 3, 2, 4, "#e8873c");
  R(3, 7, 5, 2, "#e8873c");
  R(7, 5, 3, 3, "#e8873c");
  R(4, 3, 4, 1, "#ffb06a");
  R(3, 4, 1, 3, "#ffb06a");
  R(8, 2, 2, 2, "#c96a1e");
  R(9, 8, 2, 2, "#c96a1e");
  R(5, 1, 1, 2, "#c96a1e");
  R(4, 5, 1, 1, "#2a1a10");
  return outlineCanvas(c);
}

/** Pond obstacles: rock, driftwood and seaweed. */
function obstacleSprites(): HTMLCanvasElement[] {
  const make = (draw: (g: CanvasRenderingContext2D) => void) => {
    const c = mk(14, 14);
    draw(c.getContext("2d")!);
    return outlineCanvas(c);
  };
  const rock = make((g) => {
    g.fillStyle = "#4a5560";
    g.fillRect(1, 5, 12, 8);
    g.fillStyle = "#5e6b78";
    g.fillRect(2, 3, 9, 5);
    g.fillStyle = "#73818f";
    g.fillRect(3, 3, 5, 2);
    g.fillStyle = "#39434d";
    g.fillRect(1, 11, 12, 2);
  });
  const wood = make((g) => {
    g.fillStyle = "#6b4a2a";
    g.fillRect(1, 6, 12, 5);
    g.fillStyle = "#8a6238";
    g.fillRect(1, 6, 12, 2);
    g.fillStyle = "#4d341c";
    g.fillRect(4, 8, 7, 1);
    g.fillStyle = "#6b4a2a";
    g.fillRect(8, 2, 3, 5);
    g.fillRect(2, 3, 3, 4);
  });
  const weed = make((g) => {
    g.fillStyle = "#2f8f63";
    g.fillRect(3, 4, 2, 9);
    g.fillRect(7, 2, 2, 11);
    g.fillRect(10, 6, 2, 7);
    g.fillStyle = "#44b67e";
    g.fillRect(3, 4, 1, 9);
    g.fillRect(7, 2, 1, 11);
    g.fillRect(10, 6, 1, 7);
  });
  return [rock, wood, weed];
}

export default function Snake({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    const bg = board();
    const shrimpImg = shrimpSprite();
    const obstacleImgs = obstacleSprites();
    let snake: Vec[] = [];
    let prev: Vec[] = [];
    let dir: Vec = DIRS[1];
    let want: Vec = DIRS[1];
    let food: Vec = [10, 7];
    let golden = false;
    let thorns: Vec[] = [];
    let fruits = 0;
    let lives = 3;
    api.setLives(lives);
    let acc = 0;
    let time = 0;
    let invuln = 0;
    let grew = 0;
    let flash = 0;
    let msg = "";
    let msgT = 0;
    let dead = false;
    // drifting bubbles
    const flies = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, p: i * 2.1, c: "#cdf2fa" }));

    const occupied = (x: number, y: number) => snake.some(([sx, sy]) => sx === x && sy === y) || thorns.some(([rx, ry]) => rx === x && ry === y);

    const placeFood = () => {
      let guard = 0;
      do {
        food = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
      } while (occupied(food[0], food[1]) && guard++ < 400);
      golden = fruits > 3 && Math.random() < 0.22;
    };

    const reset = (full: boolean) => {
      snake = [
        [7, 7],
        [6, 7],
        [5, 7],
      ];
      prev = snake.map((s) => [...s] as Vec);
      dir = DIRS[1];
      want = DIRS[1];
      grew = 0;
      acc = 0;
      invuln = 1.2;
      if (full) {
        thorns = [];
        fruits = 0;
        placeFood();
      }
    };
    reset(true);

    const speed = () => Math.min(11.5, 5.4 + fruits * 0.16);

    const loseLife = () => {
      lives--;
      api.setLives(lives);
      sfx("hit");
      flash = 0.3;
      if (lives <= 0) {
        dead = true;
        api.finish("dead");
        return;
      }
      msg = "✖";
      msgT = 0.7;
      reset(false);
    };

    const update = (dt: number) => {
      if (dead) return;
      time += dt;
      if (invuln > 0) invuln -= dt;
      if (flash > 0) flash -= dt;
      if (msgT > 0) msgT -= dt;
      flies.forEach((f) => {
        f.p += dt * 1.4;
        f.y -= (14 + (f.p % 3) * 6) * dt;
        if (f.y < -4) {
          f.y = H + 4;
          f.x = Math.random() * W;
        }
      });

      if (keys.has("arrowup") || keys.has("w")) want = DIRS[0];
      else if (keys.has("arrowright") || keys.has("d")) want = DIRS[1];
      else if (keys.has("arrowdown") || keys.has("s")) want = DIRS[2];
      else if (keys.has("arrowleft") || keys.has("a")) want = DIRS[3];

      acc += dt;
      const step = 1 / speed();
      while (acc >= step) {
        acc -= step;
        if (!(want[0] === -dir[0] && want[1] === -dir[1])) dir = want;
        const head: Vec = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
        const [hx, hy] = head;
        if (hx < 0 || hy < 0 || hx >= COLS || hy >= ROWS) {
          loseLife();
          return;
        }
        if (snake.some(([sx, sy], i) => i < snake.length - 1 && sx === hx && sy === hy)) {
          loseLife();
          return;
        }
        if (thorns.some(([rx, ry]) => rx === hx && ry === hy)) {
          loseLife();
          return;
        }
        prev = snake.map((s) => [...s] as Vec);
        snake.unshift(head);
        if (hx === food[0] && hy === food[1]) {
          fruits++;
          grew += 2;
          prev.push([...snake[snake.length - 1]] as Vec);
          api.addScore(golden ? 30 : 10);
          sfx("gem");
          msg = golden ? "+30" : "+10";
          msgT = 0.6;
          if (fruits % 4 === 0 && thorns.length < 9) {
            let guard = 0;
            let r: Vec = [0, 0];
            do {
              r = [1 + Math.floor(Math.random() * (COLS - 2)), 1 + Math.floor(Math.random() * (ROWS - 2))];
            } while ((occupied(r[0], r[1]) || Math.abs(r[0] - snake[0][0]) + Math.abs(r[1] - snake[0][1]) < 3) && guard++ < 200);
            thorns.push(r);
          }
          placeFood();
        }
        if (grew > 0) grew--;
        else snake.pop();
        while (prev.length < snake.length) prev.push([...snake[snake.length - 1]] as Vec);
        prev = prev.slice(0, snake.length);
      }
    };

    // interpolated caterpillar segment center (smooth glide between tiles)
    const segPos = (i: number, blend: number): [number, number] => {
      const cur = snake[i];
      const old = prev[i] ?? cur;
      const gx = old[0] + (cur[0] - old[0]) * blend;
      const gy = old[1] + (cur[1] - old[1]) * blend;
      return [gx * CELL + CELL / 2, OY + gy * CELL + CELL / 2];
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#17444d";
      ctx.fillRect(0, 0, W, H);
      // open water around the pen, with drifting caustics
      for (let i = 0; i < 26; i++) {
        const wx = (i * 53 + Math.sin(time * 0.6 + i) * 8) % W;
        const wy = (i * 97) % H;
        ctx.fillStyle = "rgba(170,230,240,0.07)";
        ctx.fillRect(Math.round(wx), Math.round(wy), 14, 2);
      }
      // weeds growing along the bottom
      for (let i = 0; i < 9; i++) {
        const bx = 6 + i * 27;
        const sway = Math.sin(time * 1.6 + i) * 2;
        ctx.fillStyle = i % 2 ? "#2b7a63" : "#246b58";
        ctx.fillRect(Math.round(bx + sway), H - 16, 3, 16);
        ctx.fillRect(Math.round(bx + 5 - sway), H - 11, 3, 11);
      }
      ctx.drawImage(bg, 0, OY);

      // stone kerb around the pen (reference image 7)
      const stone = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = "#3f4a52";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#6c7984";
        ctx.fillRect(x + 1, y + 1, w - 2, Math.max(1, h - 3));
        ctx.fillStyle = "#8794a0";
        ctx.fillRect(x + 1, y + 1, w - 2, 1);
      };
      for (let x = -6; x < W + 6; x += 12) {
        stone(x, OY - 8, 11, 8);
        stone(x + 6, OY + ROWS * CELL, 11, 8);
      }
      for (let y = OY - 8; y < OY + ROWS * CELL + 8; y += 12) {
        stone(0, y, 8, 11);
        stone(W - 8, y + 6, 8, 11);
      }

      // pond obstacles: rock, driftwood, seaweed
      for (const [rx, ry] of thorns) {
        const ic = obstacleImgs[(rx * 7 + ry * 3) % obstacleImgs.length];
        const sway = ic === obstacleImgs[2] ? Math.round(Math.sin(time * 2.4 + rx) * 1) : 0;
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(rx * CELL + 2, OY + ry * CELL + CELL - 4, CELL - 4, 3);
        ctx.drawImage(ic, rx * CELL + 8 - ic.width / 2 + sway, OY + ry * CELL + 8 - ic.height / 2);
      }

      // shrimp food (golden one sparkles and is worth more)
      {
        const bob = Math.round(Math.sin(time * 5) * 1.5);
        const fx = food[0] * CELL + 8;
        const fy = OY + food[1] * CELL + 8 + bob;
        ctx.fillStyle = golden ? "rgba(251,213,74,0.28)" : "rgba(232,135,60,0.2)";
        ctx.fillRect(food[0] * CELL + 2, OY + food[1] * CELL + 2, CELL - 4, CELL - 4);
        if (golden) {
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(Math.sin(time * 2) * 0.25);
          ctx.globalAlpha = 0.9;
          ctx.drawImage(shrimpImg, -shrimpImg.width / 2, -shrimpImg.height / 2);
          ctx.restore();
          for (let i = 0; i < 4; i++) {
            const a = time * 3 + (i * Math.PI) / 2;
            ctx.fillStyle = "#fff3bf";
            ctx.fillRect(Math.round(fx + Math.cos(a) * 7), Math.round(fy + Math.sin(a) * 7), 2, 2);
          }
        } else {
          ctx.drawImage(shrimpImg, fx - shrimpImg.width / 2, fy - shrimpImg.height / 2);
        }
      }

      // rising bubbles
      for (const f of flies) {
        const by = f.y;
        const sz = 2 + (Math.floor(f.p) % 2);
        ctx.fillStyle = "rgba(205,242,250,0.5)";
        ctx.fillRect(Math.round(f.x + Math.sin(time * 2 + f.p) * 3), Math.round(by), sz, sz);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillRect(Math.round(f.x + Math.sin(time * 2 + f.p) * 3), Math.round(by), 1, 1);
      }

      // eel body (tail first): overlapping rounded segments make a smooth tube
      const blend = Math.min(1, acc / (1 / speed()));
      const blink = Math.floor(time * 0.7) % 4 === 0;
      const len = snake.length;
      const disc = (x: number, y: number, r: number, col: string) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      };
      for (let i = len - 1; i >= 0; i--) {
        const [cx0, cy0] = segPos(i, blend);
        const t = i / Math.max(1, len - 1);
        const r = i === 0 ? 7.4 : Math.max(2.4, 6.6 - t * t * 4.4);
        const wob = Math.sin(time * 9 - i * 0.55) * (1 - t) * 1.1;
        const cx = cx0 + (dir[1] !== 0 ? wob : 0);
        const cy = cy0 + (dir[0] !== 0 ? wob : 0);
        disc(cx, cy + 1, r + 1.2, "rgba(0,0,0,0.18)"); // soft shadow
        disc(cx, cy, r + 1.2, "#10343a"); // dark outline
        disc(cx, cy, r, i % 2 ? "#2f9d84" : "#37b094");
        // pale belly along the lower / outer edge
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "rgba(226,246,230,0.8)";
        if (dir[0] !== 0) ctx.fillRect(cx - r, cy + r * 0.25, r * 2, r);
        else ctx.fillRect(cx - r, cy - r, r * 0.75, r * 2);
        ctx.restore();
        // glossy highlight
        disc(cx - r * 0.3, cy - r * 0.35, Math.max(1, r * 0.28), "rgba(205,255,240,0.6)");
      }
      // head details: eyes, mouth and a pair of small fins
      {
        const [cx, cy] = segPos(0, blend);
        const dx = dir[0];
        const dy = dir[1];
        const px = -dy;
        const py = dx;
        // side fins
        ctx.fillStyle = "rgba(226,246,230,0.55)";
        const fin = Math.sin(time * 12) * 1.5;
        ctx.fillRect(Math.round(cx + px * 6 - dx * 2 - 1), Math.round(cy + py * 6 - dy * 2 - 1 + fin), 3, 3);
        ctx.fillRect(Math.round(cx - px * 6 - dx * 2 - 1), Math.round(cy - py * 6 - dy * 2 - 1 - fin), 3, 3);
        const ex = cx + dx * 2;
        const ey = cy + dy * 2;
        if (blink && invuln <= 0) {
          ctx.fillStyle = "#123a3a";
          ctx.fillRect(Math.round(ex + px * 3 - 1), Math.round(ey + py * 3), 3, 1);
          ctx.fillRect(Math.round(ex - px * 3 - 1), Math.round(ey - py * 3), 3, 1);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(Math.round(ex + px * 3 - 1), Math.round(ey + py * 3 - 1), 3, 3);
          ctx.fillRect(Math.round(ex - px * 3 - 1), Math.round(ey - py * 3 - 1), 3, 3);
          ctx.fillStyle = "#0e2b2b";
          ctx.fillRect(Math.round(ex + px * 3 + dx), Math.round(ey + py * 3 + dy), 2, 2);
          ctx.fillRect(Math.round(ex - px * 3 + dx), Math.round(ey - py * 3 + dy), 2, 2);
        }
        // mouth line
        ctx.fillStyle = "#0e2b2b";
        ctx.fillRect(Math.round(cx + dx * 6 - (dy !== 0 ? 2 : 0)), Math.round(cy + dy * 6 - (dx !== 0 ? 2 : 0)), dy !== 0 ? 4 : 1, dx !== 0 ? 4 : 1);
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(217,69,59,${flash})`;
        ctx.fillRect(0, OY - 10, W, ROWS * CELL + 20);
      }
      if (invuln > 0 && Math.floor(time * 12) % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(0, OY - 10, W, ROWS * CELL + 20);
      }

      ctx.font = "16px VT323, monospace";
      ctx.fillStyle = "#fbd54a";
      ctx.textBaseline = "top";
      ctx.fillText(`♥ ${lives}   ★ ${Math.floor(api.score.current)}`, 8, 8);
      if (msgT > 0) {
        ctx.font = "30px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#1b1a2e";
        ctx.fillText(msg, W / 2 + 1, OY + 6 + 1);
        ctx.fillStyle = golden ? "#fbd54a" : "#ff9db1";
        ctx.fillText(msg, W / 2, OY + 6);
        ctx.textAlign = "left";
      }
      ctx.textBaseline = "alphabetic";
    };

    let sx = 0;
    let sy = 0;
    let touch = false;
    return {
      update,
      draw,
      down: (x, y) => {
        touch = true;
        sx = x;
        sy = y;
      },
      move: (x, y) => {
        if (!touch) return;
        const dx = x - sx;
        const dy = y - sy;
        if (Math.hypot(dx, dy) > 8) {
          const nd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS[1] : DIRS[3]) : dy > 0 ? DIRS[2] : DIRS[0];
          if (!(nd[0] === -dir[0] && nd[1] === -dir[1])) want = nd;
          sx = x;
          sy = y;
        }
      },
      up: () => {
        touch = false;
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
