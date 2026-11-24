// Upstream: Assets/Scripts/Counters/Preparation/PreparationWarning.cs. The stove's warning icon: shown with a beep,
// hidden. Upstream Stove.cs blinks it from a coroutine: 3 times 0.8 s on, 0.2 s off from 2 s after cooking ended, then
// 5 times 0.2 s on, 0.2 s off (50). The port derives the blink from the burn sequence's start time on every client
// (PORT.md 3.3: "blinks and beeps local"), so nothing is written per blink.

/** Seconds after the burn sequence started at which the icon is shown, and for how long. */
export const WARNING_BLINKS: ReadonlyArray<readonly [number, number]> = (() => {
  const out: Array<[number, number]> = [];
  let t = 2; // timeBeforeBurn
  for (let i = 0; i < 3; i++, t += 1) out.push([t, 0.8]);
  for (let i = 0; i < 5; i++, t += 0.4) out.push([Math.round(t * 10) / 10, 0.2]);
  return out;
})();

export class PreparationWarning {
  /** Whether the icon is shown `elapsed` seconds into the burn sequence (`timeBeforeBurn` is the stove's). */
  static IsVisibleAt(elapsed: number, timeBeforeBurn = 2): boolean {
    const shift = timeBeforeBurn - 2;
    return WARNING_BLINKS.some(([from, length]) => elapsed >= from + shift && elapsed < from + shift + length);
  }

  /** How many times the icon has been shown (and beeped) by `elapsed` seconds into the burn sequence. */
  static ShownCount(elapsed: number, timeBeforeBurn = 2): number {
    const shift = timeBeforeBurn - 2;
    return WARNING_BLINKS.filter(([from]) => elapsed >= from + shift).length;
  }
}
