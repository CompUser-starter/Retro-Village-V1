// "Crystal Garden" – drag crystal pieces onto an 8x8 grid; full rows/columns bloom away.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { mk } from "../game/sprites";
import { sfx } from "../game/audio";
import { t } from "../game/i18n";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const N = 8;
const CELL = 25;
const GX = (W - N * CELL) / 2;
const GY = 12;
const TRAY_Y = 236;
const SLOT_W = 76;
const SLOT_H = 104;
const DRAG_OFFSET = 12; // piece rides just above the fingertip

const COLORS: [string, string, string][] = [
  ["#4fd6c4", "#1f8f86", "#b6f4ec"], // teal
  ["#f0a73c", "#b06a12", "#ffd89a"], // amber
  ["#a96fd8", "#6a3a9c", "#e0bdf6"], // violet
  ["#ef7fa6", "#a93c66", "#ffc3d7"], // rose
  ["#7cd055", "#3d8a2c", "#c6f2a8"], // leaf
  ["#5aa9ef", "#2763ab", "#b6dcff"], // sky
];

const SHAPES: string[][] = [
  ["#"],
  ["##"],
  ["#", "#"],
  ["###"],
  ["#", "#", "#"],
  ["####"],
  ["#", "#", "#", "#"],
  ["#####"],
  ["#", "#", "#", "#", "#"],
  ["##", "##"],
  ["###", "###", "###"],
  ["#.", "##"],
  [".#", "##"],
  ["##", "#."],
  ["##", ".#"],
  ["#..", "#..", "###"],
  ["..#", "..#", "###"],
  ["###", "#..", "#.."],
  ["###", "..#", "..#"],
  ["###", ".#."],
  [".#.", "###"],
  ["#.", "##", "#."],
  [".#", "##", ".#"],
  ["##.", ".##"],
  [".##", "##."],
  ["#.", "#.", "##"],
  [".#", ".#", "##"],
];

interface Piece {
  cells: [number, number][]; // [row, col]
  rows: number;
  cols: number;
  color: number;
}

const toPiece = (shape: string[], color: number): Piece => {
  const cells: [number, number][] = [];
  shape.forEach((row, r) => [...row].forEach((ch, c) => ch === "#" && cells.push([r, c])));
  return { cells, rows: shape.length, cols: Math.max(...shape.map((s) => s.length)), color };
};

const SHAPE_PIECES = SHAPES.map((s) => toPiece(s, 0));

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
  s: number;
}

export default function Blocks({ api }: { api: MiniApi }) {
  const setup = ({ ctx }: GameCtx): GameLogic => {
    const grid: number[][] = Array.from({ length: N }, () => Array<number>(N).fill(-1));
    let tray: (Piece | null)[] = [null, null, null];
    let drag: { slot: number; x: number; y: number; rx: number; ry: number } | null = null;
    let combo = 0;
    let comboText = "";
    let comboTimer = 0;
    let particles: Particle[] = [];
    let floats: { x: number; y: number; text: string; life: number }[] = [];
    let time = 0;
    let shake = 0;

    const canPlace = (p: Piece, r: number, c: number) =>
      p.cells.every(([dr, dc]) => {
        const rr = r + dr;
        const cc = c + dc;
        return rr >= 0 && cc >= 0 && rr < N && cc < N && grid[rr][cc] < 0;
      });

    const fitsAnywhere = (p: Piece) => {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(p, r, c)) return true;
      return false;
    };

    const randomPiece = (): Piece => {
      const d = Math.min(1, api.score.current / 450);
      const weights = SHAPE_PIECES.map((p) => {
        const n = p.cells.length;
        if (n === 1) return 2.2 * (1 - d * 0.7);
        if (n === 2) return 5 * (1 - d * 0.4);
        if (n === 3) return 6;
        if (n === 4) return 5 + d * 2;
        if (n === 5) return 2 + d * 3;
        return 1 + d * 3;
      });
      let sum = weights.reduce((a, b) => a + b, 0);
      let pick = Math.random() * sum;
      let idx = 0;
      for (; idx < weights.length; idx++) {
        pick -= weights[idx];
        if (pick <= 0) break;
      }
      idx = Math.min(idx, SHAPES.length - 1);
      sum = 0;
      return toPiece(SHAPES[idx], Math.floor(Math.random() * COLORS.length));
    };

    const refill = () => {
      tray = [randomPiece(), randomPiece(), randomPiece()];
      // fairness: at least one piece must fit
      if (!tray.some((p) => p && fitsAnywhere(p))) {
        for (let tries = 0; tries < 40; tries++) {
          const p = randomPiece();
          if (p.cells.length <= 3 && fitsAnywhere(p)) {
            tray[Math.floor(Math.random() * 3)] = p;
            break;
          }
        }
      }
    };
    refill();

    const slotRect = (i: number) => ({ x: 8 + i * (SLOT_W + 4), y: TRAY_Y, w: SLOT_W, h: SLOT_H });

    const spawnBurst = (r: number, c: number, color: number) => {
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: GX + c * CELL + CELL / 2,
          y: GY + r * CELL + CELL / 2,
          vx: (Math.random() - 0.5) * 120,
          vy: -Math.random() * 90 - 20,
          life: 0.6 + Math.random() * 0.3,
          c: COLORS[color][2],
          s: 3 + Math.floor(Math.random() * 3),
        });
      }
    };

    const snap = (p: Piece, x: number, y: number): [number, number] => {
      const pw = p.cols * CELL;
      const ph = p.rows * CELL;
      const px = x - pw / 2;
      const py = y - DRAG_OFFSET - ph / 2;
      return [Math.round((py - GY) / CELL), Math.round((px - GX) / CELL)];
    };

    const place = (slot: number, r: number, c: number) => {
      const p = tray[slot]!;
      for (const [dr, dc] of p.cells) grid[r + dr][c + dc] = p.color;
      tray[slot] = null;
      let gained = p.cells.length;
      sfx("place");

      const fullRows: number[] = [];
      const fullCols: number[] = [];
      for (let i = 0; i < N; i++) {
        if (grid[i].every((v) => v >= 0)) fullRows.push(i);
        if (grid.every((row) => row[i] >= 0)) fullCols.push(i);
      }
      const lines = fullRows.length + fullCols.length;
      if (lines > 0) {
        const cleared = new Set<string>();
        fullRows.forEach((rr) => {
          for (let cc = 0; cc < N; cc++) cleared.add(`${rr},${cc}`);
        });
        fullCols.forEach((cc) => {
          for (let rr = 0; rr < N; rr++) cleared.add(`${rr},${cc}`);
        });
        cleared.forEach((k) => {
          const [rr, cc] = k.split(",").map(Number);
          spawnBurst(rr, cc, grid[rr][cc]);
          grid[rr][cc] = -1;
        });
        combo++;
        const bonus = [0, 10, 25, 45, 70, 100, 140, 180][Math.min(lines, 7)] + (combo > 1 ? combo * 5 : 0);
        gained += bonus;
        floats.push({ x: GX + (N * CELL) / 2, y: GY + (N * CELL) / 2, text: `+${gained}`, life: 1 });
        if (combo > 1) {
          comboText = t("mini_games.common.combo", { count: combo });
          comboTimer = 1.5;
        }
        shake = 0.2;
        sfx("clear");
      } else {
        combo = 0;
      }
      api.addScore(gained);

      if (tray.every((x) => x === null)) refill();
      const remaining = tray.filter((x): x is Piece => !!x);
      if (!remaining.some(fitsAnywhere)) {
        setTimeout(() => api.finish("stuck"), 450);
        api.paused.current = true;
      }
    };

    const update = (dt: number) => {
      time += dt;
      if (drag) {
        const k = Math.min(1, dt * 28);
        drag.x += (drag.rx - drag.x) * k;
        drag.y += (drag.ry - drag.y) * k;
      }
      if (comboTimer > 0) comboTimer -= dt;
      if (shake > 0) shake -= dt;
      particles = particles.filter((p) => (p.life -= dt) > 0);
      particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 380 * dt;
      });
      floats = floats.filter((f) => (f.life -= dt) > 0);
      floats.forEach((f) => (f.y -= 30 * dt));
    };

    // faceted crystal tile (matches the reference asset sheet)
    const cell = (x: number, y: number, size: number, ci: number, alpha = 1) => {
      const [face, dark, light] = COLORS[ci];
      const b = Math.max(2, Math.round(size * 0.18));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#24323a";
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = dark;
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 1);
      ctx.lineTo(x + size - 1, y + 1);
      ctx.lineTo(x + size - 1 - b, y + 1 + b);
      ctx.lineTo(x + 1 + b, y + 1 + b);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 1);
      ctx.lineTo(x + 1 + b, y + 1 + b);
      ctx.lineTo(x + 1 + b, y + size - 1 - b);
      ctx.lineTo(x + 1, y + size - 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = face;
      ctx.fillRect(x + 1 + b, y + 1 + b, size - 2 - b * 2, size - 2 - b * 2);
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = "#ffffff";
      const inner = size - 2 - b * 2;
      for (let i = 0; i < inner; i++) {
        const px = x + 1 + b + i;
        const py = y + size - 2 - b - i;
        ctx.fillRect(px, py - Math.max(1, Math.round(size * 0.1)), 1, Math.max(1, Math.round(size * 0.1)));
      }
      ctx.globalAlpha = alpha;
    };

    const bgCanvas = mk(W, H);
    {
      const b = bgCanvas.getContext("2d")!;
      const R = (x: number, y: number, w: number, h: number, c: string) => {
        b.fillStyle = c;
        b.fillRect(x, y, w, h);
      };
      // mossy meadow
      R(0, 0, W, H, "#5c8a44");
      for (let i = 0; i < 900; i++) R((i * 71) % W, (i * 137) % H, 2, 2, ["#6a9c4e", "#527b3c", "#74a955"][i % 3]);
      const nearBoard = (x: number, y: number, pad: number) =>
        x > GX - pad && x < GX + N * CELL + pad && y > GY - pad && y < GY + N * CELL + pad;
      // little flowers
      for (let i = 0; i < 26; i++) {
        const x = 6 + ((i * 97) % (W - 12));
        const y = 6 + ((i * 59) % (H - 12));
        if (nearBoard(x, y, 14) || y > TRAY_Y - 8) continue;
        R(x, y + 2, 1, 3, "#3d7030");
        R(x - 1, y, 3, 2, ["#e6d35a", "#d98fd0", "#ffffff", "#e87f7f"][i % 4]);
      }
      // pebbles
      for (let i = 0; i < 10; i++) {
        const x = 4 + ((i * 151) % (W - 16));
        const y = 10 + ((i * 213) % (H - 24));
        if (nearBoard(x, y, 18) || y > TRAY_Y - 10) continue;
        R(x, y, 10, 6, "#8d8c94");
        R(x + 1, y - 1, 7, 3, "#a5a4ae");
        R(x, y + 5, 10, 2, "#6b6a74");
      }
      // crystal clusters in the corners
      const cluster = (cx: number, cy: number, col: string, lit: string, dir: number) => {
        for (const [dx, h, w] of [[-5, 10, 4], [0, 16, 5], [5, 11, 4]] as [number, number, number][]) {
          R(cx + dx * dir - 1, cy - h - 1, w + 2, h + 2, "#24323a");
          R(cx + dx * dir, cy - h, w, h, col);
          R(cx + dx * dir, cy - h, 2, h, lit);
          R(cx + dx * dir, cy - h, w, 2, lit);
        }
      };
      cluster(22, TRAY_Y - 6, "#4fd6c4", "#b6f4ec", 1);
      cluster(W - 24, TRAY_Y - 10, "#a96fd8", "#e0bdf6", -1);
      // a few small sprigs in the narrow side margins
      const sprig = (sx: number, sy: number, col: string, lit: string) => {
        R(sx - 1, sy - 7, 4, 8, "#24323a");
        R(sx, sy - 6, 2, 7, col);
        R(sx, sy - 6, 1, 7, lit);
      };
      for (let i = 0; i < 4; i++) {
        sprig(5, GY + 34 + i * 44, "#4fd6c4", "#b6f4ec");
        sprig(W - 7, GY + 56 + i * 44, "#a96fd8", "#e0bdf6");
      }

      // polished stone frame with crystal corner caps
      const fx = GX - 7, fy = GY - 7, fw = N * CELL + 14, fh = N * CELL + 14;
      R(fx - 1, fy - 1, fw + 2, fh + 2, "#1d2b31");
      R(fx, fy, fw, fh, "#3f7a74");
      R(fx + 1, fy + 1, fw - 2, 2, "#69b3a8");
      R(fx + 1, fy + fh - 3, fw - 2, 2, "#2b5a56");
      for (let x = fx + 6; x < fx + fw - 6; x += 14) R(x, fy, 1, fh, "#35655f");
      for (const [cx, cy] of [[fx, fy], [fx + fw - 7, fy], [fx, fy + fh - 7], [fx + fw - 7, fy + fh - 7]] as [number, number][]) {
        R(cx, cy, 7, 7, "#86e6d8");
        R(cx + 1, cy + 1, 4, 4, "#d2fbf4");
      }
      // slate playing cells
      R(GX - 2, GY - 2, N * CELL + 4, N * CELL + 4, "#20343a");
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          R(GX + c * CELL, GY + r * CELL, CELL - 1, CELL - 1, (r + c) % 2 ? "#2c4b4a" : "#2f5150");
          R(GX + c * CELL, GY + r * CELL, CELL - 1, 1, "#3a615e");
        }
      }
      // stone shelf under the tray
      R(4, TRAY_Y + SLOT_H - 6, W - 8, 10, "#3f7a74");
      R(4, TRAY_Y + SLOT_H - 6, W - 8, 2, "#69b3a8");
    }


    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
      ctx.drawImage(bgCanvas, 0, 0);
      ctx.save();
      ctx.translate(sx, 0);

      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] >= 0) cell(GX + c * CELL, GY + r * CELL, CELL, grid[r][c]);

      // ghost preview: green = will land here, red = blocked
      if (drag) {
        const p = tray[drag.slot];
        if (p) {
          const [r, c] = snap(p, drag.x, drag.y);
          const ok = canPlace(p, r, c);
          for (const [dr, dc] of p.cells) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
            ctx.fillStyle = ok ? "rgba(255,255,255,0.42)" : "rgba(217,69,59,0.35)";
            ctx.fillRect(GX + cc * CELL, GY + rr * CELL, CELL, CELL);
            ctx.strokeStyle = ok ? "rgba(251,213,74,0.9)" : "rgba(217,69,59,0.8)";
            ctx.lineWidth = 1;
            ctx.strokeRect(GX + cc * CELL + 0.5, GY + rr * CELL + 0.5, CELL - 1, CELL - 1);
          }
        }
      }
      ctx.restore();

      // particles
      for (const p of particles) {
        ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      ctx.globalAlpha = 1;

      // tray
      for (let i = 0; i < 3; i++) {
        const s = slotRect(i);
        // recessed slate pocket, matching the board
        ctx.fillStyle = "#1d2b31";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "#3f7a74";
        ctx.fillRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
        ctx.fillStyle = "#294846";
        ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
        ctx.fillStyle = "#69b3a8";
        ctx.fillRect(s.x + 2, s.y + 2, s.w - 4, 1);
        const p = tray[i];
        if (p && !(drag && drag.slot === i)) {
          const cs = Math.min(18, Math.floor(60 / Math.max(p.rows, p.cols)));
          const ox = s.x + (s.w - p.cols * cs) / 2;
          const oy = s.y + (s.h - p.rows * cs) / 2;
          for (const [dr, dc] of p.cells) cell(Math.round(ox + dc * cs), Math.round(oy + dr * cs), cs, p.color);
        }
      }

      // dragged piece: painted last, slightly lifted with a soft shadow
      if (drag) {
        const p = tray[drag.slot];
        if (p) {
          const out = snap(p, drag.rx, drag.ry);
          const valid = canPlace(p, out[0], out[1]);
          const ox = drag.rx - (p.cols * CELL) / 2;
          const oy = drag.ry - DRAG_OFFSET - (p.rows * CELL) / 2;
          for (const [dr, dc] of p.cells) {
            ctx.fillStyle = "rgba(74,45,28,0.25)";
            ctx.fillRect(Math.round(ox + dc * CELL) + 3, Math.round(oy + dr * CELL) + 4, CELL, CELL);
          }
          for (const [dr, dc] of p.cells) cell(Math.round(ox + dc * CELL), Math.round(oy + dr * CELL), CELL, p.color, 1);
          if (!valid) {
            ctx.fillStyle = "rgba(217,69,59,0.25)";
            for (const [dr, dc] of p.cells) ctx.fillRect(Math.round(ox + dc * CELL), Math.round(oy + dr * CELL), CELL, CELL);
          }
        }
      }

      ctx.font = "26px VT323, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.fillStyle = "#4a2d1c";
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = "#fbd54a";
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      if (comboTimer > 0) {
        ctx.fillStyle = "#4a2d1c";
        ctx.fillText(comboText, W / 2 + 1, GY + N * CELL + 17);
        ctx.fillStyle = "#f48fb1";
        ctx.fillText(comboText, W / 2, GY + N * CELL + 16);
      }
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    };

    return {
      update,
      draw,
      down: (x, y) => {
        for (let i = 0; i < 3; i++) {
          const s = slotRect(i);
          if (tray[i] && x >= s.x && x <= s.x + s.w && y >= s.y - 6 && y <= s.y + s.h) {
            drag = { slot: i, x, y, rx: x, ry: y };
            return;
          }
        }
      },
      move: (x, y) => {
        if (drag) drag.rx = x;
        if (drag) drag.ry = y;
      },
      up: (x, y) => {
        if (!drag) return;
        const p = tray[drag.slot];
        const slot = drag.slot;
        drag = null;
        if (!p) return;
        const [r, c] = snap(p, x, y);
        if (canPlace(p, r, c)) place(slot, r, c);
        else if (y < TRAY_Y) sfx("error");
      },
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
