import { useMemo, useState } from "react";
import { Btn, Icon, Panel, ScreenHeader } from "../components/ui";
import { Portrait } from "../components/Portrait";
import {
  ANIMALS,
  BUILDING_UNLOCK_COST,
  CROPS,
  CROP_IDS,
  DECOR,
  DECOR_IDS,
  GOODS,
  SKINS,
  SKIN_IDS,
  fmtTime,
  type BuildingId,
} from "../game/data";
import {
  MAX_PER_ANIMAL,
  animalCount,
  buyAnimal,
  buyDecor,
  buyPlot,
  buySeed,
  buySkin,
  equipSkin,
  itemName,
  nextPlotPrice,
  sellAll,
  sellItem,
  sellableCount,
  seedName,
  skinName,
  unlockBuilding,
} from "../game/actions";
import { useSave } from "../game/store";
import { tRandom, useT } from "../game/i18n";
import { sfx } from "../game/audio";
import type { Nav } from "../game/routes";

type Tab = "seeds" | "decor" | "skins" | "village" | "sell";

function Row({
  icon,
  iconSize = 4,
  title,
  desc,
  children,
}: {
  icon: string;
  iconSize?: number;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="flex items-center gap-3 p-2">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-[#4a2d1c] px-wood">
        <Icon name={icon} size={iconSize} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl leading-6">{title}</div>
        {desc && <div className="text-base leading-4 text-[#8a6a4e]">{desc}</div>}
      </div>
      <div className="flex shrink-0 flex-col gap-1">{children}</div>
    </Panel>
  );
}

function Price({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1">
      <Icon name="coin" size={2} /> {n}
    </span>
  );
}

const GENDERS: { g: "boy" | "girl" | "neutral"; key: string }[] = [
  { g: "boy", key: "shop.skins_boy" },
  { g: "girl", key: "shop.skins_girl" },
  { g: "neutral", key: "shop.skins_unisex" },
];

export default function Shop({ nav }: { nav: Nav }) {
  const t = useT();
  const save = useSave();
  const [tab, setTab] = useState<Tab>("seeds");
  const line = useMemo(() => tRandom("dialogue.shopkeeper"), []);

  const tabs: [Tab, string][] = [
    ["seeds", t("shop.tab_seeds")],
    ["decor", t("shop.tab_decor")],
    ["skins", t("shop.tab_skins")],
    ["village", t("shop.tab_village")],
    ["sell", t("shop.tab_sell")],
  ];
  const plotPrice = nextPlotPrice(save);
  const sellables = sellableCount(save);

  return (
    <div className="flex h-full flex-col village-bg">
      <ScreenHeader title={t("shop.title")} onBack={() => nav.go({ name: "village", spawn: "shop" })} />
      <div className="flex shrink-0 items-end gap-2 px-wood px-3 pb-2 pt-2">
        <Portrait look="shopkeeper" scale={3} />
        <Panel className="flex-1 p-2 text-lg leading-5">{line}</Panel>
      </div>
      <div className="flex shrink-0 gap-1 px-wood px-2 pt-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              sfx("click");
              setTab(id);
            }}
            className={`flex-1 border-4 border-b-0 border-[#4a2d1c] px-1 py-1 text-lg ${tab === id ? "bg-[#f6ecd0] text-[#4a2d1c]" : "bg-[#a8784a] text-[#fff4dc]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {tab === "seeds" &&
          CROP_IDS.map((c) => (
            <Row
              key={c}
              icon={`seed:${c}`}
              title={seedName(c)}
              desc={`${t("shop.seed_desc", { time: fmtTime(CROPS[c].grow), coins: CROPS[c].sell })} · ${t("shop.owned_count", { count: save.inventory.seeds[c] ?? 0 })}`}
            >
              <Btn small variant="orange" onClick={() => buySeed(c, 1)}>
                <Price n={CROPS[c].price} />
              </Btn>
              <Btn small variant="gray" onClick={() => buySeed(c, 5)}>
                ×5 <Price n={CROPS[c].price * 5} />
              </Btn>
            </Row>
          ))}

        {tab === "decor" &&
          DECOR_IDS.map((d) => {
            const owned = save.decorations.owned.includes(d);
            return (
              <Row key={d} icon={d} iconSize={d === "rug" ? 3 : 4} title={itemName("decor", d)} desc={t("shop.decor_desc")}>
                <Btn small variant={owned ? "gray" : "orange"} disabled={owned} onClick={() => buyDecor(d)}>
                  {owned ? t("common.owned") : <Price n={DECOR[d].price} />}
                </Btn>
              </Row>
            );
          })}

        {tab === "skins" && (
          <>
            <Panel className="flex items-center gap-3 p-2">
              <Portrait look={save.player_skin} scale={3} />
              <div className="flex-1 text-lg leading-5">{t("shop.skin_desc")}</div>
            </Panel>
            {GENDERS.map(({ g, key }) => {
              const ids = SKIN_IDS.filter((id) => SKINS[id].gender === g);
              if (!ids.length) return null;
              return (
                <Panel key={g} className="p-2">
                  <h3 className="mb-2 text-2xl text-[#8f2d3b]">{t(key)}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ids.map((id) => {
                      const owned = save.owned_skins.includes(id);
                      const on = save.player_skin === id;
                      return (
                        <div
                          key={id}
                          className={`flex flex-col items-center border-4 bg-white p-2 text-center ${
                            on ? "border-[#fbd54a] shadow-[0_0_0_3px_#4a2d1c]" : "border-[#4a2d1c]"
                          }`}
                        >
                          <Portrait look={id} scale={3} />
                          <div className="mt-1 text-xl leading-5">{skinName(id)}</div>
                          {on ? (
                            <span className="mt-1 text-lg text-[#3e8948]">✔ {t("common.wearing")}</span>
                          ) : owned ? (
                            <Btn small className="mt-1" onClick={() => equipSkin(id)}>
                              {t("common.wear")}
                            </Btn>
                          ) : (
                            <Btn small variant="orange" className="mt-1" onClick={() => buySkin(id)}>
                              <Price n={SKINS[id].price} />
                            </Btn>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              );
            })}
          </>
        )}

        {tab === "village" && (
          <>
            <Row icon="wheat" title={t("shop.extra_plot")} desc={`${t("shop.extra_plot_desc")} · ${t("farming.plots", { count: save.farm.plot_count })}`}>
              <Btn small variant="orange" disabled={plotPrice === null} onClick={() => buyPlot()}>
                {plotPrice === null ? t("common.max") : <Price n={plotPrice} />}
              </Btn>
            </Row>
            {Object.keys(ANIMALS).map((a) => {
              const n = animalCount(save, a);
              const maxed = n >= MAX_PER_ANIMAL;
              return (
                <Row
                  key={a}
                  icon={a}
                  title={itemName("animals", a)}
                  desc={`${t("shop.animal_desc", { name: itemName("goods", ANIMALS[a].product), time: fmtTime(ANIMALS[a].interval) })} · ${n}/${MAX_PER_ANIMAL}`}
                >
                  <Btn small variant="orange" disabled={maxed} onClick={() => buyAnimal(a)}>
                    {maxed ? t("common.max") : <Price n={ANIMALS[a].price} />}
                  </Btn>
                </Row>
              );
            })}
            {(Object.keys(BUILDING_UNLOCK_COST) as BuildingId[]).map((b) => {
              const unlocked = save.unlocked_buildings.includes(b);
              return (
                <Row key={b} icon={unlocked ? "star" : "lock"} title={t("shop.unlock_building", { name: t(`buildings.${b}.name`) })} desc={t(`buildings.${b}.desc`)}>
                  <Btn small variant={unlocked ? "gray" : "orange"} disabled={unlocked} onClick={() => unlockBuilding(b)}>
                    {unlocked ? t("common.owned") : <Price n={BUILDING_UNLOCK_COST[b] ?? 0} />}
                  </Btn>
                </Row>
              );
            })}
          </>
        )}

        {tab === "sell" && (
          <>
            {sellables === 0 && <Panel className="p-4 text-center text-xl">{t("shop.nothing_sell")}</Panel>}
            {Object.entries(save.inventory.crops)
              .filter(([, n]) => n > 0)
              .map(([c, n]) => (
                <Row key={c} icon={c} title={`${itemName("crops", c)} ×${n}`} desc={`${CROPS[c].sell} / ${t("common.sell")}`}>
                  <Btn
                    small
                    variant="green"
                    onClick={() => {
                      const coins = sellItem("crops", c, n);
                      if (coins) {
                        sfx("coin");
                      }
                    }}
                  >
                    <Price n={CROPS[c].sell * n} />
                  </Btn>
                </Row>
              ))}
            {Object.entries(save.inventory.goods)
              .filter(([, n]) => n > 0)
              .map(([c, n]) => (
                <Row key={c} icon={GOODS[c].icon} title={`${itemName("goods", c)} ×${n}`} desc={`${GOODS[c].sell} / ${t("common.sell")}`}>
                  <Btn
                    small
                    variant="green"
                    onClick={() => {
                      const coins = sellItem("goods", c, n);
                      if (coins) {
                        sfx("coin");
                      }
                    }}
                  >
                    <Price n={GOODS[c].sell * n} />
                  </Btn>
                </Row>
              ))}
            {sellables > 0 && (
              <Btn variant="amber" className="mt-1 w-full" onClick={() => sellAll()}>
                {t("shop.sell_all")}
              </Btn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
