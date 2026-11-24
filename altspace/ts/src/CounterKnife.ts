// Upstream: Assets/Scripts/Counters/Preparation/CounterKnife.cs. The knife on a cutting board: shown and hidden (45),
// and a random chop sound (3 clips) every 0.25 s while cutting (44; upstream: events of the Cutting animation).
//
// Shown and hidden by the referee into the board's state (`knife`), so every client shows the same; the chops are
// played by each client for itself while it draws the board cutting.

import type { Kitchen, PrepRec } from "./Kitchen.ts";

export class CounterKnife {
  private readonly kitchen: Kitchen;
  private readonly state: () => PrepRec;
  /** The kit object the chop sounds are played at. */
  private readonly at: string;

  constructor(kitchen: Kitchen, state: () => PrepRec, at: string) {
    this.kitchen = kitchen;
    this.state = state;
    this.at = at;
  }

  Show(): void {
    this.state().knife = 1;
  }

  Hide(): void {
    this.state().knife = 0;
  }

  PlayCutSound(): void {
    this.kitchen.PlaySound("chop", this.at);
  }
}
