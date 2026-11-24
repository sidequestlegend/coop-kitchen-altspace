// Upstream: Assets/Scripts/UI/Timer.cs. The round's time as mm:ss, updated once a second, with a bar at remaining/120
// (80); in the final seconds the text turns red and pulses with SFX_warning01 every second (81). Hidden during the
// countdown, shown when the time limit starts.
//
// Each client derives the second shown from the round's start time; a beep is played for each second this client
// crosses while it watches (none replayed to a late joiner).

import { Behaviour, Color, Vector3, type GameObject, type TextRef } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";

/** TimeSpan.FromSeconds(seconds).ToString(@"mm\:ss"). */
export function MinutesSeconds(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60) % 60).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

export class Timer extends Behaviour {
  kitchen!: Kitchen;
  path = "";
  board = "";
  timer: TextRef | null = null;
  slider: GameObject | null = null;
  finalSecondsColor = new Color(1, 0, 0, 1);
  private visible: boolean | null = null;
  private lastElapsed: number | null = null;
  private isFinalSeconds = false;
  private sliderValue = -1;
  /** Beeps this client played (for tests). */
  beeps = 0;

  override Update(): void {
    const match = this.kitchen.match;
    const m = match.match;
    const visible = (m.phase === "round" || m.phase === "timesup") && m.rs !== null;
    if (visible !== this.visible) {
      this.visible = visible;
      this.Host.setActive(`@${this.path}`, visible);
      if (!visible) {
        this.isFinalSeconds = false;
        if (this.timer) this.timer.color = new Color(1, 1, 1, 1);
      }
    }
    if (!visible || m.rs === null) {
      this.lastElapsed = null;
      return;
    }
    const limit = match.settings.TimeLimit;
    const elapsed = Math.min(match.KitchenG, m.rs + limit.Time) - m.rs;
    const seconds = limit.ValueAt(elapsed) ?? limit.Time;
    this.HandleTimeLimitUpdated(seconds);
    if (elapsed >= limit.TimeToFinalSeconds && !this.isFinalSeconds) this.HandleFinalSecondsStarted();
    if (this.lastElapsed !== null && this.isFinalSeconds) {
      for (const value of limit.TicksBetween(this.lastElapsed, elapsed)) if (value <= limit.FinalSeconds) this.PlayFinalSecondsEffects();
    }
    this.lastElapsed = elapsed;
  }

  private HandleTimeLimitUpdated(seconds: number): void {
    if (this.timer) this.timer.text = MinutesSeconds(seconds);
    const normalized = Math.round((seconds / this.kitchen.match.settings.TimeLimit.Time) * 100) / 100;
    if (normalized !== this.sliderValue) {
      this.sliderValue = normalized;
      if (this.slider) this.slider.transform.localScale = new Vector3(Math.max(0.001, normalized), 1, 1);
    }
  }

  private HandleFinalSecondsStarted(): void {
    this.isFinalSeconds = true;
    if (this.timer) this.timer.color = this.finalSecondsColor;
  }

  private PlayFinalSecondsEffects(): void {
    this.beeps++;
    this.Host.animPlay(`@${this.path}`, "Timer@FinalSecondsCountDown");
    this.kitchen.PlaySound("warning", this.board);
  }
}
