// FestivalController:tda custom rounds (3..9) and random or hand-picked games.
// Scores summed, personal best saved, quest progress reported, tiered coin reward.

import { useEffect, useMemo, useState } from "react";
import { Btn, Icon, Modal, Panel, ScreenHeader } from "../components/ui";
import { GAME_LENGTHS, lengthDuration, type GameLength, FESTIVAL_MAX_ROUNDS, FESTIVAL_ROUNDS, FESTIVAL_TIERS, GAME_IDS, GAMES, type GameId } from "../game/data";
import { buildMap } from "../game/mapart";
import { finishFestival, type GameResult } from "../game/actions";
import { useSave } from "../game/store";
import { useT } from "../game/i18n";
import { sfx, setMusic } from "../game/audio";
import type { Nav } from "../game/routes";
import Shell from "../minigames/Shell";

type Phase = "lobby" | "playing" | "round" | "final";

function shuffled<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Festival({ nav }: { nav: Nav }) {
  const t = useT();
  const save = useSave();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [games, setGames] = useState<GameId[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [rounds, setRounds] = useState(FESTIVAL_ROUNDS);
  const [mode, setMode] = useState<"random" | "choose">("random");
  const [chosen, setChosen] = useState<GameId[]>([]);
  const [roundLen, setRoundLen] = useState<GameLength>("short");
  const [final, setFinal] = useState<{ total: number; tier: (typeof FESTIVAL_TIERS)[number]; newBest: boolean; coins: number } | null>(null);

  const pool = useMemo(() => GAME_IDS.filter((g) => save.unlocked_buildings.includes(GAMES[g].building)), [save.unlocked_buildings]);
  const art = useMemo(() => buildMap().buildingArt.square?.toDataURL(), []);
  const maxRounds = Math.min(pool.length, FESTIVAL_MAX_ROUNDS);
  const effRounds = mode === "choose" ? Math.max(FESTIVAL_ROUNDS, chosen.length) : Math.min(rounds, Math.max(FESTIVAL_ROUNDS, maxRounds));
  const idx = scores.length;
  const total = scores.reduce((a, b) => a + b, 0);

  useEffect(() => {
    setMusic(phase === "playing" ? "action" : "village");
  }, [phase]);

  // keep the stepper and the selection valid when the pool changes
  useEffect(() => {
    setRounds((r) => Math.min(Math.max(FESTIVAL_ROUNDS, r), Math.max(FESTIVAL_ROUNDS, maxRounds)));
    setChosen((c) => c.filter((g) => pool.includes(g)));
  }, [pool, maxRounds]);

  const toggle = (g: GameId) => {
    sfx("click");
    setChosen((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]));
  };

  const canStart = pool.length >= FESTIVAL_ROUNDS && (mode === "random" || chosen.length >= FESTIVAL_ROUNDS);

  const start = () => {
    if (!canStart) return;
    const list = mode === "random" ? shuffled(pool).slice(0, effRounds) : shuffled(chosen).slice(0, Math.max(chosen.length, FESTIVAL_ROUNDS));
    setGames(list);
    setScores([]);
    setFinal(null);
    setPhase("playing");
    sfx("festival_start");
  };

  const onRound = (r: GameResult) => {
    const next = [...scores, r.score];
    setScores(next);
    if (next.length >= games.length) {
      const sum = next.reduce((a, b) => a + b, 0);
      const res = finishFestival(sum, games.length);
      setFinal({ total: sum, tier: res.tier, newBest: res.newBest, coins: res.coins });
      setPhase("final");
      sfx(res.newBest ? "record" : "quest");
    } else {
      setPhase("round");
      sfx("quest");
    }
  };

  if (phase === "playing" && games[idx]) {
    return (
      <>
        <Shell
          key={`${games[idx]}-${idx}-${games.join()}`}
          game={games[idx]}
          festival={{ round: idx + 1, total: games.length, totalScore: total, length: roundLen }}
          onExit={() => setConfirm(true)}
          onComplete={onRound}
        />
        {confirm && (
          <Modal onClose={() => setConfirm(false)}>
            <Panel className="p-4 text-center">
              <h2 className="mb-1 text-3xl">{t("festival.abandon")}</h2>
              <p className="mb-3 text-xl">{t("festival.abandon_text")}</p>
              <div className="flex justify-center gap-2">
                <Btn variant="gray" onClick={() => setConfirm(false)}>
                  {t("common.no")}
                </Btn>
                <Btn
                  variant="red"
                  onClick={() => {
                    setConfirm(false);
                    setPhase("lobby");
                  }}
                >
                  {t("common.yes")}
                </Btn>
              </div>
            </Panel>
          </Modal>
        )}
      </>
    );
  }

  return (
    <div className="flex h-full flex-col village-bg">
      <ScreenHeader title={t("festival.title")} onBack={() => nav.go({ name: "village", spawn: "square" })} />
      <div className="px-scroll flex-1 overflow-y-auto p-3">
        {phase === "lobby" && (
          <>
            <Panel dark className="mb-3 flex flex-col items-center gap-2 p-3">
              {art && <img src={art} alt="" className="pixelated" style={{ width: 112 * 2.4, maxWidth: "100%" }} draggable={false} />}
              <p className="text-center text-xl text-[#e3d2a4]">{t("festival.desc")}</p>
            </Panel>
            <Panel className="mb-3 p-3">
              <div className="flex items-center justify-around text-2xl">
                <span className="flex items-center gap-1">
                  <Icon name="trophy" size={3} /> {t("festival.best", { score: save.festival_best_score })}
                </span>
              </div>
              <div className="mt-1 flex justify-around text-xl text-[#8a6a4e]">
                <span>{t("festival.last", { score: save.festival_last_score })}</span>
                <span>{t("festival.runs", { count: save.festival_runs })}</span>
              </div>
            </Panel>

            {/* how long each round runs */}
            <Panel className="mb-3 p-3">
              <div className="mb-2 text-2xl text-[#8f2d3b]">{t("festival.length_label")}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {GAME_LENGTHS.filter((l) => l !== "endless").map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      sfx("click");
                      setRoundLen(l);
                    }}
                    className={`border-4 border-[#4a2d1c] px-1 py-1 text-lg leading-4 ${
                      roundLen === l ? "bg-[#fbd54a] text-[#4a2d1c]" : "bg-white text-[#8a6a4e]"
                    }`}
                  >
                    <div>{t(`mini_games.common.length_${l}`)}</div>
                    <div className="text-base opacity-70">~{lengthDuration("maze", l)}s</div>
                  </button>
                ))}
              </div>
            </Panel>

            {/* rounds + mode */}
            <Panel className="mb-3 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-2xl text-[#8f2d3b]">{t("festival.rounds")}</span>
                {mode === "random" ? (
                  <div className="flex items-center gap-2">
                    <Btn small variant="gray" disabled={rounds <= FESTIVAL_ROUNDS} onClick={() => setRounds((r) => r - 1)}>
                      −
                    </Btn>
                    <span className="min-w-[36px] text-center text-3xl">{effRounds}</span>
                    <Btn small variant="gray" disabled={rounds >= maxRounds} onClick={() => setRounds((r) => r + 1)}>
                      +
                    </Btn>
                  </div>
                ) : (
                  <span className="text-2xl">{t("festival.chosen", { count: chosen.length })}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["random", "choose"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      sfx("click");
                      setMode(m);
                    }}
                    className={`border-4 border-[#4a2d1c] px-2 py-1 text-xl ${mode === m ? "bg-[#fbd54a] text-[#4a2d1c]" : "bg-white text-[#8a6a4e]"}`}
                  >
                    {m === "random" ? `🎲 ${t("festival.mode_random")}` : `✔ ${t("festival.mode_choose")}`}
                  </button>
                ))}
              </div>
              {mode === "choose" && <p className="mt-1 text-center text-lg text-[#8a6a4e]">{t("festival.choose_hint")}</p>}
            </Panel>

            <Panel className="mb-3 p-3">
              <div className="mb-2 text-xl text-[#8f2d3b]">{t("festival.pool")}</div>
              <div className="flex flex-wrap gap-2">
                {pool.map((g) =>
                  mode === "choose" ? (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggle(g)}
                      className={`flex items-center gap-1 border-4 px-2 py-1 text-lg ${
                        chosen.includes(g) ? "border-[#fbd54a] bg-[#207a7a] text-white shadow-[0_0_0_2px_#4a2d1c]" : "border-[#4a2d1c] bg-[#e3d2a4]"
                      }`}
                    >
                      <Icon name={GAMES[g].icon} size={2} /> {t(`mini_games.${g}.name`)}
                      {chosen.includes(g) && <span>✔</span>}
                    </button>
                  ) : (
                    <div key={g} className="flex items-center gap-1 border-2 border-[#4a2d1c] bg-[#e3d2a4] px-2 py-1 text-lg">
                      <Icon name={GAMES[g].icon} size={2} /> {t(`mini_games.${g}.name`)}
                    </div>
                  )
                )}
              </div>
              <p className="mt-2 text-lg text-[#8a6a4e]">{t("festival.rules")}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-lg">
                {[...FESTIVAL_TIERS].reverse().map((tier) => (
                  <span key={tier.id} className="flex items-center gap-1 border-2 border-[#4a2d1c] bg-white px-2">
                    {t(`festival.ranks.${tier.id}`)} {Math.round(tier.min * (effRounds / FESTIVAL_ROUNDS))}+ · <Icon name="coin" size={1} />{" "}
                    {tier.coins + Math.max(0, effRounds - FESTIVAL_ROUNDS) * 5}
                  </span>
                ))}
              </div>
            </Panel>
            {pool.length < FESTIVAL_ROUNDS && <p className="mb-2 text-center text-xl text-[#ff8a80]">{t("festival.need_games")}</p>}
            {mode === "choose" && pool.length >= FESTIVAL_ROUNDS && chosen.length < FESTIVAL_ROUNDS && (
              <p className="mb-2 text-center text-xl text-[#ff8a80]">{t("festival.choose_hint")}</p>
            )}
            <Btn variant="amber" className="w-full !text-3xl" disabled={!canStart} onClick={start}>
              ★ {t("festival.start")}
            </Btn>
          </>
        )}

        {phase === "round" && (
          <div className="px-textbox px-pop p-4 text-center">
            <h2 className="text-4xl">{t("festival.round_done")}</h2>
            <p className="mt-1 text-2xl text-[#8f2d3b]">{t("festival.round_score", { score: scores[scores.length - 1] ?? 0 })}</p>
            <div className="my-3 flex items-center justify-center gap-2 text-5xl">
              <Icon name="star" size={4} /> {total}
            </div>
            <div className="mb-3 text-xl text-[#8a6a4e]">{t("festival.total_score")}</div>
            <div className="mb-4 flex items-center justify-center gap-3 border-4 border-[#4a2d1c] px-wood p-3 text-[#f6ecd0]">
              <span className="text-xl">{t("festival.up_next")}:</span>
              <Icon name={GAMES[games[idx]].icon} size={4} />
              <span className="text-2xl">{t(`mini_games.${games[idx]}.name`)}</span>
            </div>
            <div className="mb-2 text-lg">{t("festival.played_here", { count: scores.length })}</div>
            <div className="mb-2 flex justify-center gap-1">
              {games.map((g, i) => (
                <div
                  key={i}
                  className="h-4 w-8 border-2 border-[#4a2d1c]"
                  style={{ background: i < scores.length ? "#6abe30" : i === scores.length ? "#fbd54a" : "#d8c9ad" }}
                  title={t(`mini_games.${g}.name`)}
                />
              ))}
            </div>
            <Btn variant="amber" className="w-full !text-3xl" onClick={() => setPhase("playing")}>
              ▶ {t("festival.continue")}
            </Btn>
          </div>
        )}

        {phase === "final" && final && (
          <div className="px-textbox px-pop p-4 text-center">
            <h2 className="text-4xl">{t("festival.final_title")}</h2>
            <div className="my-3 flex items-center justify-center gap-2 text-6xl text-[#8f2d3b]">
              <Icon name="trophy" size={6} className="px-float" /> {final.total}
            </div>
            {final.newBest && <div className="px-blink mb-2 text-3xl text-[#c96a1e]">★ {t("festival.new_best")} ★</div>}
            <div className="mb-1 text-2xl">
              {t("festival.rank")}: <b className="text-[#207a7a]">{t(`festival.ranks.${final.tier.id}`)}</b>
            </div>
            <div className="mb-3 flex items-center justify-center gap-1 text-2xl">
              <Icon name="coin" size={2} /> {t("festival.reward", { coins: final.coins })}
            </div>
            <div className="mb-3 flex flex-col gap-1 text-lg">
              {games.map((g, i) => (
                <div key={`${g}-${i}`} className="flex items-center justify-between border-2 border-[#4a2d1c] bg-[#e3d2a4] px-2 py-1">
                  <span className="flex items-center gap-1">
                    <Icon name={GAMES[g].icon} size={2} /> {t(`mini_games.${g}.name`)}
                  </span>
                  <b>{scores[i] ?? 0}</b>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn variant="gray" className="flex-1" onClick={() => setPhase("lobby")}>
                {t("common.back")}
              </Btn>
              <Btn variant="amber" className="flex-1" onClick={start}>
                ↻ {t("festival.again")}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
