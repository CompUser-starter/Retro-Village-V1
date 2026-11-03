// "Energy Maze" – collect energy shards, dodge patrol bots. Swipe/drag or arrow keys to turn.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { charSprite, mk, outlineCanvas, playerLook, type Dir } from "../game/sprites";
import { sfx } from "../game/audio";
import { t } from "../game/i18n";
import type { MiniApi } from "./types";

const TS = 16;
const CW = 7;
const CH = 10;
const GW = CW * 2 + 1; // 15
const GH = CH * 2 + 1; // 21
const W = GW * TS;
const H = GH * TS;

type Vec = [number, number];
const DIRS: Vec[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

interface Mover {
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  t: number;
  dir: Vec;
  speed: number;
}

const mover = (tx: number, ty: number, speed: number): Mover => ({ tx, ty, nx: tx, ny: ty, t: 0, dir: [0, 0], speed });
const posX = (m: Mover) => (m.tx + (m.nx - m.tx) * m.t) * TS + TS / 2;
const posY = (m: Mover) => (m.ty + (m.ny - m.ty) * m.t) * TS + TS / 2;

function advance(m: Mover, dt: number, choose: (m: Mover) => Vec | null) {
  let rem = m.speed * dt;
  let guard = 0;
  while (rem > 1e-6 && guard++ < 8) {
    if (m.nx === m.tx && m.ny === m.ty) {
      const d = choose(m);
      if (!d) return;
      m.nx = m.tx + d[0];
      m.ny = m.ty + d[1];
      m.t = 0;
      m.dir = d;
    }
    const step = Math.min(rem, 1 - m.t);
    m.t += step;
    rem -= step;
    if (m.t >= 1 - 1e-6) {
      m.tx = m.nx;
      m.ty = m.ny;
      m.t = 0;
    }
  }
}

function reverse(m: Mover) {
  const { tx, ty, nx, ny } = m;
  m.tx = nx;
  m.ty = ny;
  m.nx = tx;
  m.ny = ty;
  m.t = 1 - m.t;
  m.dir = [-m.dir[0], -m.dir[1]];
}

function genMaze(level: number): boolean[][] {
  const wall: boolean[][] = Array.from({ length: GH }, () => Array<boolean>(GW).fill(true));
  const seen: boolean[][] = Array.from({ length: CH }, () => Array<boolean>(CW).fill(false));
  const stack: Vec[] = [[0, CH - 1]];
  seen[CH - 1][0] = true;
  wall[CH * 2 - 1][1] = false;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const opts = DIRS.map(([dx, dy]) => [cx + dx, cy + dy, dx, dy] as number[]).filter(
      ([x, y]) => x >= 0 && y >= 0 && x < CW && y < CH && !seen[y][x]
    );
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [nx, ny, dx, dy] = opts[Math.floor(Math.random() * opts.length)];
    seen[ny][nx] = true;
    wall[ny * 2 + 1][nx * 2 + 1] = false;
    wall[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = false;
    stack.push([nx, ny]);
  }
  // braid: knock out some walls to create loops (fewer loops on higher levels = harder to dodge)
  let n = Math.max(8, 20 - level * 2);
  let guard = 0;
  while (n > 0 && guard++ < 400) {
    const x = 1 + Math.floor(Math.random() * (GW - 2));
    const y = 1 + Math.floor(Math.random() * (GH - 2));
    if (wall[y][x] && x % 2 !== y % 2) {
      wall[y][x] = false;
      n--;
    }
  }
  return wall;
}

function renderWalls(wall: boolean[][]): HTMLCanvasElement {
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const px = x * TS;
      const py = y * TS;
      if (wall[y][x]) {
        // dark stone blocks with mortar joints
        g.fillStyle = "#3b434c";
        g.fillRect(px, py, TS, TS);
        g.fillStyle = "#2a3137";
        g.fillRect(px, py + 7, TS, 1);
        g.fillRect(px, py + TS - 1, TS, 1);
        const off = (x + y) % 2 ? 8 : 0;
        g.fillRect(px + ((off + 8) % TS), py, 1, 7);
        g.fillRect(px + (off % TS), py + 8, 1, 7);
        g.fillStyle = "#4d5862";
        g.fillRect(px + 1, py + 1, TS - 2, 2);
        g.fillRect(px + 1, py + 9, TS - 2, 2);
        g.fillStyle = "#596773";
        g.fillRect(px + 2, py + 1, 4, 1);
        if ((x * 5 + y * 3) % 7 === 0) {
          g.fillStyle = "#333b43";
          g.fillRect(px + 4, py + 4, 3, 2);
        }
        if (!wall[y + 1]?.[x]) {
          g.fillStyle = "#20262c";
          g.fillRect(px, py + TS - 3, TS, 3);
        }
      } else {
        // flagstone floor
        g.fillStyle = (x + y) % 2 ? "#23292f" : "#262d33";
        g.fillRect(px, py, TS, TS);
        g.fillStyle = "#1b2126";
        g.fillRect(px, py, TS, 1);
        g.fillRect(px, py, 1, TS);
        if ((x * 7 + y * 3) % 5 === 0) {
          g.fillStyle = "#2d353c";
          g.fillRect(px + 5, py + 6, 4, 3);
        }
        if ((x * 3 + y * 11) % 9 === 0) {
          g.fillStyle = "#2c3a2f";
          g.fillRect(px + 2, py + 11, 5, 2);
        }
      }
    }
  }
  return c;
}

const golemCache = new Map<string, HTMLCanvasElement>();

/** Wooden barrel golem with a glowing eye – the maze patrol unit (cached per frame/state). */
function golemSprite(frame: number, frozen: boolean): HTMLCanvasElement {
  const key = `${frame % 2}|${frozen}`;
  const hit = golemCache.get(key);
  if (hit) return hit;
  const c = mk(16, 16);
  const g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const body = frozen ? "#5f93a8" : "#8a5a32";
  const bodyLit = frozen ? "#8fc6d8" : "#a9733f";
  const bodyDark = frozen ? "#3f6c80" : "#5e3b22";
  const metal = frozen ? "#9fd6e6" : "#6b6256";
  const eye = frozen ? "#cdf3ff" : "#5de0d8";
  const step = frame % 2 === 0 ? 0 : 1;
  // legs
  R(4, 13 - step, 3, 3, bodyDark);
  R(9, 13 - (1 - step), 3, 3, bodyDark);
  // arms
  R(1, 7 + step, 3, 5, bodyDark);
  R(12, 7 + (1 - step), 3, 5, bodyDark);
  // barrel torso
  R(3, 4, 10, 10, body);
  R(4, 4, 8, 10, bodyLit);
  R(3, 4, 10, 1, metal);
  R(3, 8, 10, 1, metal);
  R(3, 13, 10, 1, metal);
  R(6, 5, 1, 8, bodyDark);
  R(9, 5, 1, 8, bodyDark);
  // head cap + eye
  R(5, 1, 6, 4, metal);
  R(5, 1, 6, 1, frozen ? "#d8f4ff" : "#857b6c");
  R(6, 6, 4, 3, "#1d2227");
  R(7, 7, 3, 2, eye);
  R(7, 7, 1, 1, "#ffffff");
  if (frozen) {
    R(2, 3, 2, 10, "#bfeaf7");
    R(12, 5, 2, 8, "#bfeaf7");
    R(5, 0, 6, 1, "#eafaff");
  }
  const out = outlineCanvas(c);
  golemCache.set(key, out);
  return out;
}

export default function Maze({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    let level = 1;
    let wall = genMaze(level);
    let walls = renderWalls(wall);
    let lives = 3;
    api.setLives(lives);
    let time = 0;
    let invuln = 0;
    let freeze = 0;
    let banner = 0;
    let bannerText = "";
    let want: Vec | null = null;
    const START: Vec = [1, GH - 2];
    let player = mover(START[0], START[1], 5.2);
    let pdir: Dir = "up";
    let panim = 0;
    let robots: Mover[] = [];
    let shards: { x: number; y: number }[] = [];
    let bolt: { x: number; y: number } | null = null;
    let heart: { x: number; y: number } | null = null;

    const open = (x: number, y: number) => x >= 0 && y >= 0 && x < GW && y < GH && !wall[y][x];

    const buildLevel = () => {
      wall = genMaze(level);
      walls = renderWalls(wall);
      player = mover(START[0], START[1], 5.2);
      want = null;
      const cells: Vec[] = [];
      for (let y = 1; y < GH; y += 2) for (let x = 1; x < GW; x += 2) cells.push([x, y]);
      const far = cells.filter(([x, y]) => Math.abs(x - START[0]) + Math.abs(y - START[1]) >= 12);
      robots = [];
      const rc = Math.min(4, 1 + Math.floor(level / 1.5));
      const spd = Math.min(4.3, 2.5 + level * 0.35);
      for (let i = 0; i < rc && far.length; i++) {
        const idx = Math.floor(Math.random() * far.length);
        const [x, y] = far.splice(idx, 1)[0];
        const m = mover(x, y, spd);
        m.dir = DIRS[Math.floor(Math.random() * 4)];
        robots.push(m);
      }
      const free = cells.filter(
        ([x, y]) =>
          Math.abs(x - START[0]) + Math.abs(y - START[1]) >= 4 && !robots.some((r) => r.tx === x && r.ty === y)
      );
      shards = [];
      const count = Math.min(14, 8 + level);
      for (let i = 0; i < count && free.length; i++) {
        const [x, y] = free.splice(Math.floor(Math.random() * free.length), 1)[0];
        shards.push({ x, y });
      }
      const [bx, by] = free.splice(Math.floor(Math.random() * free.length), 1)[0] ?? [3, 3];
      bolt = { x: bx, y: by };
      // bonus heart on every 3rd level (only useful below max lives)
      heart = null;
      if (level % 3 === 0 && lives < 3 && free.length) {
        const [hx, hy] = free.splice(Math.floor(Math.random() * free.length), 1)[0];
        heart = { x: hx, y: hy };
      }
    };
    buildLevel();

    // swipe handling
    let sx = 0;
    let sy = 0;
    let touching = false;

    const playerChoose = (m: Mover): Vec | null => {
      if (want && open(m.tx + want[0], m.ty + want[1])) return want;
      if ((m.dir[0] || m.dir[1]) && open(m.tx + m.dir[0], m.ty + m.dir[1])) return m.dir;
      return null;
    };

    const robotChoose = (m: Mover): Vec | null => {
      let opts = DIRS.filter((d) => open(m.tx + d[0], m.ty + d[1]) && !(d[0] === -m.dir[0] && d[1] === -m.dir[1]));
      if (!opts.length) opts = DIRS.filter((d) => open(m.tx + d[0], m.ty + d[1]));
      if (!opts.length) return null;
      const dist = Math.abs(m.tx - player.tx) + Math.abs(m.ty - player.ty);
      if (level >= 2 && dist < 9 && Math.random() < 0.3 + level * 0.05) {
        opts.sort(
          (a, b) =>
            Math.abs(m.tx + a[0] - player.tx) + Math.abs(m.ty + a[1] - player.ty) -
            (Math.abs(m.tx + b[0] - player.tx) + Math.abs(m.ty + b[1] - player.ty))
        );
        return opts[0];
      }
      const straight = opts.find((d) => d[0] === m.dir[0] && d[1] === m.dir[1]);
      if (straight && Math.random() < 0.6) return straight;
      return opts[Math.floor(Math.random() * opts.length)];
    };

    const update = (dt: number) => {
      time += dt;
      if (invuln > 0) invuln -= dt;
      if (freeze > 0) freeze -= dt;
      if (banner > 0) banner -= dt;

      // keyboard turns
      if (keys.has("arrowup") || keys.has("w")) want = DIRS[0];
      else if (keys.has("arrowright") || keys.has("d")) want = DIRS[1];
      else if (keys.has("arrowdown") || keys.has("s")) want = DIRS[2];
      else if (keys.has("arrowleft") || keys.has("a")) want = DIRS[3];

      // instant reversal while between tiles
      if (want && (player.nx !== player.tx || player.ny !== player.ty) && want[0] === -player.dir[0] && want[1] === -player.dir[1]) {
        reverse(player);
      }
      const before = player.t + player.tx + player.ty;
      advance(player, dt, playerChoose);
      if (player.dir[0] || player.dir[1]) {
        pdir = player.dir[0] < 0 ? "left" : player.dir[0] > 0 ? "right" : player.dir[1] < 0 ? "up" : "down";
      }
      if (before !== player.t + player.tx + player.ty) panim += dt * 9;

      const pxp = posX(player);
      const pyp = posY(player);

      // pickups
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        if (Math.abs(s.x * TS + 8 - pxp) < 8 && Math.abs(s.y * TS + 8 - pyp) < 8) {
          shards.splice(i, 1);
          api.addScore(10);
          sfx("gem");
        }
      }
      if (bolt && Math.abs(bolt.x * TS + 8 - pxp) < 8 && Math.abs(bolt.y * TS + 8 - pyp) < 8) {
        bolt = null;
        freeze = Math.max(1.5, 4 - level * 0.3);
        api.addScore(25);
        sfx("coin");
      }
      if (heart && Math.abs(heart.x * TS + 8 - pxp) < 8 && Math.abs(heart.y * TS + 8 - pyp) < 8) {
        heart = null;
        lives = Math.min(3, lives + 1);
        api.setLives(lives);
        api.addScore(15);
        bannerText = "+1 ♥";
        banner = 1.0;
        sfx("quest");
      }

      // robots
      if (freeze <= 0) for (const r of robots) advance(r, dt, robotChoose);
      if (invuln <= 0 && freeze <= 0) {
        for (const r of robots) {
          if (Math.hypot(posX(r) - pxp, posY(r) - pyp) < 9) {
            lives--;
            api.setLives(lives);
            sfx("hit");
            if (lives <= 0) {
              api.finish("dead");
              return;
            }
            invuln = 2;
            freeze = 1.1;
            player = mover(START[0], START[1], 5.2);
            want = null;
            break;
          }
        }
      }

      if (shards.length === 0) {
        api.addScore(40 + level * 10);
        sfx("clear");
        bannerText = t("mini_games.common.level_clear", { count: level });
        banner = 1.4;
        level++;
        buildLevel();
        invuln = 1.5;
      }
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(walls, 0, 0);

      const gem = (cx: number, cy: number, face: string, lit: string, dark: string, h: number) => {
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h);
        ctx.lineTo(cx + 4, cy - 1);
        ctx.lineTo(cx, cy + h - 2);
        ctx.lineTo(cx - 4, cy - 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = face;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h + 1);
        ctx.lineTo(cx + 3, cy - 1);
        ctx.lineTo(cx, cy + h - 3);
        ctx.lineTo(cx - 3, cy - 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = lit;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h + 1);
        ctx.lineTo(cx, cy + h - 3);
        ctx.lineTo(cx - 3, cy - 1);
        ctx.closePath();
        ctx.fill();
      };
      for (const s of shards) {
        const bob = Math.sin(time * 5 + s.x) * 1.5;
        ctx.fillStyle = "rgba(232,166,60,0.16)";
        ctx.fillRect(s.x * TS + 3, s.y * TS + 3, 10, 10);
        gem(s.x * TS + 8, s.y * TS + 9 + bob, "#e8a63c", "#ffd98f", "#8a5410", 6);
      }
      if (heart) {
        const bob = Math.sin(time * 4 + 1) * 1.5;
        const hx = heart.x * TS + 8;
        const hy = heart.y * TS + 7 + bob;
        ctx.fillStyle = "rgba(217,69,59,0.18)";
        ctx.fillRect(heart.x * TS + 3, heart.y * TS + 3, 10, 10);
        ctx.fillStyle = "#7d1f24";
        ctx.fillRect(hx - 4, hy - 3, 8, 6);
        ctx.fillRect(hx - 3, hy + 3, 6, 2);
        ctx.fillRect(hx - 1, hy + 5, 2, 1);
        ctx.fillStyle = "#e0404a";
        ctx.fillRect(hx - 3, hy - 3, 2, 2);
        ctx.fillRect(hx + 1, hy - 3, 2, 2);
        ctx.fillRect(hx - 3, hy - 1, 6, 3);
        ctx.fillRect(hx - 2, hy + 2, 4, 2);
        ctx.fillStyle = "#ff8b94";
        ctx.fillRect(hx - 3, hy - 2, 2, 2);
      }
      if (bolt) {
        const bob = Math.sin(time * 6) * 2;
        ctx.fillStyle = "rgba(90,169,239,0.25)";
        ctx.fillRect(bolt.x * TS + 1, bolt.y * TS + 1, 14, 14);
        gem(bolt.x * TS + 8, bolt.y * TS + 9 + bob, "#5aa9ef", "#cfe8ff", "#1f4d87", 7);
      }

      for (const r of robots) {
        const spr = golemSprite(Math.floor(time * 7 + r.tx), freeze > 0);
        const hop = freeze > 0 ? 0 : Math.abs(Math.sin(time * 8 + r.tx)) * 2;
        ctx.drawImage(spr, Math.round(posX(r) - spr.width / 2), Math.round(posY(r) - spr.height / 2 - hop));
      }

      if (invuln <= 0 || Math.floor(time * 12) % 2 === 0) {
        const f = player.dir[0] || player.dir[1] ? 1 + (Math.floor(panim) % 4) : 0;
        const spr = charSprite(playerLook(), pdir, f, true);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(Math.round(posX(player) - 5), Math.round(posY(player) + 6), 10, 3);
        ctx.drawImage(spr, Math.round(posX(player) - spr.width / 2), Math.round(posY(player) + 8 - spr.height + 2));
      }

      ctx.font = "16px VT323, monospace";
      ctx.fillStyle = "#fbd54a";
      ctx.textBaseline = "top";
      ctx.fillText(`${t("common.level")} ${level}`, 4, 3);
      if (freeze > 0) {
        ctx.fillStyle = "#7fd6e8";
        ctx.fillText(`❄ ${freeze.toFixed(1)}`, W - 52, 3);
      }
      if (banner > 0) {
        ctx.fillStyle = "rgba(20,18,42,0.8)";
        ctx.fillRect(0, H / 2 - 20, W, 40);
        ctx.fillStyle = "#fbd54a";
        ctx.font = "28px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillText(bannerText, W / 2, H / 2 - 12);
        ctx.textAlign = "left";
      }
    };

    return {
      update,
      draw,
      down: (x, y) => {
        touching = true;
        sx = x;
        sy = y;
      },
      move: (x, y) => {
        if (!touching) return;
        const dx = x - sx;
        const dy = y - sy;
        if (Math.hypot(dx, dy) > 7) {
          want = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS[1] : DIRS[3]) : dy > 0 ? DIRS[2] : DIRS[0];
          sx = x;
          sy = y;
        }
      },
      up: () => {
        touching = false;
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
