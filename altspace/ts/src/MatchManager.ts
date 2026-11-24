// Upstream: Assets/Scripts/Matches/MatchManager.cs, with what the scene changes did (SceneSettings, the five scenes)
// and the pause (PlayerManager.cs, the pause-system package) folded into one phase in the match's state (C5, C6):
//
//   lobby -> countdown -> round -> timesup (3 s) -> results -> lobby          (PLAY)
//   lobby -> countdown -> tutorial ------------------> results -> lobby       (TUTORIAL)
//
// The match owns the kitchen's game clock (GameClock.ts). The referee fires each transition once, when the game time
// reaches it (Tick), and writes it in the same tick; a new referee carries on from the same numbers.
//
// Pause (checklist 86) is shared: it stops this kitchen's clock for everyone in it. Any chef may pause during a round's
// countdown or the round; resuming, and Restart and End round (offered while paused, as upstream's pause panel), need
// the chef who paused, or the referee, or (if the one who paused has left) any chef: one chef cannot end or restart a
// round during another chef's pause.

import { Behaviour, type Player } from "../portkit/src/index.ts";
import { invoke, type PauseSettings } from "./ActionCode.ts";
import { GameClock, roundTime, type ClockState } from "./GameClock.ts";
import type { Kitchen } from "./Kitchen.ts";
import { MatchSettings } from "./MatchSettings.ts";

export type Phase = "lobby" | "countdown" | "round" | "timesup" | "results" | "tutorial";

export interface MatchRec {
  phase: Phase;
  mode: "game" | "tutorial";
  /** Counts rounds and tutorials started in this room's state (it starts again at 1 in a fresh room). */
  round: number;
  /** When this round or tutorial started (server milliseconds): names one results screen for good, so a device
   *  compares a round's score with its saved high score once, in this session or any later one. */
  id: number;
  /** G at which the countdown starts (0.2 s after PLAY). */
  t0: number;
  /** The round's length in seconds. */
  len: number;
  /** G at which the time limit started, or null (none yet, or the tutorial). */
  rs: number | null;
  /** OnFinalSecondsStarted has fired. */
  ff: 0 | 1;
  /** G at which time was up (the kitchen freezes there, C17). */
  end: number | null;
  clock: ClockState;
  /** Who paused (user id), "" when running. */
  by: string;
  /** The kitchen's best score since the room was made (24 h of room state; C16). */
  best: number;
  /** What the results panel shows: copied from the score when the round or tutorial ended. */
  res: { ok: number; bad: number; tips: number; score: number; mode: string } | null;
}

/** How long "Times Up!" stays before the results (TimesUp@Show, 3 s). */
export const TIMES_UP_SECONDS = 3;

export class MatchManager extends Behaviour implements PauseSettings {
  static override synced = ["match"];
  /** The board's buttons, sent to the referee as commands. */
  static override networkCallable = ["Play", "Tutorial", "RequestPause", "RequestResume", "Restart", "EndRound", "Continue"];

  match: MatchRec = MatchManager.Lobby(0, 0);

  kitchen!: Kitchen;
  settings!: MatchSettings;
  clock!: GameClock;
  readonly OnPaused: Array<() => void> = [];
  readonly OnResumed: Array<() => void> = [];

  static Lobby(round: number, best: number): MatchRec {
    return { phase: "lobby", mode: "game", round, id: 0, t0: 0, len: 120, rs: null, ff: 0, end: null, clock: { e: 0, f: 0 }, by: "", best, res: null };
  }

  override Start(): void {
    this.settings = new MatchSettings(this.RoundSetting());
    this.clock = new GameClock(() => this.Networking.GetServerTimeInSeconds(), () => this.match.clock);
    this.settings.CountDown.OnFinished.push(() => this.HandleCountDownFinished());
  }

  private RoundSetting(): number {
    const value = Math.round(Number(this.Settings.get("round") ?? ""));
    return value >= 30 && value <= 600 ? value : 120;
  }

  // ---- the clock ----------------------------------------------------------------------------------------------

  get G(): number {
    return this.clock.G;
  }

  get Paused(): boolean {
    return this.match.by !== "";
  }

  get IsPaused(): boolean {
    return this.Paused;
  }

  get PausedBy(): string {
    return this.match.by;
  }

  /** The game time the kitchen is drawn at: frozen where time was up (C17). */
  get KitchenG(): number {
    const G = this.G;
    return this.match.end !== null ? Math.min(G, this.match.end) : G;
  }

  get Phase(): Phase {
    return this.match.phase;
  }

  /** E and Q count: during a countdown, a round or the tutorial, and not while paused (79, 86). */
  AcceptsInput(): boolean {
    const phase = this.match.phase;
    return (phase === "countdown" || phase === "round" || phase === "tutorial") && !this.Paused;
  }

  /** The kitchen's timers run (preparations, orders, plate returns, tutorial steps). */
  KitchenRuns(): boolean {
    const phase = this.match.phase;
    return phase === "countdown" || phase === "round" || phase === "tutorial";
  }

  /** The final seconds of a round, when preparations run 1.25 times faster (55); null when there are none. */
  BoostWindow(): [number, number] | null {
    const m = this.match;
    if (m.mode !== "game" || m.rs === null) return null;
    return [m.rs + this.settings.TimeLimit.TimeToFinalSeconds, m.rs + this.settings.TimeLimit.Time];
  }

  /** When the countdown ends and the time limit (or the tutorial) starts. */
  get CountDownEnd(): number {
    return this.match.t0 + this.settings.CountDown.Time;
  }

  /** Seconds left in the round at G (the Timer's value), or null outside a round. */
  RoundLeft(G: number): number | null {
    const m = this.match;
    if (m.rs === null) return null;
    return Math.max(0, m.rs + this.settings.TimeLimit.Time - G);
  }

  // ---- pause (the pause-system package over the game clock) ---------------------------------------------------

  Pause(by: string): void {
    if (this.Paused) return;
    this.match.clock = this.clock.Pause();
    this.match.by = by;
    invoke(this.OnPaused);
  }

  Resume(): void {
    if (!this.Paused) return;
    this.match.clock = this.clock.Resume();
    this.match.by = "";
    invoke(this.OnResumed);
  }

  // ---- commands (run on the referee) --------------------------------------------------------------------------

  private Caller(): Player | null {
    return this.Networking.CallingPlayer;
  }

  /** PLAY (MainMenuOptions.PlayGame -> the Game scene). The one who pressed it cooks. */
  Play(): void {
    const who = this.Caller();
    if (!who || this.match.phase !== "lobby" || !this.kitchen.Enrol(who.uid)) return;
    this.StartMatch("game");
  }

  /** TUTORIAL (MainMenuOptions.PlayTutorial). */
  Tutorial(): void {
    const who = this.Caller();
    if (!who || this.match.phase !== "lobby" || this.Settings.get("tutorial") === "off" || !this.kitchen.tutorial || !this.kitchen.Enrol(who.uid)) return;
    this.StartMatch("tutorial");
  }

  /** P (PlayerManager.HandlePlayerPause). The tutorial cannot be paused (90). */
  RequestPause(): void {
    const who = this.Caller();
    if (!who || !this.kitchen.IsChef(who.uid) || this.match.mode !== "game") return;
    if (this.match.phase !== "countdown" && this.match.phase !== "round") return;
    this.Pause(who.uid);
    this.kitchen.CommitAll();
  }

  /** May this player act on the pause panel (Resume, Restart, End round)? The chef who paused, the referee, or any chef
   *  once the one who paused has left the room. */
  private MayUsePausePanel(who: Player): boolean {
    if (!this.Paused) return false;
    const pauserHere = this.Networking.GetPlayers().some((p) => p.uid === this.match.by);
    return who.uid === this.match.by || who.isMaster || (!pauserHere && this.kitchen.IsChef(who.uid));
  }

  /** Resume (PauseCanvas.HandleResumeClicked). */
  RequestResume(): void {
    const who = this.Caller();
    if (!who || !this.MayUsePausePanel(who)) return;
    this.Resume();
    this.kitchen.CommitAll();
  }

  /** Restart, confirmed (PauseCanvas.HandleRestartConfirmed: the Game scene again). */
  Restart(): void {
    const who = this.Caller();
    if (!who || !this.MayUsePausePanel(who)) return;
    this.StartMatch("game");
  }

  /** Exit, confirmed (PauseCanvas.HandleExitConfirmed: back to the main menu). */
  EndRound(): void {
    const who = this.Caller();
    if (!who || !this.MayUsePausePanel(who)) return;
    this.ResetToLobby();
    this.kitchen.CommitAll();
  }

  /** Continue on the results (Results.HandleContinueButtonClick). */
  Continue(): void {
    const who = this.Caller();
    if (!who || this.match.phase !== "results" || !this.kitchen.IsChef(who.uid)) return;
    this.ResetToLobby();
    this.kitchen.CommitAll();
  }

  // ---- transitions (referee) ----------------------------------------------------------------------------------

  /** Between rounds the kitchen is in its start state and E and Q are ignored (PORT.md 8.6). */
  ResetToLobby(): void {
    const keep = this.match;
    this.match = MatchManager.Lobby(keep.round, keep.best);
    this.match.clock = GameClock.Start(this.Networking.GetServerTimeInSeconds());
    this.match.clock = { e: this.match.clock.e, f: 0 };
    this.kitchen.ResetKitchen();
    this.kitchen.orders.Asset.Initialize();
    this.kitchen.score.Asset.Initialize();
    this.kitchen.tutorial?.ResetTutorial();
  }

  /** The Game (or Tutorial) scene loads: everything starts over (8), the countdown starts 0.2 s later (7). */
  private StartMatch(mode: "game" | "tutorial"): void {
    const keep = this.match;
    this.settings.SetRoundLength(this.RoundSetting());
    this.match = MatchManager.Lobby(keep.round + 1, keep.best);
    this.match.id = this.Networking.GetServerTimeInMilliseconds();
    this.match.mode = mode;
    this.match.len = this.settings.TimeLimit.Time;
    this.match.clock = GameClock.Start(this.Networking.GetServerTimeInSeconds());
    this.match.phase = "countdown";
    this.match.t0 = roundTime(MatchSettings.StartDelay);
    this.settings.IsAllowToStartTimeLimit = mode === "game";
    this.kitchen.ResetKitchen();
    this.kitchen.orders.Asset.Initialize();
    this.kitchen.score.Asset.Initialize();
    this.kitchen.tutorial?.ResetTutorial();
    if (mode === "tutorial") this.kitchen.tutorial?.Awake();
    invoke(this.settings.CountDown.OnStarted);
    this.kitchen.CommitAll();
  }

  /** The referee's tick: fires what is due, once. */
  Tick(G: number): void {
    const m = this.match;
    if (m.phase === "countdown" && G >= this.CountDownEnd) {
      m.phase = m.mode === "tutorial" ? "tutorial" : "round";
      invoke(this.settings.CountDown.OnFinished);
    }
    if (m.phase === "round" && m.rs !== null) {
      if (m.ff === 0 && G >= m.rs + this.settings.TimeLimit.TimeToFinalSeconds) {
        m.ff = 1;
        invoke(this.settings.TimeLimit.OnFinalSecondsStarted);
      }
      if (G >= m.rs + this.settings.TimeLimit.Time) {
        m.end = roundTime(m.rs + this.settings.TimeLimit.Time);
        m.phase = "timesup";
        invoke(this.settings.TimeLimit.OnFinished);
      }
    }
    if (m.phase === "timesup" && m.end !== null && G >= m.end + TIMES_UP_SECONDS) this.GoToResults();
  }

  /** CountDown.OnFinished -> StartTimeLimit (MatchManager.HandleCountDownFinished). */
  private HandleCountDownFinished(): void {
    if (!this.settings.IsAllowToStartTimeLimit || this.match.mode !== "game") return;
    this.match.rs = roundTime(this.CountDownEnd);
    invoke(this.settings.TimeLimit.OnStarted);
  }

  /** SceneSettings.GoToResults: the score as it stands becomes the results panel. */
  GoToResults(): void {
    const s = this.kitchen.score.Asset;
    this.match.res = { ok: s.SuccessfulDeliveries, bad: s.FailedDeliveries, tips: s.Tips, score: s.Score, mode: this.match.mode };
    if (this.match.mode === "game") this.match.best = Math.max(this.match.best, s.Score);
    this.match.phase = "results";
    this.match.clock = this.clock.Pause();
    this.match.by = "";
  }
}
