export interface MiniApi {
  /** add points (can be fractional; the display floors the total) */
  addScore: (n: number) => void;
  /** show/update hearts in the HUD (use -1 to hide) */
  setLives: (n: number) => void;
  /** end the run: reason = "time" | "dead" | "stuck" */
  finish: (reason: string) => void;
  /** true while the game must not update (intro, countdown, pause) */
  paused: { current: boolean };
  /** seconds of play time so far */
  elapsed: { current: number };
  /** total duration in seconds for this run */
  duration: number;
  festival: boolean;
  /** current score (live) */
  score: { current: number };
}
