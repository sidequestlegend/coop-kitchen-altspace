// Upstream: Assets/Scripts/UI/CountDown.cs. 03, 02, 01 a second apart, each with a pop and SFX_warning01; a second after
// 01 the pop and beep fire once more for "00" and, in the same frame, SFX_countdown_start plays and the number hides (78).

import { Behaviour, type TextRef } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";

/** uint.ToString("D2"). */
export function D2(value: number): string {
  return String(Math.max(0, Math.trunc(value))).padStart(2, "0");
}

export class CountDown extends Behaviour {
  kitchen!: Kitchen;
  path = "";
  board = "";
  countDown: TextRef | null = null;
  private visible: boolean | null = null;
  private lastElapsed: number | null = null;
  private round = -1;
  /** What this client played (for tests). */
  readonly played: string[] = [];

  override Update(): void {
    const match = this.kitchen.match;
    const m = match.match;
    const counting = m.phase === "countdown" || ((m.phase === "round" || m.phase === "tutorial") && match.G < match.CountDownEnd + 0.5);
    const elapsed = match.KitchenG - m.t0;
    const visible = counting && m.phase === "countdown" && elapsed >= 0;
    if (visible !== this.visible) {
      this.visible = visible;
      this.Host.setActive(`@${this.path}`, visible);
    }
    if (m.round !== this.round) {
      // a new countdown; a page that arrives during one only plays what comes next
      this.round = m.round;
      this.lastElapsed = m.phase === "countdown" ? null : Infinity;
      // (a countdown seen within its first second is this client's own: the state takes a moment to arrive)
      if (m.phase === "countdown" && elapsed > 1) this.lastElapsed = elapsed;
    }
    if (!counting || this.lastElapsed === Infinity) return;
    const time = match.settings.CountDown;
    const from = this.lastElapsed ?? -1;
    for (const value of time.TicksBetween(from, elapsed)) this.HandleCountDownUpdated(value);
    if (from < time.Time && elapsed >= time.Time) this.HandleCountDownFinished();
    this.lastElapsed = elapsed;
  }

  private HandleCountDownUpdated(time: number): void {
    this.played.push(D2(time));
    this.Host.animPlay(`@${this.path}`, "CountDown@CountDown");
    this.kitchen.PlaySound("warning", this.board);
    if (this.countDown) this.countDown.text = D2(time);
  }

  private HandleCountDownFinished(): void {
    this.played.push("start");
    this.kitchen.PlaySound("countdownStart", this.board);
    this.Host.setActive(`@${this.path}`, false);
    this.visible = false;
    this.lastElapsed = Infinity;
  }
}
