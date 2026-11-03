import { installDom, makeCanvas, savePng } from "./raster.mjs";
installDom();
const { GAMES } = await import("./castle.mjs");
const api = { addScore(){}, setLives(n){ if(n===0) this.gone=true; }, finish(){}, paused:{current:false}, elapsed:{current:0}, duration:120, festival:false, score:{current:0} };
const el = GAMES.Castle({ api });
const cv = makeCanvas(el.props.w, el.props.h);
const logic = el.props.setup({ ctx: cv.getContext("2d"), w: el.props.w, h: el.props.h, keys: new Set() });
let t = 0;
for (let f = 0; f < 60*90; f++) {
  t += 1/60; api.elapsed.current = t;
  logic.update(1/60);
  if (f % 100 === 0) logic.down?.();
  if (this && this.stop) break;
  if (f > 60*60) break;
}
logic.draw();
savePng(cv, "/home/user/sandbox/.shots/castle-late.png");
console.log("done, score", api.sum, "gone", api.gone);
