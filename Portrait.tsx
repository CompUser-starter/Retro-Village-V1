import { charSprite, type Dir } from "../game/sprites";

const cache = new Map<string, { url: string; w: number; h: number }>();

/** A character rendered as a crisp, pixel-scaled <img>. Uses the sprite's real size. */
export function Portrait({ look, scale = 3, dir = "down", className = "" }: { look: string; scale?: number; dir?: Dir; className?: string }) {
  const key = `${look}|${dir}`;
  let p = cache.get(key);
  if (!p) {
    const c = charSprite(look, dir, 0);
    p = { url: c.toDataURL(), w: c.width, h: c.height };
    cache.set(key, p);
  }
  return (
    <img
      src={p.url}
      alt=""
      draggable={false}
      className={`pixelated inline-block shrink-0 ${className}`}
      style={{ width: p.w * scale, height: p.h * scale }}
    />
  );
}
