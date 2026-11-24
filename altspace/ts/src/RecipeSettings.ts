// Upstream: Assets/Scripts/Recipes/RecipeSettings.cs (with RecipeManager.cs's one line: Awake -> Initialize).

import data from "../data/kitchen-data.json" with { type: "json" };
import type { Ingredient } from "./Ingredient.ts";
import type { IngredientData } from "./IngredientData.ts";
import type { IngredientSettings } from "./IngredientSettings.ts";
import { PlatedIngredient } from "./PlatedIngredient.ts";
import { RandomUtils } from "./RandomUtils.ts";
import { RecipeData } from "./RecipeData.ts";

export class RecipeSettings {
  readonly recipes: RecipeData[];
  /** Debug.LogError. */
  logError: (message: string) => void = () => undefined;

  constructor(ingredients: IngredientSettings) {
    this.recipes = data.recipes.map(
      (r, index) =>
        new RecipeData(
          index,
          r.asset ?? "",
          r.name ?? "",
          r.plated.map((p) => new PlatedIngredient(ingredients.variants[p.variant]!, p.position as [number, number, number], p.rotation as [number, number, number])),
          r.chance,
          r.tipMultiplier,
        ),
    );
  }

  Initialize(): void {
    for (const recipe of this.recipes) recipe.Initialize();
  }

  /** `roll` is upstream's `Random.value`. */
  GetRandom(roll: number): RecipeData {
    return RandomUtils.WeightedRandom(this.recipes, roll);
  }

  CanPlate(ingredientData: IngredientData): boolean {
    for (const recipe of this.recipes) if (recipe.CanPlate(ingredientData)) return true;
    return false;
  }

  Plate(ingredients: readonly Ingredient[]): void {
    const recipe = this.GetClosestRecipe(ingredients);
    if (!recipe) {
      this.logError("RecipeSettings does not contains any recipe for any given ingredient.");
      return;
    }
    for (const ingredient of ingredients) recipe.Plate(ingredient);
  }

  GetClosestRecipe(ingredients: readonly Ingredient[]): RecipeData | null {
    for (const recipe of this.recipes) if (recipe.ContainsAll(ingredients)) return recipe;
    return null;
  }
}
