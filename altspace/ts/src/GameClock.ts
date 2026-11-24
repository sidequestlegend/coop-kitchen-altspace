// New file (no upstream counterpart; PORT.md 3.1). Upstream keeps time in coroutines (`WaitForSeconds`, per-frame
// `Time.deltaTime` sums) on one machine, and pauses by setting `Time.timeScale = 0`. None of that survives a change of
// referee, and room state cannot be written every frame. The port keeps time as numbers in synced state instead:
//
//   - The game clock G: seconds of scaled game time. G = serverNow - epoch while running, a frozen value while paused;
//     on resume the epoch moves forward by the length of the pause. serverNow is the synced server clock, the same on
//     every client, so every client derives the same G and a new referee carries on from the same numbers.
//   - Every upstream wait is a deadline in G kept in the state of the behaviour that owns it; the referee's Update
//     (20 Hz) fires whatever is due, and records that it did in the same write, so it fires once.
//   - Every per-frame sum (a preparation's progress) is (acc, since): acc + elapsed(since, G), where the elapsed time
//     counts the final-seconds booster exactly over the part of the interval it covers (`boostedElapsed`).

export interface ClockState {
  /** The epoch: server seconds at which G was 0 (moved forward by every pause). */
  e: number;
  /** G while paused; null while running. */
  f: number | null;
}

export class GameClock {
  private readonly server: () => number;
  private readonly state: () => ClockState;

  constructor(server: () => number, state: () => ClockState) {
    this.server = server;
    this.state = state;
  }

  /** A clock whose G is 0 now. */
  static Start(serverNow: number): ClockState {
    return { e: serverNow, f: null };
  }

  /** Game seconds now. */
  get G(): number {
    const s = this.state();
    return s.f !== null ? s.f : this.server() - s.e;
  }

  get Paused(): boolean {
    return this.state().f !== null;
  }

  /** The state after a pause now (unchanged if already paused). */
  Pause(): ClockState {
    const s = this.state();
    return s.f !== null ? { ...s } : { e: s.e, f: this.server() - s.e };
  }

  /** The state after resuming now: G carries on from where it stopped. */
  Resume(): ClockState {
    const s = this.state();
    return s.f === null ? { ...s } : { e: this.server() - s.f, f: null };
  }
}

/**
 * Seconds of progress from `from` to `to` when progress runs `factor` times faster inside [boostFrom, boostTo)
 * (upstream: `currentTime += Time.deltaTime * preparationBooster`, with the booster set at OnFinalSecondsStarted and put
 * back at TimeLimit.OnFinished). With no window, plain elapsed time.
 */
export function boostedElapsed(from: number, to: number, boostFrom: number | null, boostTo: number | null, factor: number): number {
  if (to <= from) return 0;
  if (boostFrom === null || boostTo === null || factor === 1 || boostTo <= boostFrom) return to - from;
  const overlap = Math.max(0, Math.min(to, boostTo) - Math.max(from, boostFrom));
  return to - from - overlap + overlap * factor;
}

/** When progress `acc` made at `since` reaches `target`, under the same booster window: the inverse of boostedElapsed. */
export function whenReached(since: number, acc: number, target: number, boostFrom: number | null, boostTo: number | null, factor: number): number {
  const need = target - acc;
  if (need <= 0) return since;
  if (boostFrom === null || boostTo === null || factor === 1 || boostTo <= boostFrom || boostTo <= since) return since + need;
  // before the window
  const plainBefore = Math.max(0, boostFrom - since);
  if (need <= plainBefore) return since + need;
  const start = Math.max(since, boostFrom);
  const inWindow = (boostTo - start) * factor;
  const left = need - plainBefore;
  if (left <= inWindow) return start + left / factor;
  return boostTo + (left - inWindow);
}

/** Rounds a time for state (microseconds), so that the same value has one JSON form on every client. */
export function roundTime(t: number): number {
  return Math.round(t * 1e6) / 1e6;
}
