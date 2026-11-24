// Upstream: Assets/Scripts/Items/Ingredients/IngredientData.cs (a ScriptableObject per ingredient variant; the ten
// assets are in data/kitchen-data.json, generated from the upstream YAML by tools/gen-data.ts).
//
// `Spawn()` instantiated the variant's prefab; here it takes a new item of that variant in the kitchen's state (the
// kitchen gives every data object its spawner). Upstream's dictionaries key on the asset; for these ten assets that is
// the same as keying on (name, status), and the port keys on `Index`.

import type { Ingredient } from "./Ingredient.ts";
import { IngredientNameText, type IngredientName } from "./IngredientName.ts";
import { IngredientStatus } from "./IngredientStatus.ts";

export class IngredientData {
  /** The variant: 0 to 9, in the order of PORT.md 5.6. */
  readonly Index: number;
  /** The asset's name (Meat_Cooked). */
  readonly AssetName: string;
  /** The icon's name: a sprite of the kit's icon sheet (upstream: a Sprite). */
  readonly Icon: string;
  readonly Name: IngredientName;
  readonly Status: IngredientStatus;
  readonly PreparationTime: number;
  /** Set by the kitchen: makes a new item of this variant. */
  spawner: ((data: IngredientData) => Ingredient | null) | null = null;

  constructor(index: number, assetName: string, icon: string, name: IngredientName, status: IngredientStatus, preparationTime: number) {
    this.Index = index;
    this.AssetName = assetName;
    this.Icon = icon;
    this.Name = name;
    this.Status = status;
    this.PreparationTime = preparationTime;
  }

  /** Null when the kitchen's item pool is full (C10). */
  Spawn(): Ingredient | null {
    return this.spawner ? this.spawner(this) : null;
  }

  toString(): string {
    const status = (Object.keys(IngredientStatus) as Array<keyof typeof IngredientStatus>).find((k) => IngredientStatus[k] === this.Status);
    return `${IngredientNameText(this.Name)}_${status ?? this.Status}`;
  }

  Equals(data: IngredientData | null): boolean {
    return data !== null && this.Name === data.Name && this.Status === data.Status;
  }
}
