// Upstream: Assets/Scripts/Counters/IngredientCounter.cs. A crate: an item on its top is taken first; with nothing on top
// the door swings open and a new ingredient of the crate's kind is in the chef's hands; supply is unlimited (16, 26).
//
// One change (C10): items are drawn with a pool of 48 kit objects, so when the kitchen already holds 48 items the crate
// gives nothing and shows the "Cannot" cue instead.

import type { IItemCollectable } from "./IItemCollectable.ts";
import type { Collected } from "./IItemCollector.ts";
import { Counter } from "./Counter.ts";
import type { IngredientData } from "./IngredientData.ts";
import type { IngredientName } from "./IngredientName.ts";
import { POOL_SIZE } from "./Kitchen.ts";

export class IngredientCounter extends Counter {
  /** The ingredient variant this crate gives (`data`, an IngredientData asset upstream). */
  data = 0;

  readonly OnItemCollectedFromInside: Array<(item: IItemCollectable) => void> = [];

  get Data(): IngredientData {
    return this.kitchen.ingredientSettings.variants[this.data]!;
  }

  override TryCollectItem(): Collected {
    const collected = super.TryCollectItem();
    if (collected.ok) return collected;

    const item = this.kitchen.ItemCount() < POOL_SIZE ? this.Data.Spawn() : null;
    if (!item) {
      this.kitchen.Fx("full", this.cell);
      return { ok: false, item: null };
    }
    this.PlayOpenAnimation();
    for (const listener of this.OnItemCollectedFromInside.slice()) listener(item);
    return { ok: true, item };
  }

  GetIngredientName(): IngredientName {
    return this.Data.Name;
  }

  private PlayOpenAnimation(): void {
    this.kitchen.Fx("crate", this.cell);
  }
}
