// Upstream: Assets/Scripts/Utils/RandomUtils.cs. A weighted random pick.
//
// Kept exactly, in 32-bit floats as C# computes it: the running totals 0, 35, 50, 75, 90, 100 are floats, the roll is
// multiplied by the last one, and the binary search covers only the first `itemCount` totals (not the last), so a roll
// of exactly 1 is not found and falls into the last item. The roll is passed in: upstream reads `Random.value`
// (inclusive 0 to 1), the port's referee draws it from a seeded generator kept in the orders state (OrderSettings).

import type { IChanceable } from "./IChanceable.ts";

const f = Math.fround;

export const RandomUtils = {
  /** Selects a weighted random item. `roll` is upstream's `Random.value`. */
  WeightedRandom<T extends IChanceable>(items: readonly T[], roll: number): T {
    return items[RandomUtils.WeightedIndex(items, roll)]!;
  },

  WeightedIndex(items: readonly IChanceable[], roll: number): number {
    const itemCount = items.length;
    const orderedItems = new Float32Array(itemCount + 1);
    for (let i = 0; i < itemCount; i++) orderedItems[i + 1] = f(orderedItems[i]! + f(items[i]!.Chance));

    const num = f(f(roll) * orderedItems[itemCount]!);
    let index = BinarySearch(orderedItems, itemCount, num);
    if (index < 0) index = ~index - 1;
    return index;
  },
};

function BinarySearch(array: Float32Array, length: number, value: number): number {
  let low = 0;
  let high = length - 1;
  while (low <= high) {
    const i = low + ((high - low) >> 1);
    const element = array[i]!;
    const order = element < value ? -1 : element > value ? 1 : 0;
    if (order === 0) return i;
    if (order < 0) low = i + 1;
    else high = i - 1;
  }
  return ~low;
}
