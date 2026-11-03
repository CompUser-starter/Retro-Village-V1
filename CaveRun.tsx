// "Cave Gem Run" – auto-running treasure dash. Tap to jump, tap again in the air to double jump.
import { GameCanvas, type GameCtx, type GameLogic } from "../components/GameCanvas";
import { charSprite, iconCanvas, mk, playerLook } from "../game/sprites";
import { ART, caveStripTile } from "../game/assets";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";

const W = 240;
const H = 360;
const GROUND = 272;
const PX = 70; // player's screen x

interface Seg {
  x0: number;
  x1: number;
  y: number;
}
interface Gem {
  x: number;
  y: number;
  got: boolean;
  chest?: boolean;
}
interface Spike {
  x: number;
  w: number;
}
interface Bat {
  x: number;
  y0: number;
  ph: number;
  t0: number;
}
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
}

export default function CaveRun({ api }: { api: MiniApi }) {
  const setup = ({ ctx, keys }: GameCtx): GameLogic => {
    let lives = 3;
    api.setLives(lives);
    const pl = { x: 0, y: GROUND, vy: 0, onGround: true, jumps: 0 };
    let coyote = 0;
    let buffer = 0;
    let invuln = 0;
    let time = 0;
    let distAcc = 0;
    let keyPrev = false;
    let genX = 260;
    const segs: Seg[] = [{ x0: -300, x1: 260, y: GROUND }];
    const plats: Seg[] = [];
    let gems: Gem[] = [];
    let spikes: Spike[] = [];
    let bats: Bat[] = [];
    let parts: Part[] = [];
    let lastPattern = "";

    // slate cobblestone ground tile, 32px wide, repeated along the floor
    const TILE_W = 32;
    const groundTile = mk(TILE_W, H - GROUND + 12);
    {
      const g = groundTile.getContext("2d")!;
      const R = (x: number, y: number, w: number, h: number, c: string) => {
        g.fillStyle = c;
        g.fillRect(x, y, w, h);
      };
      R(0, 0, TILE_W, groundTile.height, "#16141d");
      // cobble rows, each row offset by half a stone
      for (let row = 0; row < 8; row++) {
        const y = 6 + row * 11;
        const off = row % 2 ? 8 : 0;
        for (let x = -16 + off; x < TILE_W + 16; x += 16) {
          const deep = row / 8;
          const base = row < 2 ? ["#4a4654", "#423f4d"] : row < 4 ? ["#3a3745", "#33313d"] : ["#2b2935", "#25232e"];
          R(x + 1, y + 1, 14, 9, base[((x / 16 + row) & 1) ? 1 : 0]);
          R(x + 2, y + 1, 11, 2, row < 2 ? "#5e596b" : "#474353");
          R(x + 1, y + 9, 14, 1, "#1a1822");
          // a few darker cracks lower down
          if ((row + x) % 5 === 0 && deep > 0.3) R(x + 5, y + 3, 1, 5, "#1c1a24");
        }
      }
      // mossy worn walking surface on top
      R(0, 0, TILE_W, 6, "#55503f");
      R(0, 0, TILE_W, 2, "#6f6a52");
      R(0, 5, TILE_W, 1, "#2a2720");
      for (const x of [4, 13, 22, 28]) R(x, 2, 3, 1, "#7d7760");
      for (const x of [2, 17, 26]) R(x, 0, 4, 1, "#4a7a4a");
    }

    const drawGround = (x: number, y: number, w: number, h: number, worldX: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      const start = x - (((worldX % TILE_W) + TILE_W) % TILE_W);
      for (let tx = start; tx < x + w; tx += TILE_W) ctx.drawImage(groundTile, 0, 0, TILE_W, h, tx, y, TILE_W, h);
      ctx.restore();
    };

    // background stalactites (parallax)
    const stal = Array.from({ length: 40 }, (_, i) => ({ x: i * 34 + Math.random() * 20, h: 18 + Math.random() * 60, w: 10 + Math.random() * 12 }));
    const crystals = Array.from({ length: 24 }, (_, i) => ({ x: i * 61 + Math.random() * 40, y: 110 + Math.random() * 120, c: ["#7fd6e8", "#b86fc6", "#f48fb1"][i % 3] }));

    const ground = (len: number) => {
      segs.push({ x0: genX, x1: genX + len, y: GROUND });
      const s = genX;
      genX += len;
      return s;
    };
    const arc = (x: number, w: number, base: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        gems.push({ x: x + t * w, y: base - Math.sin(t * Math.PI) * 26, got: false });
      }
    };

    const generate = () => {
      const d = Math.min(1, api.elapsed.current / api.duration);
      while (genX < pl.x + W + 160) {
        const roll = Math.random();
        let pat = "flat";
        if (roll < 0.3) pat = "pit";
        else if (roll < 0.5) pat = "spikes";
        else if (roll < 0.68) pat = "platform";
        else if (roll < 0.68 + 0.12 + d * 0.12) pat = "bat";
        else if (roll < 0.95) pat = "flat";
        else pat = "chest";
        if (pat === lastPattern && pat !== "flat") pat = "flat";
        lastPattern = pat;

        if (pat === "flat") {
          const len = 110 + Math.random() * 70;
          const s = ground(len);
          for (let x = s + 20; x < s + len - 10; x += 16) gems.push({ x, y: GROUND - 14, got: false });
        } else if (pat === "pit") {
          const gap = 38 + Math.random() * (16 + d * 22);
          const s = genX;
          genX += gap;
          arc(s - 8, gap + 16, GROUND - 22, 5);
          ground(90 + Math.random() * 40);
        } else if (pat === "spikes") {
          const len = 150;
          const s = ground(len);
          const w = 16 + Math.floor(Math.random() * (1 + d * 2)) * 8;
          const sx = s + 60;
          spikes.push({ x: sx, w });
          arc(sx - 12, w + 24, GROUND - 24, 5);
        } else if (pat === "platform") {
          const len = 170;
          const s = ground(len);
          const y = GROUND - 44 - Math.floor(Math.random() * 2) * 8;
          plats.push({ x0: s + 50, x1: s + 106, y });
          for (let x = s + 56; x < s + 100; x += 14) gems.push({ x, y: y - 12, got: false });
          if (d > 0.3 && Math.random() < 0.6) spikes.push({ x: s + 128, w: 16 });
        } else if (pat === "bat") {
          const len = 170;
          const s = ground(len);
          bats.push({ x: s + 90, y0: GROUND - 34, ph: Math.random() * 6, t0: time });
          if (d > 0.5) bats.push({ x: s + 140, y0: GROUND - 50, ph: Math.random() * 6, t0: time });
          for (let x = s + 20; x < s + 70; x += 16) gems.push({ x, y: GROUND - 14, got: false });
        } else {
          const len = 160;
          const s = ground(len);
          plats.push({ x0: s + 60, x1: s + 100, y: GROUND - 50 });
          gems.push({ x: s + 80, y: GROUND - 62, got: false, chest: true });
          spikes.push({ x: s + 112, w: 16 });
        }
      }
      // cleanup behind the camera
      const cut = pl.x - 140;
      gems = gems.filter((g) => g.x > cut && !g.got);
      spikes = spikes.filter((s) => s.x + s.w > cut);
      bats = bats.filter((b) => b.x > cut);
      while (segs.length > 2 && segs[0].x1 < cut) segs.shift();
      while (plats.length && plats[0].x1 < cut) plats.shift();
    };

    const burst = (x: number, y: number, c: string[]) => {
      for (let i = 0; i < 7; i++) {
        parts.push({ x, y, vx: (Math.random() - 0.5) * 110, vy: -Math.random() * 90, life: 0.4 + Math.random() * 0.2, c: c[i % c.length] });
      }
    };

    const hurt = (knock: boolean) => {
      if (invuln > 0) return;
      lives--;
      api.setLives(lives);
      sfx("hit");
      burst(PX, pl.y - 8, ["#d9453b", "#ef8f3a", "#ffffff"]);
      if (lives <= 0) {
        api.finish("dead");
        return;
      }
      invuln = 1.6;
      if (knock) pl.vy = -210;
    };

    const respawn = () => {
      const seg = segs.find((s) => s.x1 > pl.x + 30) ?? segs[segs.length - 1];
      pl.x = Math.max(pl.x, seg.x0 + 14);
      pl.y = seg.y - 50;
      pl.vy = 0;
      pl.jumps = 1;
    };

    const requestJump = () => {
      buffer = 0.12;
    };

    const update = (dt: number) => {
      time += dt;
      const d = Math.min(1, api.elapsed.current / api.duration);
      const speed = 95 + 48 * d;
      if (invuln > 0) invuln -= dt;

      const kdown = keys.has(" ") || keys.has("arrowup") || keys.has("w");
      if (kdown && !keyPrev) requestJump();
      keyPrev = kdown;

      pl.x += speed * dt;
      distAcc += speed * dt;
      if (distAcc >= 40) {
        const n = Math.floor(distAcc / 40);
        distAcc -= n * 40;
        api.addScore(n);
      }

      // jumping
      if (buffer > 0) {
        buffer -= dt;
        if (pl.onGround || coyote > 0) {
          pl.vy = -310;
          pl.jumps = 1;
          pl.onGround = false;
          coyote = 0;
          buffer = 0;
          sfx("jump");
          burst(PX, pl.y, ["#b9b4a8", "#6f6a6f"]);
        } else if (pl.jumps < 2) {
          pl.vy = -285;
          pl.jumps = 2;
          buffer = 0;
          sfx("jump");
          burst(PX, pl.y, ["#7fd6e8", "#ffffff"]);
        }
      }

      // physics
      const prevBottom = pl.y;
      pl.vy += 900 * dt;
      pl.y += pl.vy * dt;
      const wasGround = pl.onGround;
      pl.onGround = false;
      if (pl.vy >= 0) {
        for (const s of segs.concat(plats)) {
          if (pl.x + 5 > s.x0 && pl.x - 5 < s.x1 && prevBottom <= s.y + 1 && pl.y >= s.y) {
            pl.y = s.y;
            pl.vy = 0;
            pl.onGround = true;
            pl.jumps = 0;
            break;
          }
        }
      }
      if (pl.onGround) coyote = 0.09;
      else {
        if (wasGround && coyote <= 0) coyote = 0.09;
        coyote -= dt;
        if (coyote <= 0 && pl.jumps === 0) pl.jumps = 1;
      }

      // fell into a pit
      if (pl.y > H + 40) {
        lives--;
        api.setLives(lives);
        sfx("hit");
        if (lives <= 0) {
          api.finish("dead");
          return;
        }
        invuln = 1.6;
        respawn();
      }

      // hazards
      const left = pl.x - 4;
      const right = pl.x + 4;
      const top = pl.y - 15;
      for (const s of spikes) {
        if (right > s.x + 2 && left < s.x + s.w - 2 && pl.y > GROUND - (ART.obstacles ? 12 : 7) && top < GROUND) hurt(true);
      }
      for (const b of bats) {
        const by = b.y0 + Math.sin(time * 3 + b.ph) * 16;
        const bx = b.x - (time - b.t0) * 18;
        if (Math.hypot(bx - pl.x, by - (pl.y - 8)) < 11) hurt(true);
      }
      for (const g of gems) {
        if (!g.got && Math.abs(g.x - pl.x) < 10 && Math.abs(g.y - (pl.y - 8)) < 13) {
          g.got = true;
          api.addScore(g.chest ? 50 : 10);
          sfx(g.chest ? "coin" : "gem");
          burst(g.x - (pl.x - PX), g.y, g.chest ? ["#fbd54a", "#ffffff"] : ["#7fd6e8", "#ffffff"]);
        }
      }

      parts.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.life -= dt;
      });
      parts = parts.filter((p) => p.life > 0);
      generate();
    };

    generate();

    const draw = () => {
      const camX = Math.round(pl.x - PX);
      ctx.imageSmoothingEnabled = false;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0c0b16");
      g.addColorStop(1, "#1a1830");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const strip = caveStripTile(GROUND + 14, 0.12);
      if (strip) {
        const off = (((camX * 0.35) % strip.width) + strip.width) % strip.width;
        ctx.drawImage(strip, -Math.round(off), 0);
        ctx.drawImage(strip, -Math.round(off) + strip.width, 0);
      } else {
      // parallax crystals
      for (const c of crystals) {
        const x = (((c.x - camX * 0.25) % (24 * 61)) + 24 * 61) % (24 * 61) - 20;
        if (x < -10 || x > W + 10) continue;
        ctx.fillStyle = c.c;
        ctx.globalAlpha = 0.55 + Math.sin(time * 2 + c.x) * 0.2;
        ctx.fillRect(Math.round(x), Math.round(c.y), 3, 5);
        ctx.fillRect(Math.round(x) + 1, Math.round(c.y) - 2, 1, 2);
        ctx.globalAlpha = 1;
      }
      // stalactites far/near
      for (let layer = 0; layer < 2; layer++) {
        const f = layer ? 0.55 : 0.3;
        ctx.fillStyle = layer ? "#3a3670" : "#26234a";
        const span = 40 * 34;
        for (const s of stal) {
          const x = (((s.x - camX * f) % span) + span) % span - 30;
          if (x < -30 || x > W + 10) continue;
          const h = s.h * (layer ? 1 : 0.7);
          for (let yy = 0; yy < h; yy += 4) {
            const ww = Math.max(2, Math.round(s.w * (1 - yy / h)));
            ctx.fillRect(Math.round(x + (s.w - ww) / 2), yy, ww, 4);
          }
        }
      }
      // ceiling
      ctx.fillStyle = "#1b1a2e";
      ctx.fillRect(0, 0, W, 12);
      ctx.fillStyle = "#3a3670";
      ctx.fillRect(0, 12, W, 3);
      }

      // ground & platforms
      for (const s of segs) {
        const x0 = Math.round(s.x0 - camX);
        const x1 = Math.round(s.x1 - camX);
        if (x1 < 0 || x0 > W) continue;
        const a = Math.max(0, x0);
        const b = Math.min(W, x1);
        drawGround(a, s.y, b - a, H - s.y, a + camX);
        // only draw a cliff edge where the ground really ends (no seams on flat runs)
        const EPS = 0.5;
        const openLeft = !segs.some((o) => o !== s && Math.abs(o.x1 - s.x0) < EPS);
        const openRight = !segs.some((o) => o !== s && Math.abs(o.x0 - s.x1) < EPS);
        ctx.fillStyle = "#3a2415";
        if (openLeft && x0 > 0) ctx.fillRect(x0, s.y, 2, H - s.y);
        if (openRight && x1 < W) ctx.fillRect(x1 - 2, s.y, 2, H - s.y);
      }
      for (const s of plats) {
        const x0 = Math.round(s.x0 - camX);
        const w = s.x1 - s.x0;
        if (x0 + w < 0 || x0 > W) continue;
        ctx.fillStyle = "#14121a";
        ctx.fillRect(x0 - 1, s.y - 1, w + 2, 13);
        drawGround(x0, s.y, w, 11, s.x0);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x0, s.y + 11, w, 2);
      }

      // spikes
      for (const s of spikes) {
        const x0 = Math.round(s.x - camX);
        if (x0 + s.w < 0 || x0 > W) continue;
        if (ART.obstacles) {
          const spr = Math.floor(s.x / 7) % 3 === 0 ? ART.obstacles.stump : ART.obstacles.rock;
          const count = Math.max(1, Math.round(s.w / 16));
          for (let i = 0; i < count; i++) {
            const cx = x0 + ((i + 0.5) * s.w) / count;
            ctx.drawImage(spr, Math.round(cx - spr.width / 2), GROUND - spr.height + 2);
          }
          continue;
        }
        for (let i = 0; i < s.w / 8; i++) {
          const bx = x0 + i * 8;
          ctx.fillStyle = "#1b1a2e";
          ctx.fillRect(bx, GROUND - 9, 8, 9);
          ctx.fillStyle = "#b9b4a8";
          ctx.fillRect(bx + 1, GROUND - 5, 6, 5);
          ctx.fillRect(bx + 2, GROUND - 7, 4, 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(bx + 3, GROUND - 7, 2, 2);
          ctx.fillStyle = "#6f6a6f";
          ctx.fillRect(bx + 5, GROUND - 5, 2, 5);
        }
      }

      // gems
      for (const gm of gems) {
        if (gm.got) continue;
        const x = Math.round(gm.x - camX);
        if (x < -12 || x > W + 12) continue;
        const ic = gm.chest && ART.obstacles ? ART.obstacles.crystal : iconCanvas(gm.chest ? "chest" : "gem");
        const bob = Math.round(Math.sin(time * 5 + gm.x * 0.1) * 1.5);
        ctx.drawImage(ic, Math.round(x - ic.width / 2), Math.round(gm.y - ic.height / 2 + bob));
      }

      // bats
      for (const b of bats) {
        const bx = Math.round(b.x - (time - b.t0) * 18 - camX);
        const by = Math.round(b.y0 + Math.sin(time * 3 + b.ph) * 16);
        if (bx < -20 || bx > W + 20) continue;
        if (ART.bats.length >= 3) {
          const spr = ART.bats[[0, 1, 2, 1][Math.floor(time * 10 + b.ph) % 4]];
          ctx.drawImage(spr, Math.round(bx - spr.width / 2), Math.round(by - spr.height / 2));
          continue;
        }
        const ic = iconCanvas("bat");
        const flap = Math.floor(time * 8) % 2;
        ctx.drawImage(ic, bx - ic.width / 2, by - (flap ? 2 : 0), ic.width, flap ? ic.height * 0.7 : ic.height);
      }

      // player
      if (invuln <= 0 || Math.floor(time * 14) % 2 === 0) {
        const hero = ART.hero;
        const spr = hero
          ? invuln > 1.2
            ? hero.hurt
            : !pl.onGround
              ? pl.vy < 0
                ? hero.jump
                : hero.fall
              : hero.run[[0, 1, 2, 1][Math.floor(time * 12) % 4]]
          : charSprite(playerLook(), "right", pl.onGround ? 1 + (Math.floor(time * 11) % 4) : 3);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        if (pl.onGround) ctx.fillRect(PX - 5, Math.round(pl.y) - 1, 10, 3);
        ctx.drawImage(spr, Math.round(PX - spr.width / 2), Math.round(pl.y - spr.height + 2));
      }

      for (const p of parts) {
        ctx.globalAlpha = Math.min(1, p.life * 3);
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }
      ctx.globalAlpha = 1;
    };

    return {
      update,
      draw,
      down: () => requestJump(),
    };
  };

  return <GameCanvas w={W} h={H} setup={setup} paused={api.paused} />;
}
