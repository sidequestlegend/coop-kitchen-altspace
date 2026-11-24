// Upstream: Assets/Scripts/Items/ItemHolder.cs. A place that holds at most one item (checklist 13): a counter top, a
// board, a stove, a crate top, a chef's hands. Its contents are `holders[key]` in the kitchen's state.
//
// `OnItemPlaced` / `OnItemReleased` are the upstream's C# events. They fire where the change is made, which is the
// referee; every client draws the result from the state. `ReplaceItem` fires release, then place, in that order.

import { invoke } from "./ActionCode.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import { IItemCollectorKind, type Collected, type IItemCollector } from "./IItemCollector.ts";
import { IItemHolderKind, type IItemHolder } from "./IItemHolder.ts";
import { IItemTransferKind } from "./IItemTransfer.ts";
import type { KitchenItems } from "./Kitchen.ts";
import type { Plate } from "./Plate.ts";

export class ItemHolder implements IItemHolder, IItemCollector {
  readonly key: string;
  readonly kinds: readonly string[] = [IItemHolderKind, IItemCollectorKind, IItemTransferKind];
  readonly OnItemReleased: Array<(item: IItemCollectable | null) => void> = [];
  readonly OnItemPlaced: Array<(item: IItemCollectable) => void> = [];
  private readonly kitchen: KitchenItems;
  /** The component's `enabled`; nothing switches a holder off. */
  IsEnabled = true;

  constructor(kitchen: KitchenItems, key: string) {
    this.kitchen = kitchen;
    this.key = key;
  }

  get CurrentItem(): IItemCollectable | null {
    const id = this.kitchen.holders[this.key];
    return id === undefined ? null : this.kitchen.Item(id);
  }
  /** internal set */
  set CurrentItem(item: IItemCollectable | null) {
    if (item) this.kitchen.holders[this.key] = item.id;
    else delete this.kitchen.holders[this.key];
  }

  PlaceItem(item: IItemCollectable): void {
    item.GetCollectible().PickUp(this.key);
    this.CurrentItem = item;
    invoke(this.OnItemPlaced, item);
  }

  ReleaseItem(): void {
    const item = this.CurrentItem;
    if (item) {
      this.kitchen.Releasing(this.key);
      item.GetCollectible().Drop();
    }
    this.CurrentItem = null;
    invoke(this.OnItemReleased, item);
  }

  ReplaceItem(item: IItemCollectable): void {
    this.DestroyItem();
    this.PlaceItem(item);
  }

  TryCollectItem(): Collected {
    if (this.IsEmpty() || !this.CurrentItem!.IsEnabled) return { ok: false, item: null };
    const item = this.CurrentItem;
    this.ReleaseItem();
    return { ok: item !== null, item };
  }

  TryTransferItem(fromHolder: IItemHolder): boolean {
    if (this.HasItem()) {
      const plate = this.IsPlate();
      if (plate) return plate.TryTransferItem(fromHolder);
      return false;
    }
    const item = fromHolder.CurrentItem;
    fromHolder.ReleaseItem();
    if (item) this.PlaceItem(item);
    return true;
  }

  DestroyItem(): void {
    const item = this.CurrentItem;
    this.ReleaseItem();
    item?.Destroy();
  }

  HasItem(): boolean {
    return this.kitchen.holders[this.key] !== undefined;
  }

  IsEmpty(): boolean {
    return !this.HasItem();
  }

  /** `IsPlate(out Plate plate)`: the plate held, or null. */
  IsPlate(): Plate | null {
    const item = this.CurrentItem as (IItemCollectable & { kind?: string }) | null;
    return item && item.kind === "plate" ? (item as unknown as Plate) : null;
  }
}
