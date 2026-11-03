import { useEffect, useMemo, useState } from "react";
import { Toasts } from "./components/ui";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { saveWasRecovered, useSave } from "./game/store";
import { t } from "./game/i18n";
import { toast } from "./game/toast";
import { checkResets } from "./game/quests";
import { setMusic, suspendAudio, unlockAudio } from "./game/audio";
import type { Nav, Overlay, Route } from "./game/routes";
import Menu, { Welcome } from "./screens/Menu";
import Village from "./screens/Village";
import Home from "./screens/Home";
import Farm from "./screens/Farm";
import Shop from "./screens/Shop";
import Festival from "./screens/Festival";
import BuildingScreen from "./screens/BuildingScreen";
import Quests from "./screens/Quests";
import Settings from "./screens/Settings";
import Shell from "./minigames/Shell";

// Make sure daily/weekly quests exist before the first render.
// Guarded: a failure here must never stop the app from loading.
try {
  checkResets();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error("checkResets failed:", err);
}

export default function App() {
  const save = useSave();
  const [route, setRoute] = useState<Route>({ name: "menu" });
  const [ov, setOv] = useState<Overlay>(null);

  const nav = useMemo<Nav>(
    () => ({
      go: (r) => {
        setOv(null);
        setRoute(r);
      },
      overlay: setOv,
    }),
    []
  );

  useEffect(() => {
    document.documentElement.lang = save.selected_language;
  }, [save.selected_language]);

  // quest resets (start-up, focus, periodic) — all based on the device's local date
  useEffect(() => {
    checkResets();
    const id = window.setInterval(checkResets, 30000);
    const vis = () => {
      suspendAudio(document.hidden);
      if (!document.hidden) checkResets();
    };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("focus", checkResets);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("focus", checkResets);
    };
  }, []);

  useEffect(() => {
    if (saveWasRecovered) toast(t("errors.save_reset"), "bad");
  }, []);

  // browsers need a user gesture before audio can start
  useEffect(() => {
    const h = () => unlockAudio();
    window.addEventListener("pointerdown", h);
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("pointerdown", h);
      window.removeEventListener("keydown", h);
    };
  }, []);

  // music per screen (the festival screen manages its own track)
  const track = route.name === "play" ? "action" : route.name === "festival" ? undefined : "village";
  useEffect(() => {
    if (track !== undefined) setMusic(track);
  }, [track]);

  let screen;
  switch (route.name) {
    case "menu":
      screen = <Menu nav={nav} />;
      break;
    case "welcome":
      screen = <Welcome nav={nav} />;
      break;
    case "village":
      screen = <Village spawn={route.spawn} nav={nav} blocked={ov !== null} />;
      break;
    case "home":
      screen = <Home nav={nav} />;
      break;
    case "farm":
      screen = <Farm nav={nav} />;
      break;
    case "shop":
      screen = <Shop nav={nav} />;
      break;
    case "festival":
      screen = <Festival nav={nav} />;
      break;
    case "building":
      screen = <BuildingScreen id={route.id} nav={nav} />;
      break;
    case "play": {
      const back = route.back;
      screen = <Shell key={route.game} game={route.game} onExit={() => nav.go(back)} />;
      break;
    }
  }

  return (
    <ErrorBoundary>
      <div
        className="flex h-full w-full items-center justify-center bg-[#5fb8e0]"
        style={{ height: "100dvh" }}
      >
        <div className="relative h-full w-full overflow-hidden village-bg sm:max-h-[940px] sm:max-w-[480px] sm:border-x-4 sm:border-[#4a2d1c]">
          {screen}
          {ov === "quests" && <Quests onClose={() => setOv(null)} />}
          {ov === "settings" && <Settings onClose={() => setOv(null)} />}
          <Toasts />
        </div>
      </div>
    </ErrorBoundary>
  );
}
