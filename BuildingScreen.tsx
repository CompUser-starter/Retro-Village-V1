import { useMemo, useState } from "react";
import { Btn, Icon, Panel, ScreenHeader } from "../components/ui";
import { Portrait } from "../components/Portrait";
import { GAME_IDS, GAMES, type GameId } from "../game/data";
import { roomUrl } from "../game/assets";
import { useSave } from "../game/store";
import { tRandom, useT } from "../game/i18n";
import { sfx } from "../game/audio";
import type { Nav } from "../game/routes";

type Id = "arcade" | "school" | "cafe" | "cave" | "pond";

const NPC_FOR: Partial<Record<Id, { id: string; look: string }>> = {
  school: { id: "teacher", look: "teacher" },
  cafe: { id: "cafe_owner", look: "cafe" },
};

export default function BuildingScreen({ id, nav }: { id: Id; nav: Nav }) {
  const t = useT();
  const save = useSave();
  const [seed, setSeed] = useState(0);
  const npc = NPC_FOR[id];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const line = useMemo(() => (npc ? tRandom(`dialogue.${npc.id}`) : ""), [npc?.id, seed, save.selected_language]);
  const games = GAME_IDS.filter((g) => GAMES[g].building === id);
  // the painted interior of this place fills the whole screen behind the cards
  const room = roomUrl(id);

  return (
    <div className="relative flex h-full flex-col overflow-hidden village-bg">
      {room && (
        <>
          <img src={room} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
          {/* gentle darkening so the white cards stay readable on top of the art */}
          <div className="pointer-events-none absolute inset-0 bg-[#2a1a10]/45" />
        </>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ScreenHeader title={t(`buildings.${id}.name`)} onBack={() => nav.go({ name: "village", spawn: id })} />
        <div className="px-scroll flex-1 overflow-y-auto p-3">
          <Panel dark className="mb-3 p-3">
            <p className="text-center text-xl text-[#e3d2a4]">{t(`buildings.${id}.desc`)}</p>
          </Panel>

          {npc && (
            <button
              type="button"
              className="mb-3 flex w-full items-end gap-3 text-left"
              onClick={() => {
                sfx("dialog");
                setSeed((s) => s + 1);
              }}
            >
              <Portrait look={npc.look} scale={4} />
              <div className="px-textbox relative flex-1 p-3">
                <div className="text-xl text-[#8f2d3b]">{t(`dialogue.names.${npc.id}`)}</div>
                <p className="text-xl leading-5">{line}</p>
              </div>
            </button>
          )}

          <div className="flex flex-col gap-3">
            {games.map((g) => (
              <GameCard key={g} game={g} onPlay={() => nav.go({ name: "play", game: g, back: { name: "building", id } })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, onPlay }: { game: GameId; onPlay: () => void }) {
  const t = useT();
  const save = useSave();
  const s = save.mini_games[game];
  return (
    <Panel className="flex items-center gap-3 p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center border-4 border-[#4a2d1c] px-wood">
        <Icon name={GAMES[game].icon} size={4} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-3xl leading-6">{t(`mini_games.${game}.name`)}</div>
        <div className="text-lg leading-5 text-[#8a6a4e]">{t(`mini_games.${game}.pitch`)}</div>
        <div className="mt-1 flex items-center gap-3 text-xl">
          <span className="flex items-center gap-1">
            <Icon name="trophy" size={2} />
            {s.personal_best}
          </span>
          <span className="text-[#8a6a4e]">{t("mini_games.common.plays", { count: s.plays })}</span>
        </div>
      </div>
      <Btn variant="amber" onClick={onPlay}>
        ▶
      </Btn>
    </Panel>
  );
}
