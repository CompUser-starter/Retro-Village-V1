// AudioManager: 100% procedural chiptune (WebAudio). No samples, no files, no network.
// Music: two original loops ("village" 90 BPM, "action" 124 BPM). SFX: short synthesized cues.

import { getState } from "./store";

let ctx: AudioContext | null = null;
let master: GainNode;
let musicGain: GainNode;
let sfxGain: GainNode;
let noiseBuf: AudioBuffer;

export type MusicTrack = "village" | "action" | null;
let wanted: MusicTrack = null;
let playing: MusicTrack = null;
let timer: number | null = null;
let nextTime = 0;
let stepIdx = 0;

export function unlockAudio(): void {
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 7000;
    master.connect(lp);
    lp.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.connect(master);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    applyAudioSettings();
  }
  if (ctx.state === "suspended") void ctx.resume();
  if (wanted && playing !== wanted) startMusic();
}

/** Pause/resume the audio engine when the app goes to the background. */
export function suspendAudio(suspend: boolean): void {
  if (!ctx) return;
  if (suspend) void ctx.suspend();
  else void ctx.resume();
}

export function applyAudioSettings(): void {
  if (!ctx) return;
  const a = getState().audio;
  master.gain.value = a.volume;
  musicGain.gain.value = a.music ? 0.5 : 0;
  sfxGain.gain.value = a.sfx ? 0.9 : 0;
}

/* ------------------------------------------------------------------ */
/* Low-level synth                                                    */
/* ------------------------------------------------------------------ */
function tone(dest: AudioNode, f: number, t0: number, dur: number, type: OscillatorType, vol: number, to?: number) {
  if (!ctx || f <= 0) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function noise(dest: AudioNode, t0: number, dur: number, vol: number, hp = 1000, lpf = 0) {
  if (!ctx) return;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = lpf ? "lowpass" : "highpass";
  f.frequency.value = lpf || hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f);
  f.connect(g);
  g.connect(dest);
  s.start(t0, Math.random() * 0.5);
  s.stop(t0 + dur + 0.02);
}

function kick(t0: number, vol = 0.5) {
  if (!ctx) return;
  tone(musicGain, 140, t0, 0.14, "sine", vol, 40);
}

/* ------------------------------------------------------------------ */
/* SFX                                                                */
/* ------------------------------------------------------------------ */
type N = [freq: number, dur: number, type?: OscillatorType, vol?: number, slideTo?: number];

const SFX: Record<string, N[]> = {
  click: [[1200, 0.04, "square", 0.12], [1700, 0.06, "square", 0.1]],
  coin: [[988, 0.07, "square", 0.14], [1319, 0.22, "square", 0.14]],
  quest: [
    [523, 0.12, "square", 0.12], [659, 0.12, "square", 0.12], [784, 0.12, "square", 0.12],
    [1047, 0.14, "square", 0.12], [784, 0.1, "square", 0.1], [1047, 0.55, "square", 0.13],
  ],
  record: [
    [523, 0.09, "square", 0.12], [659, 0.09, "square", 0.12], [784, 0.09, "square", 0.12],
    [1047, 0.09, "square", 0.12], [1319, 0.09, "square", 0.12], [1568, 0.09, "square", 0.12],
    [2093, 0.35, "square", 0.13], [1568, 0.1, "square", 0.1], [2093, 0.6, "square", 0.14],
  ],
  error: [[150, 0.18, "sawtooth", 0.13, 90], [100, 0.2, "sawtooth", 0.13, 60]],
  door: [[196, 0.1, "triangle", 0.22], [294, 0.22, "triangle", 0.2]],
  plant: [[300, 0.14, "sine", 0.35, 760]],
  harvest: [[660, 0.08, "triangle", 0.3], [880, 0.08, "triangle", 0.3], [1320, 0.22, "triangle", 0.3]],
  purchase: [[784, 0.08, "square", 0.12], [1047, 0.08, "square", 0.12], [1568, 0.3, "square", 0.12]],
  festival_start: [
    [440, 0.12, "square", 0.12], [0, 0.1], [440, 0.12, "square", 0.12], [0, 0.1],
    [440, 0.12, "square", 0.12], [0, 0.1], [880, 0.4, "square", 0.14],
  ],
  shoot: [[900, 0.05, "square", 0.035, 400]],
  gem: [[1400, 0.05, "square", 0.1], [1900, 0.12, "square", 0.1]],
  jump: [[280, 0.12, "square", 0.1, 620]],
  place: [[500, 0.06, "square", 0.12], [720, 0.09, "square", 0.12]],
  clear: [[660, 0.07, "square", 0.12], [880, 0.07, "square", 0.12], [1100, 0.07, "square", 0.12], [1320, 0.16, "square", 0.12]],
  tick: [[800, 0.05, "square", 0.1]],
  dialog: [[520, 0.04, "square", 0.06], [640, 0.04, "square", 0.06]],
};

export type SfxName = keyof typeof SFX | "hit" | "boom";

export function sfx(name: SfxName): void {
  if (!ctx || !getState().audio.sfx) return;
  const t0 = ctx.currentTime + 0.005;
  if (name === "hit" || name === "boom") {
    noise(sfxGain, t0, name === "boom" ? 0.25 : 0.12, name === "boom" ? 0.35 : 0.25, 800, 2600);
    return;
  }
  const seq = SFX[name];
  if (!seq) return;
  if (name === "door") noise(sfxGain, t0, 0.12, 0.25, 0, 900);
  let t = t0;
  for (const [f, d, type, vol, to] of seq) {
    tone(sfxGain, f, t, d, type ?? "square", vol ?? 0.12, to);
    t += d * 0.92;
  }
}

/* ------------------------------------------------------------------ */
/* Music                                                              */
/* ------------------------------------------------------------------ */
const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freqOf(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return 0;
  let s = SEMI[m[1]];
  if (m[2] === "#") s++;
  if (m[2] === "b") s--;
  const midi = 12 * (parseInt(m[3], 10) + 1) + s;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const CHORDS: Record<string, { b: [string, string]; a: [string, string, string] }> = {
  C: { b: ["C3", "G3"], a: ["C4", "E4", "G4"] },
  Am: { b: ["A2", "E3"], a: ["A3", "C4", "E4"] },
  F: { b: ["F2", "C3"], a: ["F3", "A3", "C4"] },
  G: { b: ["G2", "D3"], a: ["G3", "B3", "D4"] },
};

interface Ev {
  f: number;
  len: number;
}
interface Compiled {
  stepDur: number;
  total: number;
  lead: (Ev | null)[];
  bass: (Ev | null)[];
  arp: (Ev | null)[];
  drums: string[];
  leadVol: number;
  leadType: OscillatorType;
}

function compileChannel(tokens: string[]): (Ev | null)[] {
  const out: (Ev | null)[] = tokens.map((tk) => (tk === "." || tk === "-" ? null : { f: freqOf(tk), len: 1 }));
  let last: Ev | null = null;
  tokens.forEach((tk, i) => {
    if (tk === "-" && last) last.len++;
    else if (tk === ".") last = null;
    else last = out[i];
  });
  return out;
}

function split(bar: string): string[] {
  const t = bar.trim().split(/\s+/);
  while (t.length < 8) t.push(".");
  return t.slice(0, 8);
}

function build(
  bpm: number,
  prog: string[],
  leadBars: string[],
  bassPat: string,
  arpPat: string,
  drumBar: string,
  leadVol: number,
  leadType: OscillatorType
): Compiled {
  const leadTokens: string[] = [];
  const bassTokens: string[] = [];
  const arpTokens: string[] = [];
  const drums: string[] = [];
  prog.forEach((ch, i) => {
    const c = CHORDS[ch];
    leadTokens.push(...split(leadBars[i % leadBars.length]));
    bassTokens.push(
      ...split(bassPat).map((p) => (p === "." ? "." : p === "r" ? c.b[0] : p === "f" ? c.b[1] : p))
    );
    arpTokens.push(...split(arpPat).map((p) => (p === "." ? "." : c.a[parseInt(p, 10)])));
    drums.push(...drumBar.split(""));
  });
  return {
    stepDur: 60 / bpm / 2,
    total: prog.length * 8,
    lead: compileChannel(leadTokens),
    bass: compileChannel(bassTokens),
    arp: compileChannel(arpTokens),
    drums,
    leadVol,
    leadType,
  };
}

// ---- Village theme: 90 BPM, C-Am-F-G, warm & curious (A B A B, 16 bars) ----
const VILLAGE_A = [
  "E5 . G5 . C6 . G5 .",
  "A4 . C5 . E5 - D5 C5",
  "A4 . C5 . F5 - E5 C5",
  "D5 . G5 - B4 . D5 -",
];
const VILLAGE_B = [
  "G5 - E5 . D5 . C5 .",
  "C5 . E5 . A5 - G5 E5",
  "F5 - E5 . C5 . A4 .",
  "G4 . B4 . D5 - . .",
];
const villageProg = ["C", "Am", "F", "G"];

// ---- Festival theme: 124 BPM, C-G-Am-F, bouncy & playful ----
const FEST_A = [
  "G5 . E5 G5 . A5 G5 .",
  "B5 . G5 B5 . C6 B5 .",
  "A5 . C6 . B5 A5 G5 .",
  "A5 G5 F5 . E5 . C5 .",
];
const FEST_B = [
  "C6 . C6 B5 G5 . E5 .",
  "D5 . G5 . B5 . D6 .",
  "C6 B5 A5 . E5 A5 C6 .",
  "A5 . C6 . A5 G5 F5 .",
];
const festProg = ["C", "G", "Am", "F"];

const TRACKS: Record<Exclude<MusicTrack, null>, () => Compiled> = {
  village: () =>
    build(
      90,
      [...villageProg, ...villageProg, ...villageProg, ...villageProg],
      [...VILLAGE_A, ...VILLAGE_B, ...VILLAGE_A, ...VILLAGE_B],
      "r . f . r . f .",
      "0 1 2 1 0 1 2 1",
      "k.h.k.h.",
      0.05,
      "square"
    ),
  action: () =>
    build(
      124,
      [...festProg, ...festProg, ...festProg, ...festProg],
      [...FEST_A, ...FEST_B, ...FEST_A, ...FEST_B],
      "r r . f r . f .",
      "0 1 2 1 0 1 2 1",
      "khshkhsh",
      0.055,
      "square"
    ),
};

let compiled: Compiled | null = null;

function playStep(tr: Compiled, i: number, t: number) {
  const d = tr.stepDur;
  const l = tr.lead[i];
  if (l) tone(musicGain, l.f, t, Math.max(0.08, l.len * d * 0.95), tr.leadType, tr.leadVol);
  const b = tr.bass[i];
  if (b) tone(musicGain, b.f, t, b.len * d * 0.9, "triangle", 0.2);
  const a = tr.arp[i];
  if (a) tone(musicGain, a.f, t, d * 0.8, "square", 0.02);
  const dr = tr.drums[i];
  if (dr === "k") kick(t, 0.45);
  else if (dr === "s") noise(musicGain, t, 0.09, 0.14, 1800);
  else if (dr === "h") noise(musicGain, t, 0.03, 0.05, 6000);
}

function tick() {
  if (!ctx || !compiled) return;
  while (nextTime < ctx.currentTime + 0.3) {
    playStep(compiled, stepIdx, nextTime);
    nextTime += compiled.stepDur;
    stepIdx = (stepIdx + 1) % compiled.total;
  }
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function startMusic() {
  if (!ctx || !wanted) return;
  stopTimer();
  compiled = TRACKS[wanted]();
  playing = wanted;
  stepIdx = 0;
  nextTime = ctx.currentTime + 0.08;
  timer = window.setInterval(tick, 80);
}

export function setMusic(track: MusicTrack): void {
  wanted = track;
  if (!ctx) return;
  if (!track) {
    stopTimer();
    playing = null;
    return;
  }
  if (playing !== track) startMusic();
}
