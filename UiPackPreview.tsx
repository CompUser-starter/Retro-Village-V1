// Developer preview of the shared UI pack: panels, buttons, bars, icons and the
// three typography families, rendered with the real CSS so they can be checked on
// a phone. Opened from Settings (long-press the title) – not part of normal play.
import { Btn, Icon, Panel, ScreenHeader } from "../components/ui";
import { UI_GAME_ICON_NAMES, UI_SMALL_ICON_NAMES } from "../game/uipack";
import { useT } from "../game/i18n";

export default function UiPackPreview({ onClose }: { onClose: () => void }) {
  const t = useT();
  const sample = "AaƏəĞğIıİiÖöŞşÜüÇç · АаБбВвЁё · 0123456789";
  return (
    <div className="absolute inset-0 z-40 flex flex-col village-bg">
      <ScreenHeader title="UI Pack" onBack={onClose} right={<span />} />
      <div className="px-scroll flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <Panel className="p-3">
          <div className="font-display text-3xl">{t("game.title")}</div>
          <div className="font-bold-amber text-2xl">1234567890 · {sample}</div>
          <div className="font-regular text-xl">{sample}</div>
        </Panel>

        <div className="grid grid-cols-2 gap-2">
          <Panel className="h-16 p-2">{""}</Panel>
          <div className="px-panel-paper h-16 p-2" />
          <div className="px-panel-dark h-16 p-2" />
          <div className="px-panel-muted h-16 p-2" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Btn variant="amber">
            <Icon name="play" size={2} />
          </Btn>
          <Btn>
            <Icon name="arrow" size={2} />
          </Btn>
          <Btn variant="gray">
            <Icon name="gear" size={2} />
          </Btn>
          <Btn variant="red">
            <Icon name="close" size={2} />
          </Btn>
          <Btn variant="green">
            <Icon name="check" size={2} />
          </Btn>
          <Btn disabled>
            <Icon name="lock" size={2} />
          </Btn>
        </div>

        <Panel className="flex flex-col gap-3 p-3">
          <div className="px-bar">
            <div style={{ width: "55%" }} />
          </div>
          <div className="px-segments">
            {[1, 1, 1, 0, 0].map((on, i) => (
              <i key={i} className={on ? "on" : ""} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="px-ring" style={{ ["--pct" as string]: 70 }} />
            <span className="px-ribbon">★</span>
            <span className="px-ribbon sand">★</span>
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {UI_GAME_ICON_NAMES.map((n) => (
              <div key={n} className="flex items-center justify-center border-4 border-[#4a2d1c] bg-white p-2">
                <Icon name={n} size={4} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {UI_SMALL_ICON_NAMES.map((n) => (
              <div key={n} className="flex items-center justify-center border-4 border-[#4a2d1c] bg-white p-2">
                <Icon name={n} size={3} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
