import { useRef, useState, type ReactNode, type CSSProperties } from "react";
import { iconSize, iconUrl } from "../game/sprites";
import { ART } from "../game/assets";
import { uiIcon, uiIconUrl } from "../game/uipack";
import { sfx } from "../game/audio";
import { useSave } from "../game/store";
import { useToasts } from "../game/toast";
import { useT } from "../game/i18n";

/**
 * Icon lookup order:
 *  1. painted sheet art (src/assets, processed at start-up)
 *  2. the shared code-drawn UI pack (src/game/uipack.ts) – uniform style/scale/outline
 *  3. legacy per-sprite art
 */
export function Icon({ name, size = 2, className = "", style }: { name: string; size?: number; className?: string; style?: CSSProperties }) {
  const painted = ART.icons.get(name);
  if (painted) {
    const [w, h] = iconSize(name);
    const s = Math.max(w, h) * size;
    return (
      <img
        src={painted}
        alt=""
        draggable={false}
        className={`inline-block shrink-0 ${className}`}
        style={{ width: s, height: s, objectFit: "contain", ...style }}
      />
    );
  }
  const packed = uiIcon(name);
  if (packed) {
    // pack icons are 12px/16px art + 1px outline; render at a whole-pixel multiple so they stay crisp
    const scale = Math.max(1, Math.round((size * 8) / packed.width * 2) / 2);
    return (
      <img
        src={uiIconUrl(name)!}
        alt=""
        draggable={false}
        className={`pixelated inline-block shrink-0 ${className}`}
        style={{ width: packed.width * scale, height: packed.height * scale, ...style }}
      />
    );
  }
  const [w, h] = iconSize(name);
  return (
    <img
      src={iconUrl(name)}
      alt=""
      draggable={false}
      className={`pixelated inline-block shrink-0 ${className}`}
      style={{ width: w * size, height: h * size, ...style }}
    />
  );
}

type Variant = "teal" | "amber" | "orange" | "red" | "gray" | "green" | "purple";

export function Btn({
  children,
  onClick,
  variant = "teal",
  small,
  disabled,
  className = "",
  silent,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  small?: boolean;
  disabled?: boolean;
  className?: string;
  silent?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`px-btn ${variant === "teal" ? "" : variant} ${small ? "sm" : ""} ${className}`}
      onClick={() => {
        if (!silent) sfx("click");
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "", dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return <div className={`${dark ? "px-panel-dark" : "px-panel"} ${className}`}>{children}</div>;
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#2a1a10]/70 p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="px-framed px-pop w-full max-w-sm">{children}</div>
    </div>
  );
}

export function CoinChip({ className = "" }: { className?: string }) {
  const s = useSave();
  return (
    <div className={`px-chip ${className}`}>
      <Icon name="coin" size={2} />
      <span className="text-2xl leading-none">{s.coins}</span>
    </div>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  const t = useT();
  return (
    <div className="flex shrink-0 items-center gap-2 border-b-4 border-[#4a2d1c] px-wood px-2 py-2 text-white">
      {onBack ? (
        <Btn variant="gray" small onClick={onBack}>
          <Icon name="arrow" size={2} /> {t("common.back")}
        </Btn>
      ) : (
        <div className="w-2" />
      )}
      <h1 className="px-title flex-1 truncate text-center text-3xl text-[#fbd54a]">{title}</h1>
      <div className="min-w-[72px] text-right">{right ?? <CoinChip />}</div>
    </div>
  );
}

export function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="px-bar w-full">
      <div style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
    </div>
  );
}

export function Toasts() {
  const items = useToasts();
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-14 z-[60] flex flex-col items-center gap-2 px-3">
      {items.map((i) => (
        <div
          key={i.id}
          className={`px-slide flex max-w-full items-center gap-2 border-4 border-[#4a2d1c] px-3 py-1 text-xl shadow-[3px_3px_0_rgba(0,0,0,0.5)] ${
            i.kind === "good" ? "bg-[#fbd54a] text-[#4a2d1c]" : i.kind === "bad" ? "bg-[#d9453b] text-white" : "bg-[#f6ecd0] text-[#4a2d1c]"
          }`}
        >
          {i.icon && <Icon name={i.icon} size={2} />}
          <span>{i.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Virtual joystick. Reports x,y in [-1, 1]. */
export function Joystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 38;

  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    const m = Math.min(d, R);
    if (d > 0) {
      dx = (dx / d) * m;
      dy = (dy / d) * m;
    }
    setKnob({ x: dx, y: dy });
    onChange(dx / R, dy / R);
  };
  const release = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={base}
      className="relative h-[108px] w-[108px] touch-none rounded-full border-4 border-[#4a2d1c] bg-[rgba(74,45,28,0.55)] shadow-[0_0_0_3px_rgba(255,255,255,0.15)_inset]"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {[
        ["left-1/2 top-1 -translate-x-1/2", "▲"],
        ["left-1/2 bottom-1 -translate-x-1/2", "▼"],
        ["left-1 top-1/2 -translate-y-1/2", "◀"],
        ["right-1 top-1/2 -translate-y-1/2", "▶"],
      ].map(([pos, ch]) => (
        <span key={ch} className={`absolute ${pos} text-sm text-white/40`}>
          {ch}
        </span>
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border-4 border-[#4a2d1c] bg-[#3fb8a8] shadow-[0_-4px_0_rgba(255,255,255,0.3)_inset,0_-6px_0_#207a7a_inset]"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
