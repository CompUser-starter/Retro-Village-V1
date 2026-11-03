import { useEffect, useMemo, useRef, useState } from "react";
import { GameCanvas, type GameLogic } from "../components/GameCanvas";
import { Btn, CoinChip, Icon, Joystick, Modal, Panel } from "../components/ui";
import { BLDS, MH, MW, NPCS, SPAWN, TS, buildMap } from "../game/mapart";
import { CHAR_H, charSprite, iconCanvas, playerLook, type Dir } from "../game/sprites";
import { BUILDING_UNLOCK_COST, type BuildingId } from "../game/data";
import { getState, mutate, useSave } from "../game/store";
import { t, tRandom, useT } from "../game/i18n";
import { claimableCount } from "../game/quests";
import { nextGoal, unlockBuilding } from "../game/actions";
import { sfx } from "../game/audio";
import type { Nav } from "../game/routes";

const VW = 240;
const PLAYER_SPEED = 66;

type Near = { kind: "door"; id: BuildingId } | { kind: "npc"; id: string } | null;

function viewHeight(): number {
  const fw = Math.max(120, Math.min(480, window.innerWidth || 480));
  const fh = Math.max(120, Math.min(920, window.innerHeight || 640));
  // stay below the map height (480) so the camera always has valid offsets
  return Math.max(288, Math.min(464, Math.round(((VW * fh) / fw) / 8) * 8));
}

/** D-pad buttons control mode (up/down/left/right, diagonals supported). */
function DPad({ joy, disabled }: { joy: React.MutableRefObject<{ x: number; y: number }>; disabled: boolean }) {
  const pressed = useRef({ up: false, down: false, left: false, right: false });
  const [, force] = useState(0);
  const sync = () => {
    const p = pressed.current;
    joy.current = { x: (p.right ? 1 : 0) - (p.left ? 1 : 0), y: (p.down ? 1 : 0) - (p.up ? 1 : 0) };
    force((n) => n + 1);
  };
  useEffect(() => {
    if (disabled) {
      pressed.current = { up: false, down: false, left: false, right: false };
      joy.current = { x: 0, y: 0 };
      force((n) => n + 1);
    }
  }, [disabled, joy]);
  const btn = (dir: "up" | "down" | "left" | "right", label: string, cls: string) => (
    <button
      type="button"
      className={`flex h-[52px] w-[52px] items-center justify-center border-4 border-[#4a2d1c] text-2xl text-white ${cls} ${
        pressed.current[dir] ? "bg-[#fbd54a] !text-[#4a2d1c]" : "bg-[rgba(74,45,28,0.7)]"
      }`}
      style={{ textShadow: "2px 2px 0 #4a2d1c", touchAction: "none" }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pressed.current[dir] = true;
        sync();
      }}
      onPointerUp={() => {
        pressed.current[dir] = false;
        sync();
      }}
      onPointerCancel={() => {
        pressed.current[dir] = false;
        sync();
      }}
      onLostPointerCapture={() => {
        if (pressed.current[dir]) {
          pressed.current[dir] = false;
          sync();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
  return (
    <div className="grid grid-cols-3 gap-1 opacity-90">
      <div />
      {btn("up", "▲", "")}
      <div />
      {btn("left", "◀", "")}
      {btn("down", "▼", "")}
      {btn("right", "▶", "")}
    </div>
  );
}

/** Floating joystick: appears wherever the finger touches the map. */
function FreeStick({ joy, disabled }: { joy: React.MutableRefObject<{ x: number; y: number }>; disabled: boolean }) {
  const [stick, setStick] = useState<{ ox: number; oy: number; kx: number; ky: number } | null>(null);
  const id = useRef<number | null>(null);
  const R = 44;
  useEffect(() => {
    if (disabled) {
      id.current = null;
      setStick(null);
      joy.current = { x: 0, y: 0 };
    }
  }, [disabled, joy]);
  return (
    <div
      className="absolute inset-0 z-10"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (disabled || id.current !== null) return;
        id.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        setStick({ ox: e.clientX - r.left, oy: e.clientY - r.top, kx: 0, ky: 0 });
      }}
      onPointerMove={(e) => {
        if (id.current !== e.pointerId) return;
        const r = e.currentTarget.getBoundingClientRect();
        setStick((s) => {
          if (!s) return s;
          let dx = e.clientX - r.left - s.ox;
          let dy = e.clientY - r.top - s.oy;
          const d = Math.hypot(dx, dy);
          if (d > R) {
            dx = (dx / d) * R;
            dy = (dy / d) * R;
          }
          joy.current = { x: dx / R, y: dy / R };
          return { ...s, kx: dx, ky: dy };
        });
      }}
      onPointerUp={() => {
        id.current = null;
        setStick(null);
        joy.current = { x: 0, y: 0 };
      }}
      onPointerCancel={() => {
        id.current = null;
        setStick(null);
        joy.current = { x: 0, y: 0 };
      }}
    >
      {stick && (
        <div
          className="pointer-events-none absolute h-[104px] w-[104px] rounded-full border-4 border-[#4a2d1c] bg-[rgba(74,45,28,0.45)]"
          style={{ left: stick.ox - 52, top: stick.oy - 52 }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border-4 border-[#4a2d1c] bg-[#3fb8a8]"
            style={{ transform: `translate(calc(-50% + ${stick.kx}px), calc(-50% + ${stick.ky}px))` }}
          />
        </div>
      )}
    </div>
  );
}

export default function Village({ spawn, nav, blocked }: { spawn?: BuildingId; nav: Nav; blocked?: boolean }) {
  const tt = useT();
  const save = useSave();
  const VH = useMemo(viewHeight, []);
  const joy = useRef({ x: 0, y: 0 });
  const inputOn = useRef(true);
  const nearRef = useRef<Near>(null);
  const [near, setNear] = useState<Near>(null);
  const [dialog, setDialog] = useState<{ name: string; text: string } | null>(null);
  const [unlock, setUnlock] = useState<BuildingId | null>(null);
  const [tips, setTips] = useState(!getState().tip_seen);
  const actRef = useRef<() => void>(() => {});

  const modalOpen = !!dialog || !!unlock || tips || !!blocked;
  useEffect(() => {
    inputOn.current = !modalOpen;
    if (modalOpen) joy.current = { x: 0, y: 0 };
  }, [modalOpen]);

  actRef.current = () => {
    const n = nearRef.current;
    if (!n || modalOpen) return;
    if (n.kind === "npc") {
      sfx("dialog");
      setDialog({ name: t(`dialogue.names.${n.id}`), text: tRandom(`dialogue.${n.id}`) });
      return;
    }
    const id = n.id;
    const unlocked = getState().unlocked_buildings.includes(id);
    if (!unlocked) {
      setUnlock(id);
    } else {
      sfx("door");
      if (id === "home") nav.go({ name: "home" });
      else if (id === "farm") nav.go({ name: "farm" });
      else if (id === "shop") nav.go({ name: "shop" });
      else if (id === "square") nav.go({ name: "festival" });
      else if (id === "arcade" || id === "school" || id === "cafe" || id === "cave" || id === "pond")
        nav.go({ name: "building", id });
    }
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "e" || k === "enter" || k === " ") actRef.current();
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);

  const setup = ({ ctx, keys }: { ctx: CanvasRenderingContext2D; keys: Set<string> }): GameLogic => {
    const map = buildMap();
    const door = spawn ? BLDS.find((b) => b.id === spawn)?.door : undefined;
    const p = {
      x: door ? door.x * TS + 8 : SPAWN.x,
      y: door ? door.y * TS + 15 : SPAWN.y,
      dir: "down" as Dir,
      anim: 0,
      moving: false,
    };
    let time = 0;
    let lastNear = "";

    const npcRects = NPCS.map((n) => ({ ...n, fx: n.x * TS + 8, fy: n.y * TS + 14 }));

    const blockedAt = (x: number, y: number): boolean => {
      const l = x - 4;
      const r = x + 4;
      const tp = y - 5;
      const b = y;
      if (l < 0 || tp < 0 || r > MW * TS || b > MH * TS) return true;
      for (let ty = Math.floor(tp / TS); ty <= Math.floor((b - 0.01) / TS); ty++) {
        for (let tx = Math.floor(l / TS); tx <= Math.floor((r - 0.01) / TS); tx++) {
          if (map.solid[ty]?.[tx]) return true;
        }
      }
      for (const n of npcRects) {
        if (Math.abs(n.fx - x) < 8 && Math.abs(n.fy - y) < 5) return true;
      }
      return false;
    };

    const update = (dt: number) => {
      time += dt;
      let ix = 0;
      let iy = 0;
      if (inputOn.current) {
        if (keys.has("arrowleft") || keys.has("a")) ix -= 1;
        if (keys.has("arrowright") || keys.has("d")) ix += 1;
        if (keys.has("arrowup") || keys.has("w")) iy -= 1;
        if (keys.has("arrowdown") || keys.has("s")) iy += 1;
        const jm = Math.hypot(joy.current.x, joy.current.y);
        if (jm > 0.22) {
          ix += joy.current.x / jm;
          iy += joy.current.y / jm;
        }
      }
      const m = Math.hypot(ix, iy);
      if (m > 0.01) {
        ix /= Math.max(1, m);
        iy /= Math.max(1, m);
        const len = Math.hypot(ix, iy);
        ix /= len;
        iy /= len; // normalized: diagonal speed equals straight speed
        const nx = p.x + ix * PLAYER_SPEED * dt;
        if (!blockedAt(nx, p.y)) p.x = nx;
        const ny = p.y + iy * PLAYER_SPEED * dt;
        if (!blockedAt(p.x, ny)) p.y = ny;
        p.dir = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? "left" : "right") : iy < 0 ? "up" : "down";
        p.moving = true;
        p.anim += dt * 8;
      } else {
        p.moving = false;
        p.anim = 0;
      }

      // nearest interaction target
      let best: Near = null;
      let bd = 1e9;
      for (const b of BLDS) {
        const dx = b.door.x * TS + 8 - p.x;
        const dy = b.door.y * TS + 8 - (p.y - 4);
        const d = Math.hypot(dx, dy);
        if (d < 20 && d < bd) {
          bd = d;
          best = { kind: "door", id: b.id };
        }
      }
      for (const n of npcRects) {
        const d = Math.hypot(n.fx - p.x, n.fy - p.y);
        if (d < 24 && d < bd) {
          bd = d;
          best = { kind: "npc", id: n.id };
        }
      }
      const key = best ? `${best.kind}:${best.id}` : "";
      if (key !== lastNear) {
        lastNear = key;
        nearRef.current = best;
        setNear(best);
      }
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      const frame = map.frames[Math.floor(time * 1.5) % 2] ?? map.frames[0];
      // clamp the source rectangle to the real image size (defensive on old WebViews)
      const maxX = Math.max(0, Math.min(MW * TS - VW, frame.width - VW));
      const maxY = Math.max(0, Math.min(MH * TS - VH, frame.height - VH));
      const camX = Math.round(Math.min(Math.max(0, p.x - VW / 2), maxX));
      const camY = Math.round(Math.min(Math.max(0, p.y - 20 - VH / 2), maxY));
      ctx.drawImage(frame, camX, camY, VW, Math.min(VH, frame.height - camY), 0, 0, VW, VH);
      const fore = map.fore;
      ctx.drawImage(fore, camX, camY, VW, Math.min(VH, fore.height - camY), 0, 0, VW, VH);

      // lock icons on closed places
      const unlocked = getState().unlocked_buildings;
      for (const b of BLDS) {
        if (b.id === "pond" || !unlocked.includes(b.id)) {
          const lock = iconCanvas("lock");
          const cx = b.id === "pond" ? 11 * TS + 8 : b.x * TS + (b.w * TS) / 2;
          const cy = b.id === "pond" ? 22 * TS - 8 : (b.y + b.h) * TS - 20;
          ctx.drawImage(lock, Math.round(cx - lock.width / 2 - camX), Math.round(cy - camY - Math.sin(time * 3) * 1.5));
        }
      }

      // entities, y-sorted
      type Ent = { y: number; draw: () => void };
      const ents: Ent[] = [];
      const shadow = (x: number, y: number) => {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(Math.round(x - 5 - camX), Math.round(y - 1 - camY), 10, 3);
      };
      npcRects.forEach((n, i) => {
        ents.push({
          y: n.fy,
          draw: () => {
            shadow(n.fx, n.fy);
            const f = Math.floor(time / 0.7 + i) % 2 === 0 ? 0 : 2;
            const spr = charSprite(n.look, n.dir, f);
            ctx.drawImage(spr, Math.round(n.fx - spr.width / 2 - camX), Math.round(n.fy - spr.height + 2 - camY));
          },
        });
      });
      ents.push({
        y: p.y,
        draw: () => {
          shadow(p.x, p.y);
          const f = p.moving ? 1 + (Math.floor(p.anim) % 4) : 0;
          const spr = charSprite(playerLook(), p.dir, f);
          ctx.drawImage(spr, Math.round(p.x - spr.width / 2 - camX), Math.round(p.y - spr.height + 2 - camY));
        },
      });
      ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

      // interaction marker
      const n = nearRef.current;
      if (n) {
        let mx = 0;
        let my = 0;
        if (n.kind === "door") {
          const b = BLDS.find((x) => x.id === n.id)!;
          mx = b.door.x * TS + 8;
          my = b.door.y * TS - 2;
        } else {
          const nn = npcRects.find((x) => x.id === n.id)!;
          mx = nn.fx;
          my = nn.fy - CHAR_H - 2;
        }
        const bob = Math.round(Math.sin(time * 6) * 2);
        const sx = Math.round(mx - camX);
        const sy = Math.round(my - camY + bob);
        ctx.fillStyle = "#4a2d1c";
        ctx.fillRect(sx - 4, sy - 7, 9, 3);
        ctx.fillRect(sx - 3, sy - 4, 7, 2);
        ctx.fillRect(sx - 1, sy - 2, 3, 2);
        ctx.fillStyle = "#fbd54a";
        ctx.fillRect(sx - 3, sy - 6, 7, 1);
        ctx.fillRect(sx - 2, sy - 5, 5, 1);
        ctx.fillRect(sx - 1, sy - 4, 3, 1);
      }

      // time-of-day tint from the device clock
      const hr = new Date().getHours() + new Date().getMinutes() / 60;
      let tint = "";
      if (hr >= 20.5 || hr < 5) tint = "rgba(40,30,80,0.22)";
      else if (hr >= 18 && hr < 20.5) tint = "rgba(255,150,70,0.12)";
      else if (hr >= 5 && hr < 7) tint = "rgba(255,180,130,0.08)";
      if (tint) {
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, VW, VH);
      }
    };

    return { update, draw };
  };

  const goal = nextGoal(save);
  const claimable = claimableCount(save);
  const nearName =
    near?.kind === "door"
      ? t(`buildings.${near.id}.name`)
      : near?.kind === "npc"
        ? t(`dialogue.names.${near.id}`)
        : "";
  const nearLocked = near?.kind === "door" && (near.id === "pond" || !save.unlocked_buildings.includes(near.id));

  return (
    <div className="relative flex h-full flex-col bg-[#3a2a1e]">
      {/* HUD */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-start gap-2 p-2">
        <Btn variant="gray" small onClick={() => nav.go({ name: "menu" })}>
          <Icon name="home" size={2} />
        </Btn>
        <CoinChip />
        <div className="flex-1" />
        <button
          type="button"
          className="px-btn orange sm relative"
          onClick={() => {
            sfx("click");
            nav.overlay("quests");
          }}
        >
          <Icon name="scroll" size={2} />
          {claimable > 0 && (
            <span className="px-blink absolute -right-2 -top-3 border-2 border-[#4a2d1c] bg-[#d9453b] px-1.5 text-lg leading-none text-white">
              {claimable}
            </span>
          )}
        </button>
        <Btn variant="gray" small onClick={() => nav.overlay("settings")}>
          <Icon name="gear" size={2} />
        </Btn>
      </div>
      {goal && (
        <div className="pointer-events-none absolute left-2 right-2 top-14 z-10 flex justify-center">
          <div className="px-chip max-w-full text-lg text-[#fbd54a]">
            <Icon name="star" size={1} />
            <span className="truncate">{tt(goal.key, goal.args)}</span>
          </div>
        </div>
      )}

      <GameCanvas w={VW} h={VH} setup={setup} />

      {save.control_mode === "free" && <FreeStick joy={joy} disabled={modalOpen} />}

      {/* Controls */}
      <div className="absolute bottom-3 left-3 z-20">
        {save.control_mode === "buttons" ? (
          <DPad joy={joy} disabled={modalOpen} />
        ) : save.control_mode === "fixed" ? (
          <Joystick
            onChange={(x, y) => {
              joy.current = { x, y };
            }}
          />
        ) : null}
      </div>
      <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
        {near && (
          <button
            type="button"
            className="px-chip px-pop max-w-[200px] text-xl"
            onClick={() => actRef.current()}
            style={{ background: nearLocked ? "#8f2d3b" : "#207a7a" }}
          >
            <span className="truncate">
              {near.kind === "npc" ? tt("map.talk") : nearLocked ? tt("map.locked") : tt("map.enter")} · {nearName}
            </span>
          </button>
        )}
        <button
          type="button"
          className="h-[84px] w-[84px] rounded-full border-4 border-[#4a2d1c] bg-[#ef8f3a] text-4xl text-white shadow-[0_-4px_0_rgba(255,255,255,0.3)_inset,0_-8px_0_#c96a1e_inset,0_4px_0_#4a2d1c] active:translate-y-1"
          style={{ textShadow: "2px 2px 0 #4a2d1c", opacity: near ? 1 : 0.65 }}
          onPointerDown={() => actRef.current()}
        >
          A
        </button>
      </div>

      {/* Dialogue */}
      {dialog && (
        <div className="absolute inset-x-0 bottom-0 z-40 p-3">
          <Panel className="px-pop p-3">
            <div className="mb-1 text-2xl text-[#8f2d3b]">{dialog.name}</div>
            <p className="mb-3 text-[22px] leading-6">{dialog.text}</p>
            <div className="flex justify-end">
              <Btn small onClick={() => setDialog(null)}>
                {tt("common.ok")}
              </Btn>
            </div>
          </Panel>
        </div>
      )}

      {/* Unlock modal */}
      {unlock && (
        <Modal onClose={() => setUnlock(null)}>
          <Panel className="p-4 text-center">
            <Icon name="lock" size={4} className="mb-2" />
            <h2 className="mb-1 text-3xl">{tt("map.unlock_title", { name: tt(`buildings.${unlock}.name`) })}</h2>
            <p className="mb-3 text-xl">{tt("map.unlock_text", { coins: BUILDING_UNLOCK_COST[unlock] ?? 0 })}</p>
            <div className="flex justify-center gap-2">
              <Btn variant="gray" onClick={() => setUnlock(null)}>
                {tt("common.cancel")}
              </Btn>
              <Btn
                variant="orange"
                onClick={() => {
                  if (unlockBuilding(unlock)) setUnlock(null);
                }}
              >
                <Icon name="coin" size={2} /> {BUILDING_UNLOCK_COST[unlock] ?? 0}
              </Btn>
            </div>
          </Panel>
        </Modal>
      )}

      {/* First-run tips */}
      {tips && (
        <Modal>
          <Panel className="p-4">
            <h2 className="mb-2 text-center text-3xl text-[#8f2d3b]">{tt("tutorial.title")}</h2>
            {["tutorial.move", "tutorial.act", "tutorial.quests"].map((k, i) => (
              <p key={k} className="mb-2 flex items-start gap-2 text-xl leading-5">
                <span className="mt-0.5 shrink-0 border-2 border-[#4a2d1c] bg-[#fbd54a] px-1.5">{i + 1}</span>
                {tt(k)}
              </p>
            ))}
            <div className="mt-3 flex justify-center">
              <Btn
                onClick={() => {
                  mutate((d) => {
                    d.tip_seen = true;
                  });
                  setTips(false);
                }}
              >
                {tt("common.ok")}
              </Btn>
            </div>
          </Panel>
        </Modal>
      )}
    </div>
  );
}
