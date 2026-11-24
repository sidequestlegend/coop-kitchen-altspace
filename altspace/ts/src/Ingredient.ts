// Upstream: Assets/Scripts/Items/Ingredients/Ingredient.cs. An ingredient item; its variant is its data.

import { AbstractItem } from "./AbstractItem.ts";
import type { IngredientData } from "./IngredientData.ts";
import type { IngredientName } from "./IngredientName.ts";
import type { IngredientStatus } from "./IngredientStatus.ts";

export class Ingredient extends AbstractItem {
  readonly kind = "ingredient" as const;

  get Data(): IngredientData {
    return this.kitchen.ingredientSettings.variants[this.rec.k]!;
  }

  get Icon(): string {
    return this.Data.Icon;
  }

  get Name(): IngredientName {
    return this.Data.Name;
  }

  get Status(): IngredientStatus {
    return this.Data.Status;
  }

  get PreparationTime(): number {
    return this.Data.PreparationTime;
  }

  /** PlatedIngredient.Plate: the ingredient's local pose on its plate (position at upstream scale, yaw in degrees). */
  SetLocalPose(position: readonly [number, number, number], yaw: number): void {
    this.rec.lp = [position[0], position[1], position[2], yaw];
  }
}
