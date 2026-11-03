// "Café Rush" – pick a guest, then tap the ingredients in the order shown before patience runs out.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/ui";
import { INGREDIENTS } from "../game/data";
import { charSprite } from "../game/sprites";
import { sfx } from "../game/audio";
import { t } from "../game/i18n";
import type { MiniApi } from "./types";

const EASY = [
  ["cup", "coffee"],
  ["cup", "tea"],
];
const MID = [
  ["cup", "coffee", "milk"],
  ["cup", "tea", "sugar"],
  ["cup", "coffee", "cake"],
  ["cup", "tea", "cake"],
];
const HARD = [
  ["cup", "coffee", "milk", "sugar"],
  ["cup", "tea", "milk", "sugar"],
  ["cup", "coffee", "milk", "cake"],
  ["cup", "tea", "sugar", "cake"],
];
const FACES = ["teacher", "elder", "shepherd", "shopkeeper", "cafe"];

const portraits = new Map<string, string>();
function portrait(look: string): string {
  let u = portraits.get(look);
  if (!u) {
    u = charSprite(look, "down", 0).toDataURL();
    portraits.set(look, u);
  }
  return u;
}

interface Customer {
  id: number;
  face: string;
  recipe: string[];
  progress: number;
  patience: number;
  max: number;
  exit: "happy" | "sad" | null;
  exitT: number;
}

interface State {
  slots: (Customer | null)[];
  selected: number;
  combo: number;
  lives: number;
  spawnT: number;
  nextId: number;
  msg: { id: number; text: string } | null;
  shake: number;
}

export default function CafeRush({ api }: { api: MiniApi }) {
  const st = useRef<State>({
    slots: [null, null, null],
    selected: 0,
    combo: 0,
    lives: 3,
    spawnT: 0.3,
    nextId: 1,
    msg: null,
    shake: 0,
  });
  const [, force] = useState(0);

  useEffect(() => {
    api.setLives(3);
    let last = performance.now();
    const spawn = () => {
      const s = st.current;
      const free = s.slots.findIndex((x) => x === null);
      if (free < 0) return;
      const d = Math.min(1, api.elapsed.current / api.duration);
      const r = Math.random();
      let pool = EASY;
      if (d < 0.12) pool = r < 0.35 ? EASY : MID;
      else if (d < 0.4) pool = r < 0.45 ? MID : HARD;
      else pool = r < 0.2 ? MID : HARD;
      const recipe = pool[Math.floor(Math.random() * pool.length)];
      const max = Math.max(5.5, 6.2 + recipe.length * 2.1 - d * 4.2);
      s.slots[free] = {
        id: s.nextId++,
        face: FACES[Math.floor(Math.random() * FACES.length)],
        recipe,
        progress: 0,
        patience: max,
        max,
        exit: null,
        exitT: 0,
      };
      if (s.slots[s.selected] === null) s.selected = free;
    };

    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      if (api.paused.current) return;
      const s = st.current;
      const d = Math.min(1, api.elapsed.current / api.duration);
      if (s.shake > 0) s.shake -= dt;

      s.spawnT -= dt;
      if (s.spawnT <= 0) {
        const occupied = s.slots.filter(Boolean).length;
        spawn();
        s.spawnT = Math.max(0.9, 3.4 - d * 2.3) * (occupied === 0 ? 0.25 : 1);
      }

      s.slots.forEach((c, i) => {
        if (!c) return;
        if (c.exit) {
          c.exitT -= dt;
          if (c.exitT <= 0) {
            s.slots[i] = null;
            if (s.selected === i) {
              const n = s.slots.findIndex((x) => x && !x.exit);
              if (n >= 0) s.selected = n;
            }
          }
          return;
        }
        c.patience -= dt;
        if (c.patience <= 0) {
          c.exit = "sad";
          c.exitT = 0.55;
          s.lives--;
          s.combo = 0;
          api.setLives(s.lives);
          sfx("hit");
          if (s.lives <= 0) api.finish("dead");
        }
      });
      force((n) => n + 1);
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (ing: string) => {
    if (api.paused.current) return;
    const s = st.current;
    const c = s.slots[s.selected];
    if (!c || c.exit) return;
    if (c.recipe[c.progress] === ing) {
      c.progress++;
      sfx("place");
      if (c.progress >= c.recipe.length) {
        s.combo++;
        const speed = Math.round((c.patience / c.max) * 20);
        const gain = 20 + c.recipe.length * 10 + speed + Math.min(s.combo - 1, 5) * 5;
        api.addScore(gain);
        sfx("coin");
        c.exit = "happy";
        c.exitT = 0.45;
        s.msg = { id: c.id, text: `+${gain}${s.combo > 1 ? ` · ${t("mini_games.common.combo", { count: s.combo })}` : ""}` };
        const n = s.slots.findIndex((x, i) => x && !x.exit && i !== s.selected);
        if (n >= 0) s.selected = n;
      }
    } else {
      c.progress = 0;
      s.combo = 0;
      s.shake = 0.25;
      sfx("error");
    }
    force((n) => n + 1);
  };

  const s = st.current;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#f2c9a0]">
      {/* wall + guests */}
      <div
        className="relative flex-1 px-2 pt-3"
        style={{
          background:
            "repeating-linear-gradient(90deg, #f6d9b0 0 18px, #f2c9a0 18px 36px)",
        }}
      >
        {/* hanging lamp + window decoration */}
        <div className="pointer-events-none absolute left-3 top-2 flex gap-2 opacity-90">
          <Icon name="lamp" size={2} />
        </div>
        <div className="pointer-events-none absolute right-3 top-2 opacity-90">
          <Icon name="picture" size={3} />
        </div>
        {s.msg && (
          <div key={s.msg.id} className="px-pop pointer-events-none absolute left-0 right-0 top-1 z-10 text-center text-3xl text-[#8f2d3b]">
            <span className="border-4 border-[#4a2d1c] bg-[#fbd54a] px-3">{s.msg.text}</span>
          </div>
        )}
        <div className={`mt-10 grid grid-cols-3 gap-2 ${s.shake > 0 ? "translate-x-1" : ""}`}>
          {s.slots.map((c, i) => (
            <button
              key={i}
              type="button"
              disabled={!c || !!c.exit}
              onPointerDown={() => {
                if (c && !c.exit) {
                  st.current.selected = i;
                  sfx("click");
                  force((n) => n + 1);
                }
              }}
              className={`relative flex min-h-[170px] flex-col items-center border-4 bg-[#f6ecd0] p-1 text-[#4a2d1c] transition-transform ${
                s.selected === i && c ? "-translate-y-1 border-[#fbd54a] shadow-[0_0_0_3px_#4a2d1c]" : "border-[#4a2d1c]"
              }`}
              style={{ opacity: c ? 1 : 0.35 }}
            >
              {c ? (
                <>
                  <img src={portrait(c.face)} alt="" className="pixelated" style={{ width: 54, height: 60 }} draggable={false} />
                  <div className="mt-1 w-full">
                    <div className="px-bar">
                      <div
                        style={{
                          width: `${Math.max(0, (c.patience / c.max) * 100)}%`,
                          background: c.patience / c.max > 0.5 ? "#6abe30" : c.patience / c.max > 0.25 ? "#fbd54a" : "#d9453b",
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-1 border-2 border-[#4a2d1c] bg-white p-1">
                    {c.recipe.map((ing, k) => (
                      <span key={k} className="relative">
                        <Icon name={ing} size={2} style={{ opacity: k < c.progress ? 0.2 : 1 }} />
                        {k < c.progress && <span className="absolute inset-0 flex items-center justify-center text-xl text-[#3e8948]">✔</span>}
                        {k === c.progress && <span className="px-blink absolute -bottom-1 left-0 right-0 h-[3px] bg-[#d9453b]" />}
                      </span>
                    ))}
                  </div>
                  {c.exit && (
                    <div className="px-pop absolute inset-0 flex items-center justify-center bg-white/70 text-5xl">
                      {c.exit === "happy" ? <Icon name="heart" size={5} /> : <span className="text-[#d9453b]">✖</span>}
                    </div>
                  )}
                </>
              ) : (
                <span className="mt-12 text-3xl text-[#8c87a6]">…</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* counter */}
      <div className="shrink-0 border-t-8 border-[#4a2d1c] bg-[#5e3b26] p-2 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {INGREDIENTS.map((ing) => (
            <button
              key={ing}
              type="button"
              onPointerDown={() => tap(ing)}
              className="flex flex-col items-center border-4 border-[#4a2d1c] bg-[#f6ecd0] py-2 text-[#4a2d1c] shadow-[0_4px_0_#4a2d1c] active:translate-y-1 active:shadow-none"
            >
              <Icon name={ing} size={4} />
              <span className="mt-1 text-xl leading-none">{t(`items.ingredients.${ing}`)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
