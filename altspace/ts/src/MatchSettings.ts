// Upstream: Assets/Scripts/Matches/MatchSettings.cs. The countdown (3 s) and the time limit (120 s, final 20 s) of a
// round, and whether the time limit may start (the tutorial says no). The values are the asset's
// (data/kitchen-data.json); the round's length is the snippet's `round` setting (default the asset's 120).

import data from "../data/kitchen-data.json" with { type: "json" };
import { TimeDown } from "./TimeDown.ts";
import { TimeLimit } from "./TimeLimit.ts";

export class MatchSettings {
  readonly CountDown: TimeDown;
  TimeLimit: TimeLimit;
  IsAllowToStartTimeLimit = true;

  constructor(roundSeconds: number = data.match.timeLimit) {
    this.CountDown = new TimeDown(data.match.countDown);
    this.TimeLimit = new TimeLimit(roundSeconds, data.match.finalSeconds);
  }

  /** MatchManager.Start: `Invoke(nameof(StartCountDown), 0.2F)`. */
  static get StartDelay(): number {
    return data.match.startDelay;
  }

  /** A round of another length (the events' listeners move over). */
  SetRoundLength(seconds: number): void {
    if (seconds === this.TimeLimit.Time) return;
    const next = new TimeLimit(seconds, data.match.finalSeconds);
    next.OnStarted.push(...this.TimeLimit.OnStarted);
    next.OnFinished.push(...this.TimeLimit.OnFinished);
    next.OnUpdated.push(...this.TimeLimit.OnUpdated);
    next.OnFinalSecondsStarted.push(...this.TimeLimit.OnFinalSecondsStarted);
    this.TimeLimit = next;
  }
}
