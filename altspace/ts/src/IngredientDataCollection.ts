// Upstream: Assets/Scripts/Items/Ingredients/IngredientDataCollection.cs. The variants of one ingredient, in asset
// order. The order matters: "previous variant" of the first entry is the entry itself, which is why cooked meat adds
// 0 s to an order's waiting time (the Meat collection lists Meat_Cooked before Meat; checklist 123, kept).

import type { IngredientData } from "./IngredientData.ts";
import type { IngredientName } from "./IngredientName.ts";
import type { IngredientStatus } from "./IngredientStatus.ts";

export class IngredientDataCollection {
  readonly Name: IngredientName;
  private readonly ingredients: IngredientData[];
  private ingredientsDictionary: Map<IngredientStatus, IngredientData> | null = null;

  constructor(name: IngredientName, ingredients: IngredientData[]) {
    this.Name = name;
    this.ingredients = ingredients;
  }

  get Ingredients(): readonly IngredientData[] {
    return this.ingredients;
  }

  TryGetIngredientData(status: IngredientStatus): IngredientData | null {
    return this.ingredientsDictionary!.get(status) ?? null;
  }

  GetPreviousIngredientData(data: IngredientData): IngredientData | null {
    for (let i = 0; i < this.ingredients.length; i++) {
      const isIngredient = this.ingredients[i]!.Equals(data);
      if (isIngredient) {
        const previousIndex = i - 1;
        const safeIndex = Math.max(0, previousIndex);
        return this.ingredients[safeIndex]!;
      }
    }
    return null;
  }

  InitializeDictionary(): void {
    this.ingredientsDictionary = new Map();
    for (const data of this.ingredients) {
      if (this.ingredientsDictionary.has(data.Status)) throw new Error(`${this.Name}: status ${data.Status} twice (C# Dictionary.Add throws)`);
      this.ingredientsDictionary.set(data.Status, data);
    }
  }
}
