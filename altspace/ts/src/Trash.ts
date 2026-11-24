// Upstream: Assets/Scripts/Items/Trash.cs. An ingredient (any state) is thrown away with a sound and a 0.52 s shrink
// (56); from a held plate, only the last ingredient, one per press (57); an empty plate is not taken (58).
//
// One change (C11): the item leaves the state at once and the shrink is only drawn. Upstream destroys it when its
// animation ends, and a second item sent within that half second leaves the first one behind (129): fixed.

import { Behaviour, type GameObject, type HostEventDetail } from "../portkit/src/index.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import { IItemDisposerKind, type IItemDisposer } from "./IItemDisposer.ts";
import type { IItemHolder } from "./IItemHolder.ts";
import { IItemTransferKind, type IItemTransfer } from "./IItemTransfer.ts";
import type { ItemHolder } from "./ItemHolder.ts";
import type { Kitchen } from "./Kitchen.ts";

export class Trash extends Behaviour implements IItemDisposer, IItemTransfer {
  kitchen!: Kitchen;
  cell = "";
  top: GameObject | null = null;

  readonly kinds: readonly string[] = [IItemDisposerKind, IItemTransferKind];
  private holder!: ItemHolder;

  get IsEnabled(): boolean {
    return this.kitchen.off[this.cell] !== 1;
  }
  set IsEnabled(value: boolean) {
    if (value) delete this.kitchen.off[this.cell];
    else this.kitchen.off[this.cell] = 1;
  }

  override Start(): void {
    this.holder = this.kitchen.Holder(this.cell);
  }

  /** The local player clicked the trash: E on it. */
  Clicked(detail?: HostEventDetail): void {
    this.kitchen.LocalIntent("E", "c:" + this.cell, detail?.point ?? null);
  }

  TryTransferItem(fromHolder: IItemHolder): boolean {
    const item = fromHolder.CurrentItem as (IItemCollectable & { kind?: string }) | null;
    if (item && item.kind === "ingredient") {
      fromHolder.ReleaseItem();
      this.Dispose(item);
      return true;
    }
    return false;
  }

  Dispose(item: IItemCollectable): void {
    this.holder.PlaceItem(item);
    this.PlayAnimationAndDestroyItem();
  }

  private PlayAnimationAndDestroyItem(): void {
    this.kitchen.Fx("trash", this.cell);
    this.holder.DestroyItem();
  }
}
