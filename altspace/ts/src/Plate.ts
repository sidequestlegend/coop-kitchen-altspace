// Upstream: Assets/Scripts/Items/Plate.cs. A plate takes ingredients that some recipe contains (checklist 30), at most
// one bread (31), never from a board or stove that is preparing (32), and lays them out as the first recipe that
// contains all of them (36). Kept literally, including two quirks: any number of non-bread ingredients, repeats too
// (126), and the bread flag that is never cleared, even when the bread is scraped off at the trash (127).

import { AbstractItem } from "./AbstractItem.ts";
import { IsIngredient } from "./IItemCollectableExtension.ts";
import type { IItemHolder } from "./IItemHolder.ts";
import { IItemTransferKind, type IItemTransfer } from "./IItemTransfer.ts";
import { IItemCollectableKind } from "./IItemCollectable.ts";
import { IngredientIcons } from "./IngredientIcons.ts";
import { IngredientName } from "./IngredientName.ts";
import { Ingredient } from "./Ingredient.ts";

export class Plate extends AbstractItem implements IItemTransfer {
  readonly kind = "plate" as const;
  override readonly kinds: readonly string[] = [IItemCollectableKind, IItemTransferKind];
  private readonly icons = new IngredientIcons();

  /** `event Action<Ingredient> OnIngredientPlated`: the kitchen keeps one list for every plate (the plate is passed too). */
  get OnIngredientPlated(): Array<(ingredient: Ingredient, plate: Plate) => void> {
    return this.kitchen.plateEvents;
  }

  private get hasBread(): boolean {
    return this.rec.bread === 1;
  }
  private set hasBread(value: boolean) {
    if (value) this.rec.bread = 1;
    else delete this.rec.bread;
  }

  /** The ingredients bottom to top (a C# Stack, kept as the order they were pushed). */
  get IngredientList(): Ingredient[] {
    return (this.rec.ings ?? []).map((id) => this.kitchen.Item(id)).filter((i): i is Ingredient => i instanceof Ingredient);
  }

  /** `Ingredients.ToArray()` on a C# Stack: top first. */
  IngredientsToArray(): Ingredient[] {
    return this.IngredientList.reverse();
  }

  HasIngredients(): boolean {
    return (this.rec.ings ?? []).length > 0;
  }

  TryTransferItem(fromHolder: IItemHolder): boolean {
    const isPreparing = (fromHolder as { isPreparationCounter?: boolean }).isPreparationCounter === true && (fromHolder as unknown as { IsPreparing: boolean }).IsPreparing;
    if (isPreparing) return false;

    const isDoubleBread = this.hasBread && IsIngredient(fromHolder.CurrentItem, IngredientName.Bread);
    if (isDoubleBread) return false;

    const ingredient = fromHolder.CurrentItem instanceof Ingredient ? fromHolder.CurrentItem : null;
    const canPlate = ingredient !== null && this.kitchen.recipeSettings.CanPlate(ingredient.Data);

    if (canPlate) {
      fromHolder.ReleaseItem();
      this.PlateIngredient(ingredient!);
    }
    return canPlate;
  }

  RemoveLast(): Ingredient {
    const ings = this.rec.ings ?? [];
    const id = ings.pop()!;
    if (ings.length === 0) delete this.rec.ings;
    const ingredient = this.kitchen.Item(id) as Ingredient;
    this.kitchen.Releasing(this.id);
    ingredient.GetCollectible().Drop();
    this.icons.Remove(ingredient.Icon);
    return ingredient;
  }

  private PlateIngredient(ingredient: Ingredient): void {
    if (!this.hasBread) this.hasBread = ingredient.Name === IngredientName.Bread;

    ingredient.GetCollectible().PickUp(this.id);

    (this.rec.ings ??= []).push(ingredient.id);
    this.kitchen.recipeSettings.Plate(this.IngredientsToArray());

    this.icons.Add(ingredient.Icon);

    for (const listener of this.OnIngredientPlated.slice()) listener(ingredient, this);
  }
}
