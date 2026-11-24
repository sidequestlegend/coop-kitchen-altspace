// Upstream: Assets/Scripts/Items/Ingredients/IngredientSettings.cs (with IngredientManager.cs's one line: Awake ->
// InitializeDictionary). The data is the upstream's, from data/kitchen-data.json.

import data from "../data/kitchen-data.json" with { type: "json" };
import type { Ingredient } from "./Ingredient.ts";
import { IngredientData } from "./IngredientData.ts";
import { IngredientDataCollection } from "./IngredientDataCollection.ts";
import type { IngredientName } from "./IngredientName.ts";
import { IngredientStatus } from "./IngredientStatus.ts";

export class IngredientSettings {
  /** The ten variants by index. */
  readonly variants: IngredientData[];
  private readonly collections: IngredientDataCollection[];
  private collectionDictionary: Map<IngredientName, IngredientDataCollection> | null = null;
  /** Debug.LogError. */
  logError: (message: string) => void = () => undefined;

  constructor() {
    this.variants = data.ingredients.map((v) => new IngredientData(v.index, v.asset, v.icon ?? "", v.name as IngredientName, v.status as IngredientStatus, v.preparationTime));
    this.collections = data.collections.map((c) => new IngredientDataCollection(c.name as IngredientName, c.ingredients.map((i) => this.variants[i]!)));
  }

  InitializeDictionary(): void {
    this.collectionDictionary = new Map();
    for (const container of this.collections) {
      container.InitializeDictionary();
      this.collectionDictionary.set(container.Name, container);
    }
  }

  SpawnIngredient(name: IngredientName, status: IngredientStatus): Ingredient | null {
    const collection = this.TryGetIngredientCollection(name);
    if (!collection) {
      this.logError(`Ingredient ${name} is not present in any collection.`);
      return null;
    }
    const found = collection.TryGetIngredientData(status);
    if (!found) {
      this.logError(`Ingredient Status ${status} is not present into ${collection.Name}`);
      return null;
    }
    return found.Spawn();
  }

  TryGetIngredientCollection(name: IngredientName): IngredientDataCollection | null {
    return this.collectionDictionary!.get(name) ?? null;
  }

  GetPreparationTime(ingredientData: IngredientData): number {
    if (ingredientData.Status === IngredientStatus.Ready) {
      const previousData = this.collectionDictionary!.get(ingredientData.Name)!.GetPreviousIngredientData(ingredientData)!;
      return previousData.PreparationTime;
    }
    return ingredientData.PreparationTime;
  }

  GetData(ingredient: Ingredient): IngredientData | null {
    for (const collection of this.collections) {
      if (collection.Name !== ingredient.Name) continue;
      for (const d of collection.Ingredients) if (d.Status === ingredient.Status) return d;
    }
    return null;
  }
}
