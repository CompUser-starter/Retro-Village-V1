import { useState } from "react";
import { Btn, Icon, Modal, Panel, ScreenHeader } from "../components/ui";
import { Portrait } from "../components/Portrait";
import RoomCanvas from "../components/RoomCanvas";
import { GAME_IDS, GAMES, CROP_IDS, SKINS, SKIN_IDS } from "../game/data";
import { equipSkin, itemName, ownsSkin, placeDecor, seedName, setPlayerName, skinName } from "../game/actions";
import { playerLook } from "../game/sprites";
import { getState, useSave } from "../game/store";
import { useT } from "../game/i18n";
import type { Nav } from "../game/routes";

type Tab = "room" | "bag" | "outfit" | "records";

const GENDERS: { g: "boy" | "girl" | "neutral"; key: string }[] = [
  { g: "boy", key: "shop.skins_boy" },
  { g: "girl", key: "shop.skins_girl" },
  { g: "neutral", key: "shop.skins_unisex" },
];

export default function Home({ nav }: { nav: Nav }) {
  const t = useT();
  const save = useSave();
  const [tab, setTab] = useState<Tab>("room");
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState(getState().player_name);
  const look = playerLook();

  const tabs: [Tab, string][] = [
    ["room", t("inventory.tab_room")],
    ["bag", t("inventory.tab_bag")],
    ["outfit", t("inventory.tab_outfit")],
    ["records", t("inventory.tab_records")],
  ];

  return (
    <div className="flex h-full flex-col village-bg">
      <ScreenHeader title={t("inventory.title")} onBack={() => nav.go({ name: "village", spawn: "home" })} />
      <div className="flex shrink-0 gap-1 px-wood px-2 pt-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 border-4 border-b-0 border-[#4a2d1c] px-1 py-1 text-xl ${
              tab === id ? "bg-[#f6ecd0] text-[#4a2d1c]" : "bg-[#a8784a] text-[#fff4dc]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-scroll flex-1 overflow-y-auto p-3">
        {tab === "room" && (
          <>
            <RoomCanvas placed={save.decorations.placed} look={look} onSlot={(i) => setSlot(i)} />
            <p className="px-title mt-2 text-center text-lg text-[#fff4dc]">{t("inventory.choose")}</p>
          </>
        )}

        {tab === "bag" && (
          <div className="flex flex-col gap-3">
            <BagSection title={t("inventory.seeds")} items={CROP_IDS.map((c) => ({ icon: `seed:${c}`, name: seedName(c), n: save.inventory.seeds[c] ?? 0 }))} empty={t("inventory.bag_empty")} />
            <BagSection
              title={t("inventory.crops")}
              items={Object.entries(save.inventory.crops).map(([c, n]) => ({ icon: c, name: itemName("crops", c), n }))}
              empty={t("inventory.bag_empty")}
            />
            <BagSection
              title={t("inventory.goods")}
              items={Object.entries(save.inventory.goods).map(([c, n]) => ({ icon: c, name: itemName("goods", c), n }))}
              empty={t("inventory.bag_empty")}
            />
          </div>
        )}

        {tab === "outfit" && (
          <div className="flex flex-col gap-3">
            <Panel className="flex items-center gap-3 p-3">
              <Portrait look={look} scale={4} />
              <div className="flex-1">
                <div className="text-3xl leading-7">{skinName(look)}</div>
                <div className="text-lg text-[#8a6a4e]">{t("inventory.wearing")}</div>
              </div>
              <Btn small variant="orange" onClick={() => nav.go({ name: "shop" })}>
                {t("shop.title")}
              </Btn>
            </Panel>
            {GENDERS.map(({ g, key }) => {
              const ids = SKIN_IDS.filter((id) => SKINS[id].gender === g);
              if (!ids.length) return null;
              return (
                <Panel key={g} className="p-3">
                  <h3 className="mb-2 text-2xl text-[#8f2d3b]">{t(key)}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ids.map((id) => {
                      const owned = ownsSkin(id);
                      const on = save.player_skin === id;
                      return (
                        <div
                          key={id}
                          className={`flex flex-col items-center border-4 bg-white p-2 text-center ${
                            on ? "border-[#fbd54a] shadow-[0_0_0_3px_#4a2d1c]" : "border-[#4a2d1c]"
                          }`}
                          style={{ opacity: owned ? 1 : 0.55 }}
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
                            <span className="mt-1 flex items-center gap-1 text-lg text-[#8a6a4e]">
                              <Icon name="coin" size={2} /> {SKINS[id].price}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              );
            })}
            <p className="px-title text-center text-lg text-[#fff4dc]">{t("inventory.buy_skins_hint")}</p>
          </div>
        )}

        {tab === "records" && (
          <div className="flex flex-col gap-3">
            <Panel className="p-3">
              <label className="mb-1 block text-xl text-[#8a6a4e]">{t("inventory.name")}</label>
              <input
                value={name}
                maxLength={14}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setPlayerName(name)}
                placeholder={t("main_menu.default_name")}
                className="w-full border-4 border-[#4a2d1c] bg-white px-2 py-1 text-2xl outline-none"
              />
            </Panel>
            <Panel className="p-3">
              <h3 className="mb-2 text-2xl text-[#8f2d3b]">{t("inventory.records_title")}</h3>
              {GAME_IDS.map((g) => (
                <div key={g} className="flex items-center justify-between border-b-2 border-dashed border-[#c4a064] py-1 text-xl">
                  <span className="flex items-center gap-2">
                    <Icon name={GAMES[g].icon} size={2} /> {t(`mini_games.${g}.name`)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="trophy" size={1} /> <b>{save.mini_games[g].personal_best}</b>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-1 text-xl">
                <span className="flex items-center gap-2">
                  <Icon name="star" size={2} /> {t("inventory.festival_best")}
                </span>
                <b>{save.festival_best_score}</b>
              </div>
              <div className="flex items-center justify-between py-1 text-xl text-[#8a6a4e]">
                <span>{t("inventory.total_plays")}</span>
                <b>{save.stats.played}</b>
              </div>
            </Panel>
          </div>
        )}
      </div>

      {slot !== null && (
        <Modal onClose={() => setSlot(null)}>
          <Panel className="p-4">
            <h2 className="mb-2 text-center text-3xl">{t("inventory.choose")}</h2>
            {save.decorations.owned.length === 0 ? (
              <p className="mb-3 text-center text-xl">{t("inventory.no_decor")}</p>
            ) : (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {save.decorations.owned.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      placeDecor(slot, id);
                      setSlot(null);
                    }}
                    className={`flex flex-col items-center border-4 bg-white p-2 text-lg ${save.decorations.placed[slot] === id ? "border-[#fbd54a]" : "border-[#4a2d1c]"}`}
                  >
                    <Icon name={id} size={4} />
                    <span className="mt-1 text-center leading-4">{itemName("decor", id)}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-center gap-2">
              {save.decorations.placed[slot] && (
                <Btn
                  variant="red"
                  small
                  onClick={() => {
                    placeDecor(slot, null);
                    setSlot(null);
                  }}
                >
                  {t("inventory.remove")}
                </Btn>
              )}
              {save.decorations.owned.length === 0 && (
                <Btn variant="amber" small onClick={() => nav.go({ name: "shop" })}>
                  {t("shop.title")}
                </Btn>
              )}
              <Btn variant="gray" small onClick={() => setSlot(null)}>
                {t("common.close")}
              </Btn>
            </div>
          </Panel>
        </Modal>
      )}
    </div>
  );
}

function BagSection({ title, items, empty }: { title: string; items: { icon: string; name: string; n: number }[]; empty: string }) {
  const shown = items.filter((i) => i.n > 0);
  return (
    <Panel className="p-3">
      <h3 className="mb-2 text-2xl text-[#8f2d3b]">{title}</h3>
      {shown.length === 0 ? (
        <p className="text-xl text-[#8a6a4e]">{empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {shown.map((i) => (
            <div key={i.icon} className="flex items-center gap-2 border-2 border-[#4a2d1c] bg-white p-1 text-xl">
              <Icon name={i.icon} size={3} />
              <span className="flex-1 leading-5">{i.name}</span>
              <b>×{i.n}</b>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
