import { installDom, makeCanvas } from "./raster.mjs";
installDom();
const { GAMES } = await import("./castle.mjs");
const api = { addScore(){}, setLives(){}, finish(){}, paused:{current:false}, elapsed:{current:0}, duration:120, festival:false, score:{current:0} };
const el = GAMES.Castle({ api });
const cv = makeCanvas(el.props.w, el.props.h);
const logic = el.props.setup({ ctx: cv.getContext("2d"), w: el.props.w, h: el.props.h, keys: new Set() });
let t=0; for (let f=0;f<600;f++){ t+=1/60; api.elapsed.current=t; logic.update(1/60); }
logic.draw();
const d = cv.getContext("2d").data;
// sample: top of sky, horizon area, grass strip, tower block
const at = (x,y)=>{const o=(y*el.props.w+x)*4;return [d[o],d[o+1],d[o+2]];};
console.log("sky top      ", at(120, 8));
console.log("sky mid      ", at(120, 140));
console.log("meadow/hill  ", at(120, 292));
console.log("grass strip  ", at(30, 322));
console.log("foundation   ", at(120, 330));
console.log("tower block  ", at(120, 262));
console.log("expect sky ~ #6fc0e8->#a4d9f2, grass ~ #71b54e");
