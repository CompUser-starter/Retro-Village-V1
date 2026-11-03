import { useEffect, useRef } from "react";
import { DECOR_SLOTS } from "../game/data";
import { charSprite, iconCanvas } from "../game/sprites";

const W = 240;
const H = 260;

// slot centers in canvas pixels (8 slots: 3 wall, 2 mid, 3 floor)
const SLOTS: [number, number][] = [
  [34, 46],
  [120, 30],
  [206, 46],
  [38, 122],
  [202, 122],
  [56, 214],
  [138, 224],
  [206, 212],
];

export default function RoomCanvas({
  placed,
  look,
  onSlot,
}: {
  placed: (string | null)[];
  look: string;
  onSlot: (i: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const data = useRef({ placed, look });
  data.current = { placed, look };

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    const t0 = performance.now();

    const draw = (now: number) => {
      const time = (now - t0) / 1000;
      const { placed: dec, look: lk } = data.current;
      ctx.imageSmoothingEnabled = false;

      // ---- wallpaper + wainscot ----
      ctx.fillStyle = "#e8b98a";
      ctx.fillRect(0, 0, W, 150);
      for (let x = 0; x < W; x += 16) {
        ctx.fillStyle = "#f2cfa0";
        ctx.fillRect(x, 0, 8, 150);
      }
      // wallpaper diamonds
      for (let y = 8; y < 140; y += 20) {
        for (let x = (y % 40 === 8 ? 4 : 12); x < W; x += 16) {
          ctx.fillStyle = "#d99a5f";
          ctx.fillRect(x, y, 2, 2);
        }
      }
      ctx.fillStyle = "#9a6b3f";
      ctx.fillRect(0, 150, W, 8);
      ctx.fillStyle = "#7d5632";
      ctx.fillRect(0, 158, W, 10);
      for (let x = 0; x < W; x += 20) {
        ctx.fillStyle = "#5e3b26";
        ctx.fillRect(x, 158, 2, 10);
      }

      // ---- floor ----
      ctx.fillStyle = "#a2733f";
      ctx.fillRect(0, 168, W, H - 168);
      for (let y = 168; y < H; y += 15) {
        ctx.fillStyle = "#8a5f30";
        ctx.fillRect(0, y, W, 1);
        for (let x = ((y / 15) % 2) * 30; x < W; x += 60) ctx.fillRect(x, y, 1, 15);
      }
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 168, W, 3);

      // ---- window with live view ----
      const wx = 84;
      const wy = 16;
      const ww = 72;
      const wh = 64;
      const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
      sky.addColorStop(0, "#7fd6e8");
      sky.addColorStop(1, "#d8f2f8");
      ctx.fillStyle = sky;
      ctx.fillRect(wx, wy, ww, wh);
      // sun
      ctx.fillStyle = "#fbd54a";
      ctx.fillRect(wx + 52, wy + 6, 12, 12);
      ctx.fillStyle = "#fff6c8";
      ctx.fillRect(wx + 55, wy + 9, 6, 6);
      // drifting clouds
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 2; i++) {
        const cx = wx + ((time * (7 + i * 4) + i * 44) % (ww + 30)) - 15;
        const cy = wy + 12 + i * 14;
        ctx.fillRect(Math.round(cx), cy, 18, 5);
        ctx.fillRect(Math.round(cx) + 4, cy - 4, 10, 5);
      }
      // hills + house outside
      ctx.fillStyle = "#5fae3f";
      ctx.fillRect(wx, wy + wh - 14, ww, 14);
      ctx.fillStyle = "#3e8948";
      ctx.fillRect(wx, wy + wh - 8, ww, 8);
      ctx.fillStyle = "#f6ecd0";
      ctx.fillRect(wx + 10, wy + wh - 22, 16, 12);
      ctx.fillStyle = "#d9453b";
      ctx.fillRect(wx + 8, wy + wh - 26, 20, 5);
      // frame + cross
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(wx - 4, wy - 4, ww + 8, 4);
      ctx.fillRect(wx - 4, wy + wh, ww + 8, 4);
      ctx.fillRect(wx - 4, wy - 4, 4, wh + 8);
      ctx.fillRect(wx + ww, wy - 4, 4, wh + 8);
      ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2);
      // curtains
      for (const cx of [wx - 12, wx + ww + 2]) {
        ctx.fillStyle = "#d9453b";
        ctx.fillRect(cx, wy - 8, 10, wh + 20);
        ctx.fillStyle = "#8f2d3b";
        ctx.fillRect(cx + 2, wy - 8, 2, wh + 20);
        ctx.fillRect(cx + 6, wy - 8, 2, wh + 20);
      }
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(wx - 14, wy - 10, ww + 28, 4);
      // sunbeam on floor
      ctx.fillStyle = "rgba(251,213,74,0.14)";
      ctx.beginPath();
      ctx.moveTo(wx + 10, wy + wh);
      ctx.lineTo(wx + ww - 10, wy + wh);
      ctx.lineTo(wx + ww + 24, 226);
      ctx.lineTo(wx - 14, 226);
      ctx.closePath();
      ctx.fill();

      // ---- fireplace (right) ----
      const fx = 178;
      const fy = 128;
      ctx.fillStyle = "#6f6a6f";
      ctx.fillRect(fx, fy, 54, 62);
      for (let y = fy + 6; y < fy + 62; y += 10) {
        ctx.fillStyle = "#8d8892";
        ctx.fillRect(fx, y, 54, 2);
      }
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(fx - 4, fy - 6, 62, 8);
      ctx.fillStyle = "#4a2d1c";
      ctx.fillRect(fx + 10, fy + 22, 34, 40);
      // animated flames
      const flames: [number, number, string][] = [
        [fx + 18, fy + 50, "#d9453b"],
        [fx + 27, fy + 48, "#ef8f3a"],
        [fx + 36, fy + 50, "#d9453b"],
      ];
      flames.forEach(([px, py], i) => {
        const h = 14 + Math.sin(time * 11 + i * 2.2) * 4;
        ctx.fillStyle = px % 2 ? "#ef8f3a" : "#d9453b";
        ctx.fillRect(px - 3, py - h, 7, h);
        ctx.fillStyle = "#fbd54a";
        ctx.fillRect(px - 1, py - h + 4, 3, h - 4);
        void py;
      });
      // fire glow (flickers)
      const glow = 0.1 + Math.abs(Math.sin(time * 9)) * 0.06;
      ctx.fillStyle = `rgba(239,143,58,${glow.toFixed(2)})`;
      ctx.fillRect(fx - 30, fy - 20, 110, 110);
      // logs
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(fx + 14, fy + 54, 26, 4);
      ctx.fillRect(fx + 16, fy + 50, 22, 3);

      // ---- bed (left) ----
      const bx = 6;
      const by = 186;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(bx, by + 30, 66, 5);
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(bx, by - 14, 6, 48);
      ctx.fillRect(bx + 60, by - 14, 6, 48);
      ctx.fillStyle = "#9a6b3f";
      ctx.fillRect(bx, by + 24, 66, 8);
      ctx.fillStyle = "#f6f1e4";
      ctx.fillRect(bx + 6, by - 2, 54, 26);
      ctx.fillStyle = "#d9453b";
      ctx.fillRect(bx + 6, by + 8, 54, 16);
      ctx.fillStyle = "#8f2d3b";
      for (let x = bx + 10; x < bx + 60; x += 10) ctx.fillRect(x, by + 8, 2, 16);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx + 8, by, 14, 10);
      ctx.fillStyle = "#e3d2a4";
      ctx.fillRect(bx + 8, by + 8, 14, 2);

      // ---- small round table (center-left) ----
      const tx = 96;
      const ty = 208;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(tx - 18, ty + 16, 40, 4);
      ctx.fillStyle = "#5e3b26";
      ctx.fillRect(tx - 2, ty - 6, 4, 22);
      ctx.fillStyle = "#9a6b3f";
      ctx.fillRect(tx - 20, ty - 12, 40, 7);
      ctx.fillStyle = "#c98a62";
      ctx.fillRect(tx - 20, ty - 12, 40, 2);
      // candle on table
      ctx.fillStyle = "#f6f1e4";
      ctx.fillRect(tx - 1, ty - 20, 3, 8);
      ctx.fillStyle = "#fbd54a";
      const fl = Math.sin(time * 13) * 1;
      ctx.fillRect(tx - 1 + Math.round(fl), ty - 24, 3, 4);

      // ---- placed decorations ----
      dec.slice(0, DECOR_SLOTS).forEach((id, i) => {
        if (!id) return;
        const [sx, sy] = SLOTS[i];
        const spr = iconCanvas(id);
        const sc = id === "rug" ? 4 : 3;
        const w = spr.width * sc;
        const h = spr.height * sc;
        const dx = Math.round(sx - w / 2);
        const dy = Math.round(sy - h / 2);
        if (sy > 160) {
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillRect(dx + 2, dy + h - 2, w - 4, 3);
        }
        if (id === "lamp") {
          const lg = 0.16 + Math.sin(time * 7) * 0.03;
          ctx.fillStyle = `rgba(251,213,74,${lg.toFixed(2)})`;
          ctx.fillRect(dx - 34, dy - 30, w + 68, h + 60);
        }
        const hop = id === "bird" ? Math.round(Math.abs(Math.sin(time * 5)) * -3) : 0;
        ctx.drawImage(spr, dx, dy + hop, w, h);
        if (id === "tv") {
          // static noise on the screen
          for (let s = 0; s < 8; s++) {
            ctx.fillStyle = Math.random() < 0.5 ? "#7fd6e8" : "#e8f6fa";
            ctx.fillRect(dx + 8 + Math.floor(Math.random() * (w - 16)), dy + 6 + Math.floor(Math.random() * (h / 2)), 2, 2);
          }
        }
        if (id === "cat") {
          ctx.font = "10px VT323, monospace";
          ctx.fillStyle = "#8f2d3b";
          const zo = Math.round(Math.sin(time * 2) * 2);
          ctx.fillText("z", dx + w - 2, dy - 4 + zo);
          ctx.fillText("Z", dx + w + 3, dy - 10 + zo);
        }
        if (id === "dog") {
          // wagging tail
          const wag = Math.sin(time * 10) > 0 ? -3 : 3;
          ctx.fillStyle = "#9a6b3f";
          ctx.fillRect(dx + w + wag - 4, dy + h - 12, 6, 3);
        }
        if (id === "clock") {
          // swinging pendulum under the clock
          const sw = Math.round(Math.sin(time * 4) * 4);
          ctx.fillStyle = "#4a2d1c";
          ctx.fillRect(dx + w / 2 - 1 + sw / 2, dy + h, 2, 6);
          ctx.fillStyle = "#fbd54a";
          ctx.fillRect(dx + w / 2 - 2 + sw, dy + h + 6, 4, 4);
        }
      });

      // ---- empty slot hints ----
      dec.slice(0, DECOR_SLOTS).forEach((id, i) => {
        if (id) return;
        const [sx, sy] = SLOTS[i];
        ctx.strokeStyle = "rgba(27,26,46,0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(sx - 14, sy - 14, 28, 28);
        ctx.setLineDash([]);
        ctx.font = "14px VT323, monospace";
        ctx.fillStyle = "rgba(27,26,46,0.55)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", sx, sy);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      });

      // ---- player ----
      const f = Math.floor(time / 0.8) % 2 === 0 ? 0 : 2;
      const spr = charSprite(lk, "down", f);
      const px = 128;
      const py = 208;
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(px - 8, py + 1, 16, 4);
      ctx.drawImage(spr, Math.round(px - spr.width / 2), Math.round(py - spr.height + 4), spr.width * 1.5, spr.height * 1.5);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const click = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    let best = -1;
    let bd = 24;
    SLOTS.slice(0, DECOR_SLOTS).forEach(([sx, sy], i) => {
      const d = Math.hypot(sx - x, sy - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) onSlot(best);
  };

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      onPointerDown={click}
      className="pixelated mx-auto block w-full max-w-[440px] cursor-pointer border-4 border-[#4a2d1c] shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
      style={{ touchAction: "manipulation" }}
    />
  );
}
