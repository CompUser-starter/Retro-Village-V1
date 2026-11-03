// MiniGameShell: generic wrapper (equivalent of MiniGameBase).
// Handles intro, length choice, countdown, HUD, pause, timer, personal best,
// coin payout and quest reporting. Each mini game implements only its mechanics.

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Bar, Btn, Icon } from "../components/ui";
import { GAME_LENGTHS, GAMES, fmtTime, lengthDuration, type GameId, type GameLength } from "../game/data";
import { mutate, useSave } from "../game/store";
import { useT } from "../game/i18n";
import { recordGameResult, type GameResult } from "../game/actions";
import { sfx } from "../game/audio";
import type { MiniApi } from "./types";
import Maze from "./Maze";
import Blocks from "./Blocks";
import Shooter from "./Shooter";
import CaveRun from "./CaveRun";
import CafeRush from "./CafeRush";
import Snake from "./Snake";
import Climb from "./Climb";
import Rhythm from "./Rhythm";
import Fishing from "./Fishing";
import Castle from "./Castle";
import Apples from "./Apples";
import CarRide from "./CarRide";
import Flap from "./Flap";

const COMPONENTS: Record<GameId, ComponentType<{ api: MiniApi }>> = {
  maze: Maze,
  blocks: Blocks,
  shooter: Shooter,
  cave: CaveRun,
  cafe: CafeRush,
  snake: Snake,
  climb: Climb,
  rhythm: Rhythm,
  fish: Fishing,
  castle: Castle,
  apples: Apples,
  car: CarRide,
  bird: Flap,
};

type Phase = "intro" | "count" | "playing" | "paused" | "over";

export interface FestivalInfo {
  round: number;
  total: number;
  totalScore: number;
  /** length picked in the festival lobby; falls back to the short festival timing */
  length?: GameLength;
}

export default function Shell({
  game,
  festival,
  onExit,
  onComplete,
}: {
  game: GameId;
  festival?: FestivalInfo;
  onExit: () => void;
  onComplete?: (r: GameResult) => void;
}) {
  const t = useT();
  const save = useSave();
  const def = GAMES[game];
  const [len, setLen] = useState<GameLength>(save.game_length);
  const endless = !festival && len === "endless";
  const duration = festival ? (festival.length ? lengthDuration(game, festival.length) : def.festDuration) : lengthDuration(game, len);
  const [phase, setPhase] = useState<Phase>("intro");
  const [runId, setRunId] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<GameResult | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const scoreRef = useRef(0);
  const pausedRef = useRef(true);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const endlessRef = useRef(endless);
  endlessRef.current = endless;

  useEffect(() => {
    pausedRef.current = phase !== "playing";
  }, [phase]);

  const finish = useCallback(
    (reason: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      pausedRef.current = true;
      const r = recordGameResult(game, Math.floor(scoreRef.current), reason, !!festival);
      setResult(r);
      setScore(r.score);
      setPhase("over");
      if (r.new_record) sfx("record");
      else if (reason === "time") sfx("quest");
      if (festival && onComplete) setTimeout(() => onComplete(r), 1500);
    },
    [game, festival, onComplete]
  );

  const api: MiniApi = useMemo(
    () => ({
      addScore: (n: number) => {
        scoreRef.current += n;
        setScore(Math.floor(scoreRef.current));
      },
      setLives,
      finish,
      paused: pausedRef,
      elapsed: elapsedRef,
      duration,
      festival: !!festival,
      score: scoreRef,
    }),
    [finish, duration, festival]
  );

  const reset = () => {
    scoreRef.current = 0;
    elapsedRef.current = 0;
    doneRef.current = false;
    setScore(0);
    setLives(-1);
    setTimeLeft(endlessRef.current ? 0 : duration);
    setResult(null);
    setRunId((x) => x + 1);
  };

  const startCountdown = () => {
    reset();
    setCount(3);
    setPhase("count");
    sfx(festival ? "festival_start" : "tick");
  };

  const pickLength = (l: GameLength) => {
    setLen(l);
    mutate((d) => {
      d.game_length = l;
    });
  };

  // countdown
  useEffect(() => {
    if (phase !== "count") return;
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase("playing");
          return 0;
        }
        sfx("tick");
        return c - 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [phase]);

  // timer (endless runs never auto-finish; the HUD counts up instead)
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    let shown = -1;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsedRef.current += dt;
      if (endlessRef.current) {
        const s = Math.floor(elapsedRef.current);
        if (s !== shown) {
          shown = s;
          setTimeLeft(elapsedRef.current);
        }
      } else {
        const left = Math.max(0, duration - elapsedRef.current);
        const s = Math.ceil(left);
        if (s !== shown) {
          shown = s;
          setTimeLeft(left);
        }
        if (left <= 0) {
          finish("time");
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, duration, finish]);

  // auto-pause when the tab/app goes to background
  useEffect(() => {
    const vis = () => {
      if (document.hidden && phaseRef.current === "playing") setPhase("paused");
    };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  const Game = COMPONENTS[game];
  const stats = save.mini_games[game];
  const running = phase === "count" || phase === "playing" || phase === "paused" || phase === "over";
  const low = !endless && timeLeft <= 10;

  const reasonText =
    result?.reason === "dead"
      ? t("results.reason_dead")
      : result?.reason === "stuck"
        ? t("results.reason_stuck")
        : result?.reason === "done"
          ? t("results.reason_done")
          : t("results.reason_time");

  return (
    <div className="relative flex h-full flex-col bg-[#3a2a1e]">
      {/* HUD */}
      <div className="shrink-0 border-b-4 border-[#4a2d1c] px-wood px-2 py-1.5 text-white">
        <div className="flex items-center gap-2">
          {phase === "playing" || phase === "count" ? (
            <Btn variant="gray" small onClick={() => setPhase("paused")} silent={false}>
              ❚❚
            </Btn>
          ) : (
            <Btn variant="gray" small onClick={() => (phase === "over" || phase === "intro" ? onExit() : setConfirmExit(true))}>
              ◀
            </Btn>
          )}
          <div className="flex-1 truncate text-center text-2xl text-[#fbd54a]">{t(`mini_games.${game}.name`)}</div>
          <div className="flex min-w-[64px] justify-end gap-0.5">
            {lives >= 0 &&
              Array.from({ length: Math.max(0, lives) }).map((_, i) => <Icon key={i} name="heart" size={2} />)}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex items-center gap-1 text-2xl">
            <Icon name="star" size={2} /> <span className="min-w-[56px]">{score}</span>
          </div>
          <div className="flex-1">
            <Bar pct={endless ? 1 : timeLeft / duration} color={endless ? "#4a90d9" : low ? "#d9453b" : "#6abe30"} />
          </div>
          <div className={`min-w-[64px] text-right text-2xl ${low ? "px-blink text-[#ff8a80]" : ""}`}>
            {endless ? `∞ ${fmtTime(timeLeft)}` : fmtTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Festival progress lives here, outside the game's own HUD */}
      {festival && (
        <div className="flex shrink-0 items-center gap-2 border-b-4 border-[#4a2d1c] bg-[#a8784a] px-2 py-1">
          <span className="text-lg text-[#fff4dc]">
            {t("festival.progress", { round: festival.round, total: festival.total })}
          </span>
          <div className="flex flex-1 gap-1">
            {Array.from({ length: festival.total }).map((_, i) => (
              <div
                key={i}
                className="h-3 flex-1 border-2 border-[#4a2d1c]"
                style={{ background: i < festival.round - 1 ? "#6abe30" : i === festival.round - 1 ? "#fbd54a" : "#7d5632" }}
              />
            ))}
          </div>
          <span className="flex items-center gap-1 text-lg text-[#fff4dc]">
            <Icon name="star" size={1} /> {festival.totalScore}
          </span>
        </div>
      )}

      {/* Game area */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {running && <Game key={runId} api={api} />}

        {/* countdown */}
        {phase === "count" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div key={count} className="px-pop px-title text-[96px] text-[#fbd54a]">
              {count}
            </div>
          </div>
        )}

        {/* intro */}
        {phase === "intro" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#4a2d1c]/70 p-4">
            <div className="px-textbox px-pop w-full max-w-sm p-4 text-center">
              <div className="mb-2 flex justify-center">
                <Icon name={def.icon} size={6} className="px-float" />
              </div>
              <h2 className="text-4xl leading-8">{t(`mini_games.${game}.name`)}</h2>
              <p className="mt-1 text-xl text-[#8a6a4e]">{t(`mini_games.${game}.pitch`)}</p>
              <div className="mx-auto my-3 border-2 border-[#4a2d1c] bg-[#e3d2a4] p-2 text-xl leading-5">
                {t(`mini_games.${game}.how`)}
              </div>
              {festival ? (
                <div className="mb-3 text-xl">
                  {t("festival.total_score")}: <b className="text-[#8f2d3b]">{festival.totalScore}</b>
                </div>
              ) : (
                <>
                  <div className="mb-1 text-xl text-[#8f2d3b]">{t("mini_games.common.length_label")}</div>
                  <div className="mb-3 grid grid-cols-4 gap-1.5">
                    {GAME_LENGTHS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          sfx("click");
                          pickLength(l);
                        }}
                        className={`border-4 border-[#4a2d1c] px-1 py-1 text-lg leading-4 ${
                          len === l ? "bg-[#fbd54a] text-[#4a2d1c]" : "bg-white text-[#8a6a4e]"
                        }`}
                      >
                        <div>{t(`mini_games.common.length_${l}`)}</div>
                        <div className="text-base opacity-70">{l === "endless" ? "∞" : `${lengthDuration(game, l)}s`}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mb-3 flex justify-center gap-4 text-xl">
                    <span className="flex items-center gap-1">
                      <Icon name="trophy" size={2} /> {t("common.best")}: <b>{stats.personal_best}</b>
                    </span>
                    <span>{t("mini_games.common.plays", { count: stats.plays })}</span>
                  </div>
                </>
              )}
              <p className="mb-3 text-lg text-[#8a6a4e]">
                {festival || endless ? t(`mini_games.common.length_${festival ? "medium" : len}`) : t("mini_games.common.session", { count: duration })}
              </p>
              <div className="flex justify-center gap-2">
                <Btn variant="gray" onClick={onExit}>
                  {t("common.back")}
                </Btn>
                <Btn variant="amber" onClick={startCountdown}>
                  <Icon name="play" size={2} /> {t("common.start")}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* leaving the run: never records a score */}
        {confirmExit && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2a1a10]/80 p-4">
            <div className="px-textbox px-pop w-full max-w-xs p-4 text-center">
              <h2 className="mb-1 text-3xl">{t("common.exit_confirm")}</h2>
              <p className="mb-3 text-xl leading-5">{t("common.exit_text")}</p>
              <div className="flex justify-center gap-2">
                <Btn
                  variant="gray"
                  onClick={() => {
                    setConfirmExit(false);
                    if (phase === "playing") setPhase("paused");
                  }}
                >
                  {t("common.no")}
                </Btn>
                <Btn variant="red" onClick={onExit}>
                  {t("common.yes")}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* pause */}
        {phase === "paused" && !confirmExit && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2a1a10]/75 p-4">
            <div className="px-textbox px-pop w-full max-w-xs p-4 text-center">
              <h2 className="mb-3 text-4xl">{t("mini_games.common.paused")}</h2>
              <div className="flex flex-col gap-2">
                <Btn onClick={() => setPhase("playing")}>▶ {t("common.resume")}</Btn>
                <Btn variant="red" onClick={() => setConfirmExit(true)}>
                  {t("common.exit")}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* result */}
        {phase === "over" && result && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2a1a10]/75 p-4">
            <div className="px-textbox px-pop w-full max-w-sm p-4 text-center">
              <h2 className="text-4xl">
                {result.reason === "time" ? t("mini_games.common.time_up") : t("mini_games.common.game_over")}
              </h2>
              <p className="text-xl text-[#8a6a4e]">{reasonText}</p>
              <div className="my-3 flex items-center justify-center gap-2 text-5xl text-[#8f2d3b]">
                <Icon name="star" size={4} /> {result.score}
              </div>
              {festival ? (
                <p className="text-xl">{t("results.festival_note")}</p>
              ) : (
                <>
                  {result.new_record ? (
                    <div className="px-blink mb-2 text-3xl text-[#c96a1e]">★ {t("results.new_record")} ★</div>
                  ) : (
                    <div className="mb-2 flex items-center justify-center gap-1 text-xl">
                      <Icon name="trophy" size={2} /> {t("results.best")}: <b>{result.best}</b>
                    </div>
                  )}
                  <div className="mb-3 flex items-center justify-center gap-1 text-2xl">
                    <Icon name="coin" size={2} /> {t("results.coins", { coins: result.coins })}
                  </div>
                  <div className="flex justify-center gap-2">
                    <Btn variant="gray" onClick={onExit}>
                      {t("common.back")}
                    </Btn>
                    <Btn variant="amber" onClick={startCountdown}>
                      ↻ {t("common.retry")}
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
