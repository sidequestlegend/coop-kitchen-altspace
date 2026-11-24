// Upstream: Assets/Scripts/UI/Score.cs. The score on the board, with "+ N" in green or "- N" in red rising for 2.5 s at
// each change (76; a wrong plate at 0 shows "- 0"); hidden during the countdown, shown from its end (77).

import { Behaviour, Color, type TextRef } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";

export const DELTA_SECONDS = 2.5;

/** C#'s float.ToString() for the whole numbers the score holds. */
export function FloatText(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.fround(value));
}

export class Score extends Behaviour {
  kitchen!: Kitchen;
  /** The score panel's path (its canvas, switched on and off). */
  path = "";
  current: TextRef | null = null;
  delta: TextRef | null = null;
  increasedColor = new Color(0, 1, 0, 1);
  decreasedColor = new Color(1, 0, 0, 1);
  /** The deltas this client showed (for tests). */
  readonly deltas: string[] = [];
  private visible: boolean | null = null;

  override Start(): void {
    if (this.current) this.current.text = "0";
    const settings = this.kitchen.score.Asset;
    settings.OnScoreIncreased.push((d) => this.kitchen.Fx("score", "+", d));
    settings.OnScoreDecreased.push((d) => this.kitchen.Fx("score", "-", d));
    this.kitchen.OnEffect("score", (sign, d) => (sign === "+" ? this.HandleScoreIncreased(Number(d)) : this.HandleScoreDecreased(Number(d))));
  }

  override Update(): void {
    const phase = this.kitchen.match.Phase;
    const visible = phase === "round" || phase === "timesup" || phase === "tutorial";
    if (visible !== this.visible) {
      this.visible = visible;
      this.Host.setActive(`@${this.path}`, visible);
    }
    if (this.current) this.current.text = FloatText(this.kitchen.score.Asset.Score);
  }

  private HandleScoreIncreased(deltaScore: number): void {
    if (this.delta) this.delta.color = this.increasedColor;
    this.ShowDelta("+ " + FloatText(deltaScore));
  }

  private HandleScoreDecreased(deltaScore: number): void {
    if (this.delta) this.delta.color = this.decreasedColor;
    this.ShowDelta("- " + FloatText(deltaScore));
  }

  private ShowDelta(deltaScore: string): void {
    this.deltas.push(deltaScore);
    if (this.delta) this.delta.text = deltaScore;
    this.kitchen.Flash(`@${this.path}/Delta`, DELTA_SECONDS);
  }
}
