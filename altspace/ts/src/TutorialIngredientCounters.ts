// Upstream: Assets/Scripts/Tutorials/Steps/TutorialIngredientCounters.cs. The crate of each ingredient. Upstream adds
// every crate to a dictionary by ingredient, which throws when a kitchen has two crates of a kind (the classic kitchen
// has two of each); the port runs the tutorial in the classic kitchen and takes the `_00` crate of each kind.

import type { IngredientCounter } from "./IngredientCounter.ts";
import type { IngredientName } from "./IngredientName.ts";

export class TutorialIngredientCounters {
  private counters = new Map<IngredientName, IngredientCounter>();

  Load(crates: readonly IngredientCounter[]): void {
    this.counters = new Map();
    const ordered = crates.slice().sort((a, b) => Number(!a.cell.endsWith("_00")) - Number(!b.cell.endsWith("_00")));
    for (const counter of ordered) if (!this.counters.has(counter.GetIngredientName())) this.counters.set(counter.GetIngredientName(), counter);
  }

  FindCounter(name: IngredientName): IngredientCounter {
    const counter = this.counters.get(name);
    if (!counter) throw new Error(`no crate of ingredient ${name}`);
    return counter;
  }
}
