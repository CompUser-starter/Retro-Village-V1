import { useEffect, useState } from "react";
import { Bar, Btn, Icon, Panel, ScreenHeader } from "../components/ui";
import { ANIMALS, CROPS, CROP_IDS, GOODS, MAX_PLOTS, fmtTime } from "../game/data";
import { animalStatus, collectAnimal, harvestPlot, itemName, plantSeed, plotStatus, seedName, waterPlot } from "../game/actions";
import { useSave } from "../game/store";
import { useT } from "../game/i18n";
import { useNow } from "../game/hooks";
import { toast } from "../game/toast";
import { sfx } from "../game/audio";
import { Portrait } from "../components/Portrait";
import type { Nav } from "../game/routes";

export default function Farm({ nav }: { nav: Nav }) {
  const t = useT();
  const save = useSave();
  const now = useNow(500);
  const [seed, setSeed] = useState<string>("wheat");

  // auto-select a seed the player actually owns
  useEffect(() => {
    if ((save.inventory.seeds[seed] ?? 0) <= 0) {
      const own = CROP_IDS.find((c) => (save.inventory.seeds[c] ?? 0) > 0);
      if (own) setSeed(own);
    }
  }, [save.inventory.seeds, seed]);

  const onPlot = (i: number) => {
    const p = save.farm.plots[i];
    const st = plotStatus(p, Date.now());
    if (st.empty) {
      if ((save.inventory.seeds[seed] ?? 0) <= 0) {
        sfx("error");
        toast(CROP_IDS.some((c) => (save.inventory.seeds[c] ?? 0) > 0) ? t("farming.pick_seed") : t("farming.no_seed", { name: itemName("crops", seed) }), "bad");
        return;
      }
      plantSeed(i, seed);
    } else if (st.ready) harvestPlot(i);
    else if (!p!.watered) waterPlot(i);
    else {
      sfx("click");
      toast(t("farming.growing", { time: fmtTime(st.remaining) }), "info");
    }
  };

  return (
    <div className="flex h-full flex-col village-bg">
      <ScreenHeader title={t("farming.title")} onBack={() => nav.go({ name: "village", spawn: "farm" })} />
      <div className="px-scroll flex-1 overflow-y-auto p-3">
        <div className="mb-3 flex items-end gap-3">
          <Portrait look="shepherd" scale={3} />
          <Panel className="flex-1 p-2 text-lg leading-5">{t("farming.hint")}</Panel>
        </div>

        {/* orchard mini game */}
        <button
          type="button"
          onClick={() => nav.go({ name: "play", game: "apples", back: { name: "farm" } })}
          className="mb-3 flex w-full items-center gap-3 border-4 border-[#4a2d1c] bg-[#3fb8a8] p-2 text-left shadow-[0_4px_0_#4a2d1c] active:translate-y-0.5 active:shadow-none"
        >
          <Icon name="apple" size={4} />
          <div className="flex-1">
            <div className="text-2xl leading-6 text-white" style={{ textShadow: "2px 2px 0 #4a2d1c" }}>
              {t("mini_games.apples.name")}
            </div>
            <div className="text-lg leading-4 text-[#e3d2a4]">{t("mini_games.apples.pitch")}</div>
          </div>
          <span className="px-title text-3xl text-white" style={{ textShadow: "2px 2px 0 #4a2d1c" }}>
            ▶
          </span>
        </button>

        {/* plots */}
        <div
          className="mx-auto grid max-w-[360px] grid-cols-3 gap-2 border-4 border-[#4a2d1c] p-2"
          style={{ background: "repeating-linear-gradient(90deg,#5fae3f 0 12px,#63b343 12px 24px)" }}
        >
          {Array.from({ length: MAX_PLOTS }).map((_, i) => {
            if (i >= save.farm.plot_count) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sfx("error");
                    toast(t("shop.extra_plot"), "info", "lock");
                  }}
                  className="flex aspect-square flex-col items-center justify-center border-4 border-[#4a2d1c] bg-[#4a2d1c]/70"
                >
                  <Icon name="lock" size={3} />
                </button>
              );
            }
            const p = save.farm.plots[i];
            const st = plotStatus(p, now);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPlot(i)}
                className="relative flex aspect-square flex-col items-center justify-between border-4 border-[#4a2d1c] bg-[#7d5632] p-1 active:brightness-90"
                style={{ boxShadow: "inset 0 -6px 0 #5e3b26, inset 0 4px 0 #946a40" }}
              >
                {st.empty ? (
                  <span className="mt-4 text-3xl text-[#4a2d1c]/40">+</span>
                ) : (
                  <>
                    <div className={`mt-1 flex flex-1 items-center justify-center ${st.ready ? "px-float" : ""}`}>
                      {st.ready ? (
                        <Icon name={CROPS[p!.crop].icon} size={4} />
                      ) : st.pct < 0.5 ? (
                        <Icon name={`seed:${p!.crop}`} size={3} />
                      ) : (
                        <Icon name={CROPS[p!.crop].icon} size={3} style={{ opacity: 0.6, filter: "saturate(0.6)" }} />
                      )}
                    </div>
                    <div className="w-full">
                      <Bar pct={st.pct} color={st.ready ? "#fbd54a" : "#6abe30"} />
                      <div className="mt-0.5 text-center text-base leading-4 text-white" style={{ textShadow: "1px 1px 0 #4a2d1c" }}>
                        {st.ready ? t("farming.ready") : fmtTime(st.remaining)}
                      </div>
                    </div>
                    {p!.watered && !st.ready && <span className="absolute right-0.5 top-0.5 text-lg text-[#7fd6e8]">💧</span>}
                    {st.ready && <span className="px-blink absolute right-1 top-0 text-2xl text-[#fbd54a]">!</span>}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* seeds */}
        <Panel className="mt-3 p-2">
          <div className="mb-1 text-xl text-[#8f2d3b]">{t("farming.seeds_bar")}</div>
          <div className="grid grid-cols-3 gap-2">
            {CROP_IDS.map((c) => {
              const n = save.inventory.seeds[c] ?? 0;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    sfx("click");
                    setSeed(c);
                  }}
                  className={`flex flex-col items-center border-4 bg-white py-1 text-lg ${seed === c ? "border-[#fbd54a] shadow-[0_0_0_3px_#4a2d1c]" : "border-[#4a2d1c]"}`}
                  style={{ opacity: n > 0 ? 1 : 0.5 }}
                >
                  <Icon name={`seed:${c}`} size={3} />
                  <span className="leading-4">{itemName("crops", c)}</span>
                  <b>×{n}</b>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* animals */}
        <Panel className="mt-3 p-2">
          <div className="mb-1 text-xl text-[#8f2d3b]">{t("farming.animals")}</div>
          {save.farm.animals.length === 0 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg">{t("farming.no_animals")}</p>
              <Btn small variant="orange" onClick={() => nav.go({ name: "shop" })}>
                {t("shop.title")}
              </Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {save.farm.animals.map((a, i) => {
                const s = animalStatus(a, now);
                return (
                  <div key={i} className="flex items-center gap-3 border-2 border-[#4a2d1c] bg-[#e3d2a4] p-1">
                    <Icon name={a.type} size={4} />
                    <div className="flex-1 text-lg leading-5">
                      <div>{itemName("animals", a.type)}</div>
                      <div className="flex items-center gap-1 text-[#8a6a4e]">
                        <Icon name={GOODS[ANIMALS[a.type].product].icon} size={1} />
                        {s.stored > 0 ? t("farming.stored", { count: s.stored }) : t("farming.next_in", { time: fmtTime(s.nextIn) })}
                      </div>
                    </div>
                    <Btn small variant="green" disabled={s.stored <= 0} onClick={() => collectAnimal(i)}>
                      {t("farming.collect")}
                    </Btn>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
        <p className="px-title mt-2 text-center text-base text-[#fff4dc]">
          {t("farming.plots", { count: save.farm.plot_count })} · {seedName(seed)}
        </p>
      </div>
    </div>
  );
}
