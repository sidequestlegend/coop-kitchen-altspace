// Upstream: Assets/Scripts/Matches/TimeDown.cs. A countdown of whole seconds: OnStarted, OnUpdated(Time), one second,
// OnUpdated(Time - 1), ..., OnUpdated(0) and OnFinished in the same frame, Time seconds after the start (78).
//
// The coroutine becomes a start time in the match state. OnStarted and OnFinished are fired once by the referee (they
// change the match); the per-second OnUpdated ticks are what each client draws and beeps, derived from the start time,
// so a player who arrives late is not played the ticks that have passed.

export class TimeDown {
  /** Whole seconds. */
  readonly Time: number;
  readonly OnStarted: Array<() => void> = [];
  readonly OnFinished: Array<() => void> = [];
  readonly OnUpdated: Array<(time: number) => void> = [];

  constructor(time: number) {
    this.Time = time;
  }

  /** The value shown `elapsed` seconds after the start: Time, Time - 1, ..., 0 (null before the start). */
  ValueAt(elapsed: number): number | null {
    if (elapsed < 0) return null;
    return Math.max(0, this.Time - Math.floor(elapsed));
  }

  /** The OnUpdated values whose moment lies in (fromElapsed, toElapsed]: the ticks a client crossed since it last looked. */
  TicksBetween(fromElapsed: number, toElapsed: number): number[] {
    const out: number[] = [];
    for (let k = 0; k <= this.Time; k++) if (k > fromElapsed && k <= toElapsed) out.push(this.Time - k);
    if (fromElapsed < 0 && toElapsed >= 0) out.unshift(this.Time);
    return out.filter((v, i, a) => a.indexOf(v) === i);
  }
}
