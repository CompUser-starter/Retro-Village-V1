import { useState } from "react";
import { Btn, Icon, Modal, Panel, ScreenHeader } from "../components/ui";
import { CONTROL_MODES, type ControlMode } from "../game/data";
import { LangPicker } from "./Menu";
import { applyAudioSettings, sfx } from "../game/audio";
import { mutate, resetSaveForTesting, useSave } from "../game/store";
import { toast } from "../game/toast";
import { t as tr, useT } from "../game/i18n";
import { checkResets } from "../game/quests";
import UiPackPreview from "./UiPackPreview";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`min-w-[84px] border-4 border-[#4a2d1c] px-3 py-0.5 text-2xl ${on ? "bg-[#6abe30] text-white" : "bg-[#8c87a6] text-white"}`}
      style={{ textShadow: "2px 2px 0 #4a2d1c" }}
    >
      {on ? t("settings.on") : t("settings.off")}
    </button>
  );
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const t = useT();
  const save = useSave();
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState(false);
  const [taps, setTaps] = useState(0);
  if (preview) return <UiPackPreview onClose={() => setPreview(false)} />;

  const setAudio = (patch: Partial<typeof save.audio>) => {
    mutate((d) => {
      d.audio = { ...d.audio, ...patch };
    });
    applyAudioSettings();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col village-bg">
      {/* tap the title 5× to open the UI-pack preview (developer check) */}
      <div
        onClick={() => {
          const n = taps + 1;
          setTaps(n);
          if (n >= 5) {
            setTaps(0);
            setPreview(true);
          }
        }}
      >
        <ScreenHeader title={t("settings.title")} onBack={onClose} right={<span />} />
      </div>
      <div className="px-scroll flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <Panel className="p-3">
          <div className="mb-2 text-2xl text-[#8f2d3b]">{t("settings.language")}</div>
          <LangPicker />
        </Panel>

        <Panel className="p-3">
          <div className="mb-2 text-2xl text-[#8f2d3b]">{t("settings.controls")}</div>
          <div className="grid grid-cols-3 gap-1.5">
            {CONTROL_MODES.map((m: ControlMode) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  sfx("click");
                  mutate((d) => {
                    d.control_mode = m;
                  });
                }}
                className={`border-4 border-[#4a2d1c] px-1 py-1 text-xl leading-5 ${
                  save.control_mode === m ? "bg-[#fbd54a] text-[#4a2d1c]" : "bg-white text-[#8a6a4e]"
                }`}
              >
                {m === "fixed" ? "🕹️" : m === "free" ? "👆" : "🎮"}
                <div>{t(`settings.controls_${m}`)}</div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-2xl">
              <Icon name="sound" size={2} /> {t("settings.music")}
            </span>
            <Toggle on={save.audio.music} onChange={(v) => setAudio({ music: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-2xl">
              <Icon name="sound" size={2} /> {t("settings.sound")}
            </span>
            <Toggle
              on={save.audio.sfx}
              onChange={(v) => {
                setAudio({ sfx: v });
                if (v) setTimeout(() => sfx("coin"), 60);
              }}
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-2xl">
              <span>{t("settings.volume")}</span>
              <span>{Math.round(save.audio.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(save.audio.volume * 100)}
              onChange={(e) => setAudio({ volume: Number(e.target.value) / 100 })}
              onPointerUp={() => sfx("coin")}
              className="w-full accent-[#3fb8a8]"
            />
          </div>
        </Panel>

        <Panel className="flex flex-col gap-2 p-3">
          <Btn variant="red" onClick={() => setConfirm(true)}>
            {t("settings.reset")}
          </Btn>
        </Panel>
      </div>

      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <Panel className="p-4 text-center">
            <h2 className="mb-1 text-3xl">{t("settings.reset")}</h2>
            <p className="mb-3 text-xl">{t("settings.reset_confirm")}</p>
            <div className="flex justify-center gap-2">
              <Btn variant="gray" onClick={() => setConfirm(false)}>
                {t("common.no")}
              </Btn>
              <Btn
                variant="red"
                onClick={() => {
                  resetSaveForTesting(true);
                  checkResets();
                  setConfirm(false);
                  toast(tr("settings.reset_done"), "info");
                  onClose();
                }}
              >
                {t("common.yes")}
              </Btn>
            </div>
          </Panel>
        </Modal>
      )}

    </div>
  );
}
