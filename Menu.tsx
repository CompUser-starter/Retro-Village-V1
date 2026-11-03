import { useState } from "react";
import { Btn, Icon, Modal, Panel } from "../components/ui";
import { playerLook } from "../game/sprites";
import { Portrait } from "../components/Portrait";
import menuBg from "../assets/menu-bg.jpg";
import { LANGS, type Lang } from "../game/data";
import { setPlayerName } from "../game/actions";
import { getLanguage, setLanguage, useT } from "../game/i18n";
import { getState, mutate, useSave } from "../game/store";
import { sfx } from "../game/audio";
import type { Nav } from "../game/routes";

export function LangPicker({ compact }: { compact?: boolean }) {
  useT();
  const cur = getLanguage();
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => {
            sfx("click");
            setLanguage(l.code as Lang);
          }}
          className={`border-4 border-[#4a2d1c] px-2 text-xl ${compact ? "py-0" : "py-1"} ${
            cur === l.code ? "bg-[#fbd54a] text-[#4a2d1c]" : "bg-[#f6ecd0] text-[#8a6a4e]"
          }`}
        >
          {compact ? l.code.toUpperCase() : l.label}
        </button>
      ))}
    </div>
  );
}

export default function Menu({ nav }: { nav: Nav }) {
  const t = useT();
  const save = useSave();
  const [about, setAbout] = useState(false);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Full-screen village painting */}
      <img
        src={menuBg}
        alt=""
        draggable={false}
        className="pixelated absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "50% 35%" }}
      />
      {/* soft vignette so the UI stays readable on top of the art */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(40,90,140,0.25) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 52%, rgba(45,30,15,0.55) 100%)",
        }}
      />

      {/* Title on a wooden sign board */}
      <div className="relative z-10 flex flex-col items-center pt-6">
        <div className="px-float relative">
          <div className="px-panel-dark px-6 py-2 text-center" style={{ boxShadow: "0 0 0 2px #a8784a inset, 6px 6px 0 rgba(0,0,0,0.35)" }}>
            <h1 className="px-title text-[52px] leading-[46px] text-[#fbd54a]">{t("game.title")}</h1>
            <p className="px-title mt-1 text-2xl text-[#fff4dc]">{t("game.subtitle")}</p>
          </div>
          {/* sign post nails */}
          <span className="absolute left-2 top-2 h-2 w-2 bg-[#4a2d1c]" />
          <span className="absolute right-2 top-2 h-2 w-2 bg-[#4a2d1c]" />
        </div>
      </div>

      {/* Buttons at the bottom, on a sandy plank strip */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 px-4 pb-5">
        <div className="flex w-full max-w-[300px] flex-col gap-2.5">
          <Btn variant="amber" className="!text-3xl" onClick={() => nav.go(save.onboarded ? { name: "village" } : { name: "welcome" })}>
            <Icon name="play" size={3} /> {save.onboarded ? t("main_menu.continue") : t("main_menu.play")}
          </Btn>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="teal" onClick={() => nav.overlay("quests")}>
              <Icon name="scroll" size={2} /> {t("main_menu.quests")}
            </Btn>
            <Btn variant="green" onClick={() => nav.overlay("settings")}>
              <Icon name="gear" size={2} /> {t("main_menu.settings")}
            </Btn>
          </div>
          <Btn variant="gray" small onClick={() => setAbout(true)}>
            <Icon name="info" size={2} /> {t("main_menu.about")}
          </Btn>
        </div>
        <div className="px-title text-center text-lg text-[#fff4dc]">
          <div>{t("main_menu.offline_note")}</div>
          <div className="text-[#e4c07a]">{t("game.version", { count: "1.0" })}</div>
        </div>
      </div>

      {about && (
        <Modal onClose={() => setAbout(false)}>
          <Panel className="p-4 text-center">
            <h2 className="mb-2 text-3xl">{t("settings.about")}</h2>
            <p className="mb-3 text-xl leading-5">{t("settings.about_text")}</p>
            <Btn onClick={() => setAbout(false)}>{t("common.close")}</Btn>
          </Panel>
        </Modal>
      )}
    </div>
  );
}

export function Welcome({ nav }: { nav: Nav }) {
  const t = useT();
  const [name, setName] = useState(getState().player_name);

  return (
    <div className="relative flex h-full flex-col items-center justify-center village-bg p-4">
      <div className="px-textbox px-pop w-full max-w-sm p-4 text-center">
        <div className="mb-2 flex justify-center">
          <Portrait look={playerLook()} scale={4} className="px-float" />
        </div>
        <h2 className="text-4xl leading-8">{t("main_menu.welcome_title")}</h2>
        <p className="mb-3 mt-1 text-xl text-[#8a6a4e]">{t("main_menu.welcome_text")}</p>
        <div className="mb-3 flex justify-center">
          <LangPicker />
        </div>
        <label className="mb-1 block text-left text-xl">{t("main_menu.name_label")}</label>
        <input
          value={name}
          maxLength={14}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("main_menu.name_placeholder")}
          className="mb-4 w-full border-4 border-[#4a2d1c] bg-white px-2 py-1 text-2xl outline-none focus:bg-[#fff8dc]"
        />
        <Btn
          variant="orange"
          className="w-full !text-3xl"
          onClick={() => {
            setPlayerName(name.trim() || t("main_menu.default_name"));
            mutate((d) => {
              d.onboarded = true;
            });
            sfx("quest");
            nav.go({ name: "village" });
          }}
        >
          {t("main_menu.start")}
        </Btn>
      </div>
    </div>
  );
}
