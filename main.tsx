import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/vt323/latin-400.css";
import "@fontsource/vt323/latin-ext-400.css";
import "@fontsource/pixelify-sans/cyrillic-400.css";
import "./index.css";
import App from "./App";
import { loadArt } from "./game/assets";

function start() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  // fade the boot splash out once React has painted its first frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const boot = document.getElementById("boot");
      if (!boot) return;
      boot.classList.add("gone");
      setTimeout(() => boot.remove(), 400);
    });
  });
}

// Finish loading the local artwork before the first game frame so a mini-game
// can never capture its fallback canvas before the painted background is ready.
// All assets are bundled locally; no network requests are made.
loadArt().finally(start);
