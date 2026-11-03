// "Qala Quraşdırıcı" (Castle Builder) – stack the swinging block on the tower.
// Tap to drop. Whatever hangs over the edge is cut off, so the tower gets narrower.
// Perfect drops give a bonus (golden ring + starburst) and win a little width back.
//
// Graphics follow the supplied sheet: a light-blue sky with a little village,
// a flat stone foundation, four wooden-framed beveled blocks (terracotta,
// cream, sage, slate), golden perfect-placement rings + stars, landing dust,
// falling offcut slivers and a failure puff.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { mk } from "../game/sprites";
import { ART } from "../game/assets";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
// Slightly chunkier stack pieces, closer to the reference's carved block tiles.
// Chunkier, more tile-like proportions so these read as stackable blocks,
// rather than thin wooden planks.
const BLOCK_H = 36;
const BASE_W = 84;
const GROUND_Y = H - 78;

// The four block faces from the sheet.
const BLOCKS: { face: string; light: string; dark: string; seam: string }[] = [
  { face: "#c97955", light: "#e9a07b", dark: "#8f4934", seam: "#ad5c42" }, // terracotta
  { face: "#dfcda5", light: "#fff0d0", dark: "#aa9873", seam: "#c4b38e" }, // cream stone
  { face: "#708b82", light: "#a6c1b4", dark: "#425f56", seam: "#5a766d" }, // sage
  { face: "#71839b", light: "#b5c3d4", dark: "#3e4d64", seam: "#596b83" }, // slate
];
// Thin carved-stone outline/bevel; the block face stays dominant, as in the sheet.
const FRAME = { outline: "#303338", base: "#96948d", top: "#d5d0c4", shade: "#666970", bottom: "#4d5055" };

interface Block {
  x: number;
  w: number;
  y: number;
  col: number;
}
interface Chip {
  x: number;
  y: number;
  w: number;
  vx: number;
  vy: number;
  col: number;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  s: number;
  c: string;
}
interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  c: string;
}
interface Ring {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  col: string;
}

export default function Castle({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    const tower: Block[] = [{ x: (W - BASE_W) / 2, w: BASE_W, y: 0, col: 0 }];
    let chips: Chip[] = [];
    let sparks: Spark[] = [];
    let dust: Dust[] = [];
    let rings: Ring[] = [];
    let lives = 3;
    api.setLives(lives);

    let cur = { x: 10, w: BASE_W, dir: 1, speed: 74, col: 1 };
    let dropping: { x: number; w: number; y: number; vy: number; col: number } | null = null;
    let camY = 0;
    let camTarget = 0;
    let height = 0;
    let perfectRun = 0;
    let time = 0;
    let msg = "";
    let msgT = 0;
    let msgCol = "#fbd54a";
    let shake = 0;
    let failureFlash = 0;
    let dead = false;
    let pressed = false;

    /* ---------------------------------------------------------------- */
    /* Reference-style sky, mountain line and small village cottages.   */
    /* ---------------------------------------------------------------- */
    const sky = mk(W, H);
    {
      const g = sky.getContext("2d")!;
      const R = (x: number, y: number, w: number, h: number, c: string) => {
        g.fillStyle = c;
        g.fillRect(x, y, w, h);
      };
      // Flat pixel-sky bands.
      for (const [y, h, col] of [
        [0, 48, "#86c7e7"],
        [48, 52, "#9dd7ed"],
        [100, 54, "#b3e2f1"],
        [154, GROUND_Y - 154, "#c9eaf2"],
      ] as [number, number, string][]) R(0, y, W, h, col);

      // Stepped puffy clouds.
      const cloud = (cx: number, cy: number, scale: number) => {
        const white = "#f5fbf8";
        const shade = "#d3ebf1";
        const blocks: [number, number, number, number][] = [
          [-9, 2, 17, 7], [-3, -3, 17, 8], [6, -8, 15, 9],
          [15, -12, 14, 10], [25, -8, 17, 9], [34, -3, 15, 8], [43, 2, 13, 7],
        ];
        for (const [dx, dy, w, h] of blocks) R(cx + dx * scale, cy + dy * scale, w * scale, h * scale, white);
        R(cx - 6 * scale, cy + 7 * scale, 62 * scale, 3 * scale, shade);
        R(cx + 8 * scale, cy + 5 * scale, 34 * scale, 2 * scale, shade);
      };
      cloud(18, 61, 0.72);
      cloud(145, 40, 0.82);
      cloud(84, 116, 0.62);
      cloud(193, 141, 0.52);

      // Distant mountain silhouettes with small snowy facets.
      const mountain = (x: number, base: number, w: number, peak: number, col: string) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(x, base);
        g.lineTo(x + w * 0.48, peak);
        g.lineTo(x + w, base);
        g.closePath();
        g.fill();
        g.fillStyle = "#edf6f2";
        g.beginPath();
        g.moveTo(x + w * 0.34, peak + (base - peak) * 0.25);
        g.lineTo(x + w * 0.48, peak);
        g.lineTo(x + w * 0.64, peak + (base - peak) * 0.28);
        g.lineTo(x + w * 0.54, peak + (base - peak) * 0.23);
        g.lineTo(x + w * 0.46, peak + (base - peak) * 0.36);
        g.closePath();
        g.fill();
      };
      mountain(-24, GROUND_Y - 37, 105, GROUND_Y - 135, "#8298bf");
      mountain(48, GROUND_Y - 33, 116, GROUND_Y - 125, "#778eaf");
      mountain(142, GROUND_Y - 36, 116, GROUND_Y - 145, "#8498ba");

      // Evergreen tree line at the foot of the mountains.
      for (let x = -4; x < W + 12; x += 10) {
        const th = 15 + ((x * 7 + 23) % 12);
        const y = GROUND_Y - 34 - th;
        R(x + 4, y + th - 3, 2, 9, "#66503a");
        g.fillStyle = x % 2 ? "#3f6f52" : "#47795a";
        g.beginPath();
        g.moveTo(x, y + th - 3);
        g.lineTo(x + 5, y);
        g.lineTo(x + 10, y + th - 3);
        g.closePath();
        g.fill();
      }

      // Rolling fields and a distant evergreen row.
      g.fillStyle = "#719c58";
      for (let x = 0; x < W; x += 2) g.fillRect(x, GROUND_Y - 34 + Math.sin(x / 31 + 0.4) * 5, 2, 42);
      g.fillStyle = "#86ae62";
      for (let x = 0; x < W; x += 2) g.fillRect(x, GROUND_Y - 24 + Math.sin(x / 39 + 2) * 4, 2, 32);
      for (let x = 0; x < W; x += 13) {
        const th = 10 + ((x * 11 + 17) % 12);
        const ty = GROUND_Y - 31 - th;
        R(x + 4, ty + th - 2, 2, 7, "#715139");
        R(x, ty + 2, 10, th - 3, x % 2 ? "#477b4d" : "#538650");
        R(x + 2, ty, 6, 5, "#65985a");
      }

      // Readable cottages: timber posts, tiled gable roofs, windows and chimneys.
      const cottage = (x: number, base: number, w: number, wall: string, roof: string, roofDark: string, chimney: boolean) => {
        const bodyH = 26;
        const top = base - bodyH;
        R(x - 1, top - 1, w + 2, bodyH + 2, "#463527");
        R(x, top, w, bodyH, wall);
        R(x + 2, top + 1, 2, bodyH - 2, "#76563a");
        R(x + w - 4, top + 1, 2, bodyH - 2, "#76563a");
        R(x, top + 8, w, 2, "#76563a");
        const roofRows = Math.floor((w + 6) / 4);
        for (let row = 0; row < roofRows; row++) {
          const inset = row * 2;
          const yy = top - 3 - row * 2;
          const rw = w + 8 - inset * 2;
          if (rw <= 0) continue;
          R(x - 4 + inset, yy, rw, 2, row % 2 ? roof : roofDark);
          R(x - 4 + inset, yy, rw, 1, row % 2 ? roof : "#e09a78");
          for (let tx = x - 2 + inset + (row % 2) * 4; tx < x + w + 2 - inset; tx += 8) R(tx, yy, 1, 2, roofDark);
        }
        R(x - 5, top - 4, w + 10, 3, roofDark);
        if (chimney) {
          R(x + w - 9, top - 17, 5, 12, "#8d8a83");
          R(x + w - 10, top - 18, 7, 2, "#5b5852");
          R(x + w - 8, top - 22, 3, 3, "rgba(255,255,255,0.55)");
        }
        R(x + 5, top + 7, 6, 7, "#493426");
        R(x + 6, top + 8, 4, 5, "#f3cf7f");
        R(x + w - 12, top + 7, 6, 7, "#493426");
        R(x + w - 11, top + 8, 4, 5, "#f3cf7f");
        R(x + Math.floor(w / 2) - 4, base - 12, 8, 12, "#69472d");
        R(x + Math.floor(w / 2) + 2, base - 6, 1, 1, "#fbd54a");
        R(x + Math.floor(w / 2) - 6, base - 1, 12, 2, "#b9b0a0");
        R(x + 4, top + 15, 8, 2, "#6b4426");
        R(x + 5, top + 13, 2, 2, "#e87f8f");
        R(x + 8, top + 13, 2, 2, "#f2d86e");
      };
      cottage(6, GROUND_Y - 9, 39, "#d9c9a9", "#8e8e92", "#666a72", true);
      cottage(48, GROUND_Y - 12, 27, "#e7d5b3", "#ba6345", "#8e4934", false);
      cottage(162, GROUND_Y - 11, 33, "#e4d0aa", "#d2a14c", "#a87b32", true);
      cottage(199, GROUND_Y - 8, 30, "#d9c7a4", "#ba6345", "#8e4934", false);

      // Foreground verge and tiny wildflowers.
      R(0, GROUND_Y - 7, W, 9, "#70aa50");
      R(0, GROUND_Y - 7, W, 2, "#9ac96c");
      for (const [x, color] of [[20, "#f2d86e"], [80, "#f7f1dc"], [127, "#e8898d"], [157, "#f2d86e"], [221, "#f7f1dc"]] as [number, string][]) {
        R(x, GROUND_Y - 11, 1, 4, "#4e853d");
        R(x - 1, GROUND_Y - 12, 3, 2, color);
      }
      // A winding village road behind the tower, like the reference panorama.
      g.fillStyle = "#a77b4d";
      g.beginPath();
      g.moveTo(111, GROUND_Y - 33);
      g.lineTo(124, GROUND_Y - 33);
      g.lineTo(130, GROUND_Y - 20);
      g.lineTo(114, GROUND_Y - 10);
      g.lineTo(153, GROUND_Y + 2);
      g.lineTo(87, GROUND_Y + 2);
      g.lineTo(100, GROUND_Y - 10);
      g.lineTo(112, GROUND_Y - 20);
      g.closePath();
      g.fill();
      g.fillStyle = "#d0ad72";
      g.fillRect(113, GROUND_Y - 31, 8, 2);
      g.fillRect(106, GROUND_Y - 14, 13, 2);
      // Opaque soil strip, as shown in the reference gameplay background.
      R(0, GROUND_Y + 2, W, H - GROUND_Y - 2, "#654426");
      R(0, GROUND_Y + 2, W, 3, "#47763e");
      for (let y = GROUND_Y + 10; y < H; y += 11) {
        R(0, y, W, 1, "#805936");
        for (let x = (y * 7) % 21; x < W; x += 31) R(x, y + 3, 3, 2, "#51371e");
      }

      // Prefer the loaded village artwork, keeping its aspect ratio and cropping only
      // its upper/lower margins to fill the portrait playfield. The hand-drawn panorama
      // above remains a safe fallback if the image is unavailable.
      const village = ART.villageBg;
      if (village?.naturalWidth && village.naturalHeight) {
        const sourceH = Math.min(village.naturalHeight, village.naturalWidth * (H / W));
        const sourceY = Math.max(0, Math.min(village.naturalHeight - sourceH, village.naturalHeight * 0.13));
        g.imageSmoothingEnabled = false;
        g.drawImage(village, 0, sourceY, village.naturalWidth, sourceH, 0, 0, W, H);
      }
    }

    const topBlock = () => tower[tower.length - 1];
    const screenY = (worldY: number) => GROUND_Y - worldY + camY;

    const say = (text: string, col: string, t = 0.75) => {
      msg = text;
      msgCol = col;
      msgT = t;
    };

    const starBurst = (x: number, y: number, c: string, n = 8, s0 = 4) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const v = 40 + Math.random() * 70;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 20,
          life: 0.45 + Math.random() * 0.3,
          max: 0.75,
          s: s0 + Math.random() * 3,
          c,
        });
      }
    };

    const puff = (x: number, y: number, c: string, n = 4) => {
      for (let i = 0; i < n; i++) {
        dust.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 34,
          vy: -Math.random() * 18 - 4,
          life: 0.4 + Math.random() * 0.3,
          max: 0.7,
          r: 3 + Math.random() * 3,
          c,
        });
      }
    };

    const nextBlock = () => {
      const t = topBlock();
      const fromLeft = Math.random() < 0.5;
      cur = {
        x: fromLeft ? -t.w : W,
        w: t.w,
        dir: fromLeft ? 1 : -1,
        speed: Math.min(165, 74 + height * 4.5),
        col: (t.col + 1) % BLOCKS.length,
      };
    };

    const drop = () => {
      if (dropping || dead) return;
      dropping = { x: cur.x, w: cur.w, y: topBlock().y + BLOCK_H + 90, vy: 0, col: cur.col };
      sfx("place");
    };

    const land = () => {
      if (!dropping) return;
      const t = topBlock();
      const d = dropping;
      const left = Math.max(d.x, t.x);
      const right = Math.min(d.x + d.w, t.x + t.w);
      const overlap = right - left;

      if (overlap <= 2) {
        // missed the tower completely — failure puff + debris
        chips.push({ x: d.x, y: t.y + BLOCK_H, w: d.w, vx: d.x < t.x ? -60 : 60, vy: -40, col: d.col });
        puff(left, t.y + BLOCK_H, "#c48a6a", 6);
        puff(left, t.y + BLOCK_H, "#a89a8a", 6);
        puff(left + 4, t.y + BLOCK_H, "#8f8172", 4);
        dropping = null;
        perfectRun = 0;
        lives--;
        api.setLives(lives);
        shake = 0.3;
        failureFlash = 0.75;
        starBurst(d.x + d.w / 2, screenY(t.y + BLOCK_H), "#df5948", 10, 4);
        sfx("hit");
        say("✖", "#d9453b", 0.8);
        if (lives <= 0) {
          dead = true;
          api.finish("dead");
          return;
        }
        nextBlock();
        return;
      }

      const off = Math.abs(d.x - t.x);
      // Give a forgiving but still skill-based sweet spot; the visual gold effect
      // should be reachable often enough to be clearly seen during normal play.
      const perfect = off <= Math.max(5, Math.round(t.w * 0.085));
      let newW = overlap;
      let newX = left;
      const landY = t.y + BLOCK_H;

      if (perfect) {
        newX = t.x;
        newW = Math.min(BASE_W, t.w + 4);
        perfectRun++;
        const gain = 25 + Math.min(60, perfectRun * 10);
        api.addScore(gain);
        const cy = screenY(landY);
        starBurst(newX + newW / 2, cy, "#fbd54a", 18, 7);
        starBurst(newX + newW / 2, cy, "#fff2b0", 10, 4);
        rings.push({ x: newX + newW / 2, y: cy, r: 10, life: 0.9, max: 0.9, col: "#fbd54a" });
        sfx("gem");
        say(perfectRun > 1 ? `DƏQİQ x${perfectRun}  +${gain}` : `DƏQİQ!  +${gain}`, "#fbd54a", 0.9);
      } else {
        // slice off the overhang (falling offcut slivers)
        if (d.x < t.x) chips.push({ x: d.x, y: landY, w: t.x - d.x, vx: -70, vy: -30, col: d.col });
        else if (d.x + d.w > t.x + t.w) chips.push({ x: t.x + t.w, y: landY, w: d.x + d.w - (t.x + t.w), vx: 70, vy: -30, col: d.col });
        perfectRun = 0;
        api.addScore(10);
        // Every landing has a visible stone ripple; perfect drops use gold above.
        rings.push({ x: newX + newW / 2, y: screenY(landY), r: 7, life: 0.6, max: 0.6, col: "#e9e1cf" });
        starBurst(newX + newW / 2, screenY(landY), "#e9e1cf", 8, 4);
        sfx("clear");
      }

      // landing dust at both ends of the placed block
      puff(newX + 2, screenY(landY), "#e8e2d4", 6);
      puff(newX + newW - 2, screenY(landY), "#c4beb0", 6);

      tower.push({ x: newX, w: newW, y: landY, col: d.col });
      height++;
      api.addScore(5);
      dropping = null;

      if (newW < 10) {
        lives = 0;
        api.setLives(0);
        dead = true;
        sfx("hit");
        api.finish("dead");
        return;
      }
      // Keep the growing stack in the middle of the viewport instead of pinning
      // its top to the ground line as the camera follows it.
      camTarget = Math.max(0, tower[tower.length - 1].y - 112);
      nextBlock();
    };

    nextBlock();

    const update = (dt: number) => {
      if (dead) return;
      time += dt;
      if (msgT > 0) msgT -= dt;
      if (shake > 0) shake -= dt;
      if (failureFlash > 0) failureFlash = Math.max(0, failureFlash - dt);

      const keyDown = keys.has(" ") || keys.has("arrowdown") || keys.has("s");
      if (keyDown && !pressed) drop();
      pressed = keyDown;

      if (!dropping) {
        cur.x += cur.dir * cur.speed * dt;
        if (cur.dir > 0 && cur.x > W) cur.dir = -1;
        if (cur.dir < 0 && cur.x + cur.w < 0) cur.dir = 1;
      } else {
        dropping.vy += 900 * dt;
        dropping.y -= dropping.vy * dt;
        if (dropping.y <= topBlock().y + BLOCK_H) {
          dropping.y = topBlock().y + BLOCK_H;
          land();
        }
      }

      camY += (camTarget - camY) * Math.min(1, dt * 5);

      chips.forEach((c) => {
        c.vy += 700 * dt;
        c.x += c.vx * dt;
        c.y -= c.vy * dt;
      });
      chips = chips.filter((c) => screenY(c.y) < H + 60);

      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 200 * dt;
        s.life -= dt;
      });
      sparks = sparks.filter((s) => s.life > 0);

      dust.forEach((d) => {
        d.x += d.vx * dt;
        d.y -= d.vy * dt;
        d.life -= dt;
      });
      dust = dust.filter((d) => d.life > 0);

      rings.forEach((r) => {
        r.r += 52 * dt;
        r.life -= dt;
      });
      rings = rings.filter((r) => r.life > 0);
    };

    /* ---------------------------------------------------------------- */
    /* Large, unmistakably colored, bevelled stack blocks.              */
    /* ---------------------------------------------------------------- */
    const drawBlock = (x: number, sy: number, w: number, ci: number) => {
      const X = Math.round(x);
      const Y = Math.round(sy);
      const WW = Math.round(w);
      if (WW < 3) return;
      const B = BLOCKS[ci];
      // crisp 2px silhouette with clipped pixel corners
      ctx.fillStyle = FRAME.outline;
      ctx.fillRect(X + 2, Y, WW - 4, BLOCK_H);
      ctx.fillRect(X, Y + 2, WW, BLOCK_H - 4);
      // stone bevel is deliberately thin: the four colour variants must read clearly
      ctx.fillStyle = FRAME.base;
      ctx.fillRect(X + 2, Y + 1, WW - 4, BLOCK_H - 2);
      ctx.fillRect(X + 1, Y + 2, WW - 2, BLOCK_H - 4);
      ctx.fillStyle = FRAME.top;
      ctx.fillRect(X + 3, Y + 2, WW - 6, 2);
      ctx.fillRect(X + 2, Y + 4, 1, BLOCK_H - 8);
      ctx.fillStyle = FRAME.shade;
      ctx.fillRect(X + 3, Y + BLOCK_H - 3, WW - 6, 1);
      ctx.fillRect(X + WW - 3, Y + 4, 1, BLOCK_H - 7);
      // main coloured face (large inset like the reference tiles)
      const fx = X + 3;
      const fy = Y + 4;
      const fw = WW - 6;
      const fh = BLOCK_H - 8;
      if (fw <= 0 || fh <= 0) return;
      ctx.fillStyle = B.face;
      ctx.fillRect(fx, fy, fw, fh);
      // top-left light bevel / bottom-right shade
      ctx.fillStyle = B.light;
      ctx.fillRect(fx, fy, fw, 3);
      ctx.fillRect(fx, fy, 2, fh);
      ctx.fillStyle = B.dark;
      ctx.fillRect(fx, fy + fh - 3, fw, 3);
      ctx.fillRect(fx + fw - 2, fy + 2, 2, fh - 2);
      // mineral bands and fine face seams
      ctx.fillStyle = B.seam;
      ctx.fillRect(fx + 5, fy + 9, fw - 10, 1);
      ctx.fillRect(fx + 8, fy + 15, fw - 16, 1);
      ctx.fillStyle = "rgba(255,255,255,0.23)";
      ctx.fillRect(fx + 4, fy + 4, Math.max(4, fw - 18), 1);
    };

    // A thin offcut sliver, same frame style but shorter.
    const drawChip = (x: number, sy: number, w: number, ci: number) => {
      const X = Math.round(x);
      const Y = Math.round(sy);
      const WW = Math.max(3, Math.round(w));
      const B = BLOCKS[ci];
      ctx.fillStyle = FRAME.outline;
      ctx.fillRect(X - 1, Y - 1, WW + 2, 11);
      ctx.fillStyle = FRAME.base;
      ctx.fillRect(X, Y, WW, 9);
      ctx.fillStyle = B.face;
      ctx.fillRect(X + 2, Y + 2, WW - 4, 5);
      ctx.fillStyle = B.light;
      ctx.fillRect(X + 2, Y + 2, WW - 4, 1);
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sky, 0, 0);

      const shx = shake > 0 ? Math.round((Math.random() - 0.5) * 5) : 0;
      ctx.save();
      ctx.translate(shx, 0);

      // Stone foundation follows the base block. The full meadow/soil panorama is
      // already painted into `sky`; only the local foundation slab scrolls here.
      const gY = screenY(0);
      if (gY < H + 40) {
        // wide light-grey stone foundation with bevel, seams, rubble and tufts
        const base = tower[0];
        const bx = Math.round(base.x) - 19;
        const bw = Math.round(base.w) + 38;
        ctx.fillStyle = "#414047";
        ctx.fillRect(bx - 2, gY - 2, bw + 4, 21);
        ctx.fillStyle = "#99978f";
        ctx.fillRect(bx, gY, bw, 16);
        ctx.fillStyle = "#d5d0c4";
        ctx.fillRect(bx + 1, gY, bw - 2, 4);
        ctx.fillStyle = "#b7b2a8";
        ctx.fillRect(bx + 2, gY + 4, bw - 4, 2);
        ctx.fillStyle = "#6d6b6d";
        ctx.fillRect(bx + 1, gY + 14, bw - 2, 2);
        // block seams on the face
        for (let x = bx + 18; x < bx + bw - 8; x += 24) {
          ctx.fillStyle = "#77756f";
          ctx.fillRect(x, gY + 7, 1, 7);
        }
        ctx.fillStyle = "#77756f";
        ctx.fillRect(bx + 2, gY + 10, bw - 4, 1);
        // rubble stones along both sides of the foundation
        for (let i = 0; i < 9; i++) {
          const left = bx - 7 + i * 5;
          const right = bx + bw - 3 + i * 5;
          const yy = gY + 13 + (i % 2) * 2;
          for (const rx of [left, right]) {
            ctx.fillStyle = i % 2 ? "#76757a" : "#8d8c91";
            ctx.fillRect(rx, yy, 7, 5);
            ctx.fillStyle = "#b0afb0";
            ctx.fillRect(rx + 1, yy, 3, 1);
            ctx.fillStyle = "#4f4d53";
            ctx.fillRect(rx, yy + 4, 7, 1);
          }
        }
        // grass tufts at the stone edges
        for (let x = bx - 4; x < bx + bw + 5; x += 13) {
          ctx.fillStyle = "#3f7d3d";
          ctx.fillRect(x + 2, gY + 10, 2, 8);
          ctx.fillStyle = "#75b451";
          ctx.fillRect(x + 5, gY + 12, 2, 6);
        }
      }

      // falling offcut slivers
      for (const c of chips) drawChip(c.x, screenY(c.y), c.w, c.col);

      // tower
      for (const b of tower) {
        const sy = screenY(b.y + BLOCK_H);
        if (sy > H + BLOCK_H || sy < -BLOCK_H * 2) continue;
        drawBlock(b.x, sy, b.w, b.col);
      }
      // the block waiting to be dropped / currently falling
      if (dropping) drawBlock(dropping.x, screenY(dropping.y), dropping.w, dropping.col);
      else {
        const sy = screenY(topBlock().y + BLOCK_H + 90);
        drawBlock(cur.x, sy, cur.w, cur.col);
      }

      // dust puffs
      for (const d of dust) {
        const a = Math.max(0, d.life / d.max);
        ctx.globalAlpha = a * 0.65;
        ctx.fillStyle = d.c;
        const r = Math.round(d.r * (1.7 - a));
        ctx.fillRect(Math.round(d.x - r), Math.round(d.y - r), r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // Golden circular placement ring, like the asset sheet's effect.
      for (const r of rings) {
        const a = Math.max(0, r.life / r.max);
      ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = r.col;
      ctx.lineWidth = r.col === "#fbd54a" ? 3 : 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = r.col === "#fbd54a" ? "#fff2b0" : "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(1, r.r - 2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // golden star sparkles
      for (const s of sparks) {
        const a = Math.max(0, s.life / s.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = s.c;
        const s0 = Math.max(2, Math.round(s.s * a));
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - s0, 2, s0 * 2);
        ctx.fillRect(Math.round(s.x) - s0, Math.round(s.y) - 1, s0 * 2, 2);
        ctx.fillRect(Math.round(s.x) - s0, Math.round(s.y) - s0, 1, 1);
        ctx.fillRect(Math.round(s.x) + s0, Math.round(s.y) - s0, 1, 1);
        ctx.fillRect(Math.round(s.x) - s0, Math.round(s.y) + s0, 1, 1);
        ctx.fillRect(Math.round(s.x) + s0, Math.round(s.y) + s0, 1, 1);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // A brief red failure flash is separate from the dust and falling offcut.
      if (failureFlash > 0) {
        ctx.fillStyle = `rgba(185,48,42,${failureFlash * 0.34})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      ctx.font = "18px VT323, monospace";
      ctx.textBaseline = "top";
      for (let i = 0; i < lives; i++) {
        ctx.fillStyle = "#2b2b33";
        ctx.fillRect(7 + i * 17, 7, 14, 12);
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(8 + i * 17, 8, 12, 10);
        ctx.fillRect(10 + i * 17, 6, 8, 10);
        ctx.fillStyle = "#f6f1e4";
        ctx.fillRect(9 + i * 17, 9, 2, 2);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = "#2a1a10";
      ctx.fillText(`${height} mərtəbə`, W - 7, 7);
      ctx.fillStyle = "#fff4dc";
      ctx.fillText(`${height} mərtəbə`, W - 8, 6);
      ctx.textAlign = "left";
      if (msgT > 0) {
        ctx.globalAlpha = Math.min(1, msgT * 3);
        ctx.font = "26px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#2a1a10";
        ctx.fillText(msg, W / 2 + 1, 41);
        ctx.fillStyle = msgCol;
        ctx.fillText(msg, W / 2, 40);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
      ctx.textBaseline = "alphabetic";
    };

    return { update, draw, down: () => drop() };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
