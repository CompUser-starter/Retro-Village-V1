import { installDom, makeCanvas, savePng } from "./raster.mjs";
installDom();
const { GAMES } = await import("./castle.mjs");
import fs from "node:fs";
fs.mkdirSync("/home/user/sandbox/.shots", { recursive: true });
const api = {
  sum: 0,
  addScore(n) {
    this.sum += n;
  },
  setLives() {},
  finish() {},
  paused: { current: false },
  elapsed: { current: 0 },
  duration: 120,
  festival: false,
  score: { current: 0 },
};
const el = GAMES.Castle({ api });
const { w, h, setup } = el.props;
const cv = makeCanvas(w, h);
const logic = setup({ ctx: cv.getContext("2d"), w, h, keys: new Set() });
let t = 0;
// build a tower of several blocks so the render is meaningful
const dropFrames = new Set([120, 210, 300, 390, 480, 570]);
for (let f = 0; f < 700; f++) {
  t += 1 / 60;
  api.elapsed.current = t;
  if (dropFrames.has(f)) logic.down?.(0, 0, 1);
  logic.update(1 / 60);
}
logic.draw();
savePng(cv, "/home/user/sandbox/.shots/castle.png");
console.log("drawn", w, h, "score", api.sum);
