// Upstream: Assets/Scripts/Recipes/RecipeData.cs (the five recipe assets are in data/kitchen-data.json).
//
// Kept literally (checklist 125): `ContainsOnly` is "as many ingredients as the recipe has, and every one of them is in
// the recipe", not a multiset test, so bread + cheese + cheese is accepted as an X Burger. And two recipes carry the
// same shown name, "Salad Burger" (124, kept).

import type { IChanceable } from "./IChanceable.ts";
import type { Ingredient } from "./Ingredient.ts";
import type { IngredientData } from "./IngredientData.ts";
import type { IngredientSettings } from "./IngredientSettings.ts";
import type { PlatedIngredient } from "./PlatedIngredient.ts";

const f = Math.fround;

export class RecipeData implements IChanceable {
  readonly Index: number;
  readonly AssetName: string;
  readonly Name: string;
  readonly PlatedIngredients: PlatedIngredient[];
  readonly Chance: number;
  readonly TipMultiplier: number;
  private platedIngredients: Map<number, PlatedIngredient> | null = null;

  constructor(index: number, assetName: string, name: string, plated: PlatedIngredient[], chance: number, tipMultiplier: number) {
    this.Index = index;
    this.AssetName = assetName;
    this.Name = name;
    this.PlatedIngredients = plated;
    this.Chance = chance;
    this.TipMultiplier = tipMultiplier;
  }

  Initialize(): void {
    this.platedIngredients = new Map();
    for (const platedIngredient of this.PlatedIngredients) {
      if (this.platedIngredients.has(platedIngredient.Data.Index)) throw new Error(`${this.AssetName}: an ingredient twice (C# Dictionary.Add throws)`);
      this.platedIngredients.set(platedIngredient.Data.Index, platedIngredient);
    }
  }

  /** In 32-bit floats, as C# adds them. */
  GetWaitingTime(settings: IngredientSettings, additionalTimePerIngredient: number): number {
    let time = f(this.PlatedIngredients.length * f(additionalTimePerIngredient));
    for (const ingredient of this.PlatedIngredients) time = f(time + f(settings.GetPreparationTime(ingredient.Data)));
    return time;
  }

  Plate(ingredient: Ingredient): void {
    this.platedIngredients!.get(ingredient.Data.Index)!.Plate(ingredient);
  }

  CanPlate(ingredientData: IngredientData): boolean {
    const plated = this.platedIngredients!.get(ingredientData.Index);
    return plated !== undefined && plated.Equals(ingredientData);
  }

  ContainsOnly(ingredients: readonly Ingredient[]): boolean {
    const hasSameNumerOfIngredients = ingredients.length === this.platedIngredients!.size;
    return hasSameNumerOfIngredients && this.ContainsAll(ingredients);
  }

  ContainsAll(ingredients: readonly Ingredient[]): boolean {
    for (const ingredient of ingredients) {
      if (!this.platedIngredients!.has(ingredient.Data.Index)) return false;
    }
    return true;
  }
}
