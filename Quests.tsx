import { Bar, Btn, Icon, Panel, ScreenHeader } from "../components/ui";
import { fmtHMS } from "../game/data";
import { claimReward, msUntilNextWeek, msUntilTomorrow } from "../game/quests";
import { itemName } from "../game/actions";
import type { QuestObj } from "../game/save";
import { useSave } from "../game/store";
import { questTitle, useT } from "../game/i18n";
import { useNow } from "../game/hooks";

function QuestCard({ q }: { q: QuestObj }) {
  const t = useT();
  const pct = q.progress / q.target;
  return (
    <Panel className={`p-2 ${q.claimed ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          <Icon name={q.completed ? "star" : "scroll"} size={3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl leading-5">{questTitle(q.title_key, q.args)}</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1">
              <Bar pct={pct} color={q.completed ? "#fbd54a" : "#6abe30"} />
            </div>
            <span className="min-w-[56px] text-right text-lg">
              {Math.floor(q.progress)}/{q.target}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-lg text-[#8a6a4e]">
            <span className="flex items-center gap-1">
              <Icon name="coin" size={2} /> {q.coin_reward}
            </span>
            {q.item_reward && (
              <span className="flex items-center gap-1" title={itemName("crops", q.item_reward.seed)}>
                <Icon name={`seed:${q.item_reward.seed}`} size={2} /> ×{q.item_reward.count}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 self-center">
          {q.claimed ? (
            <span className="text-lg text-[#3e8948]">✔ {t("common.claimed")}</span>
          ) : (
            <Btn small variant="orange" disabled={!q.completed} onClick={() => claimReward(q.id)}>
              {t("common.claim")}
            </Btn>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default function Quests({ onClose }: { onClose: () => void }) {
  const t = useT();
  const save = useSave();
  useNow(20000);

  return (
    <div className="absolute inset-0 z-40 flex flex-col village-bg">
      <ScreenHeader title={t("quests.title")} onBack={onClose} />
      <div className="px-scroll flex-1 overflow-y-auto p-3">
        <div className="mb-1 flex items-end justify-between">
          <h2 className="px-title text-3xl text-[#fbd54a]">{t("quests.daily")}</h2>
          <span className="px-title text-lg text-[#fff4dc]">{t("quests.resets_daily", { time: fmtHMS(msUntilTomorrow()) })}</span>
        </div>
        <div className="mb-4 flex flex-col gap-2">
          {save.daily_quests.map((q) => (
            <QuestCard key={q.id} q={q} />
          ))}
        </div>
        <div className="mb-1 flex items-end justify-between">
          <h2 className="px-title text-3xl text-[#fbd54a]">{t("quests.weekly")}</h2>
          <span className="px-title text-lg text-[#fff4dc]">{t("quests.resets_weekly", { time: fmtHMS(msUntilNextWeek()) })}</span>
        </div>
        <div className="flex flex-col gap-2">
          {save.weekly_quests.map((q) => (
            <QuestCard key={q.id} q={q} />
          ))}
        </div>
      </div>
    </div>
  );
}
