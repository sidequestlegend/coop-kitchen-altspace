// Upstream: Assets/Scripts/Recipes/PlatedIngredient.cs. Where an ingredient sits on a plate for one recipe.

import type { Ingredient } from "./Ingredient.ts";
import type { IngredientData } from "./IngredientData.ts";

export class PlatedIngredient {
  private readonly ingredientData: IngredientData;
  /** Local position on the plate, metres at upstream scale. */
  private readonly position: [number, number, number];
  /** Euler angles in degrees. */
  private readonly rotation: [number, number, number];

  constructor(ingredientData: IngredientData, position: [number, number, number], rotation: [number, number, number]) {
    this.ingredientData = ingredientData;
    this.position = position;
    this.rotation = rotation;
  }

  get Data(): IngredientData {
    return this.ingredientData;
  }

  /** Upstream: `ingredient.transform.SetLocalPositionAndRotation(position, rotation)`; here the pose goes into its state. */
  Plate(ingredient: Ingredient): void {
    ingredient.SetLocalPose(this.position, this.rotation[1]);
  }

  Equals(ingredientData: IngredientData): boolean {
    return this.ingredientData.Equals(ingredientData);
  }
}
