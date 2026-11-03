import { useEffect, useRef, useState } from "react";

export interface GameCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  keys: Set<string>;
}

export interface GameLogic {
  update(dt: number): void;
  draw(): void;
  down?(x: number, y: number, id: number): void;
  move?(x: number, y: number, id: number): void;
  up?(x: number, y: number, id: number): void;
  dispose?(): void;
}

/**
 * Fixed-resolution pixel canvas that scales to fit its container (nearest-neighbour).
 * `setup` runs once on mount and returns the game logic (update/draw/pointer handlers).
 * Every stage is guarded: a failure shows a readable message instead of a black screen.
 */
export function GameCanvas({
  w,
  h,
  setup,
  paused,
  className = "",
}: {
  w: number;
  h: number;
  setup: (gc: GameCtx) => GameLogic;
  paused?: { current: boolean };
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const logic = useRef<GameLogic | null>(null);
  const setupRef = useRef(setup);
  setupRef.current = setup;
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // fit to container
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const s = Math.min(r.width / w, r.height / h);
      if (!Number.isFinite(s) || s <= 0) return;
      const next = Math.max(0.5, s >= 2 ? Math.floor(s * 4) / 4 : s);
      setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  // game loop
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = cv.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) {
      setError("Canvas 2D context is unavailable on this device.");
      return;
    }
    ctx.imageSmoothingEnabled = false;

    const keys = new Set<string>();
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.add(k);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    let lg: GameLogic | null = null;
    try {
      lg = setupRef.current({ ctx, w, h, keys });
      logic.current = lg;
    } catch (err) {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      return () => {
        window.removeEventListener("keydown", kd);
        window.removeEventListener("keyup", ku);
      };
    }

    let raf = 0;
    let last = performance.now();
    let failed = false;
    const loop = (now: number) => {
      if (failed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      try {
        if (!paused?.current) lg!.update(dt);
        lg!.draw();
      } catch (err) {
        // stop the loop but keep the app alive and show what went wrong
        failed = true;
        setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      try {
        lg?.dispose?.();
      } catch {
        /* ignore */
      }
      logic.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  const pos = (e: React.PointerEvent): [number, number] => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) * w) / r.width, ((e.clientY - r.top) * h) / r.height];
  };

  const guard = (fn: () => void) => {
    try {
      fn();
    } catch (err) {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    }
  };

  return (
    <div ref={wrap} className={`relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden ${className}`}>
      <canvas
        ref={canvas}
        width={w}
        height={h}
        style={{ width: Math.round(w * scale), height: Math.round(h * scale), touchAction: "none" }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const [x, y] = pos(e);
          guard(() => logic.current?.down?.(x, y, e.pointerId));
        }}
        onPointerMove={(e) => {
          const [x, y] = pos(e);
          guard(() => logic.current?.move?.(x, y, e.pointerId));
        }}
        onPointerUp={(e) => {
          const [x, y] = pos(e);
          guard(() => logic.current?.up?.(x, y, e.pointerId));
        }}
        onPointerCancel={(e) => {
          const [x, y] = pos(e);
          guard(() => logic.current?.up?.(x, y, e.pointerId));
        }}
      />
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center village-bg/95 p-4 text-center">
          <div className="max-w-full border-4 border-[#4a2d1c] bg-[#d9453b] p-3 text-lg leading-5 text-white">
            <div className="mb-1 text-2xl">Xəta / Error</div>
            <div className="break-words">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
