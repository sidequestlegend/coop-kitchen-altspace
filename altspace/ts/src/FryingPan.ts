// Upstream: Assets/Scripts/Counters/Preparation/FryingPan.cs. The stove's pan: sizzle sound and particles while frying
// (47), smoke when the meat has burned (50, 53). Kept as flags in the stove's state; every client draws them.

import type { PrepRec } from "./Kitchen.ts";

export class FryingPan {
  private readonly state: () => PrepRec;

  constructor(state: () => PrepRec) {
    this.state = state;
  }

  StartFry(): void {
    this.state().fry = 1;
  }

  StopFry(): void {
    this.state().fry = 0;
  }

  StartBurn(): void {
    this.state().smoke = 1;
  }

  StopBurn(): void {
    this.state().smoke = 0;
  }
}
