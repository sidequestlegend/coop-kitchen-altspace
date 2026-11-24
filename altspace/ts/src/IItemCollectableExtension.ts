// Upstream: Assets/Scripts/Items/Interfaces/IItemCollectableExtension.cs.

import type { IItemCollectable } from "./IItemCollectable.ts";
import { Ingredient } from "./Ingredient.ts";
import type { IngredientName } from "./IngredientName.ts";
import type { IngredientStatus } from "./IngredientStatus.ts";

export function IsIngredient(item: IItemCollectable | null, name: IngredientName, status?: IngredientStatus): boolean {
  if (!(item instanceof Ingredient)) return false;
  if (item.Name !== name) return false;
  return status === undefined || item.Status === status;
}
