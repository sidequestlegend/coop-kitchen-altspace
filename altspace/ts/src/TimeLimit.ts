// Upstream: Assets/Scripts/Matches/TimeLimit.cs. The round's countdown (120 s), with "final seconds" starting
// `finalSeconds` (20) before its end (81). Upstream chains one-second waits, so its round runs a little over 120 s while
// the final seconds start at exactly 100 s (131); the port's round is exact.

import { TimeDown } from "./TimeDown.ts";

export class TimeLimit extends TimeDown {
  private readonly finalSeconds: number;
  readonly OnFinalSecondsStarted: Array<() => void> = [];

  constructor(time: number, finalSeconds: number) {
    super(time);
    this.finalSeconds = finalSeconds;
  }

  get FinalSeconds(): number {
    return this.finalSeconds;
  }

  /** FinalSecondsRoutine: seconds from the start to OnFinalSecondsStarted. */
  get TimeToFinalSeconds(): number {
    return this.Time - this.finalSeconds;
  }
}
