// Upstream: Assets/Scripts/Items/ItemHandler.cs. What E (TryInteractWithItem) and Q (TryInteractWithEnvironment) do,
// given what the chef holds and what the chef faces. Kept line for line; only "what the chef faces" changed (C2):
// `detector` is the target the chef chose (ActionCode.BoxCaster), set by the kitchen before each intent.
//
// One handler per chef (upstream: one per chef object, two chefs, one controlled at a time). It runs on the referee.

import { BoxCaster } from "./ActionCode.ts";
import { IInteractableKind, type IInteractable } from "./IInteractable.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import { IItemCollectableKind } from "./IItemCollectable.ts";
import { IItemCollectorKind, type IItemCollector } from "./IItemCollector.ts";
import { IItemDisposerKind, type IItemDisposer } from "./IItemDisposer.ts";
import { IItemHolderKind, type IItemHolder } from "./IItemHolder.ts";
import { IItemTransferKind, type IItemTransfer } from "./IItemTransfer.ts";
import type { ItemHolder } from "./ItemHolder.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { Plate } from "./Plate.ts";

export class ItemHandler {
  readonly holder: ItemHolder;
  detector: BoxCaster = new BoxCaster(null);
  private readonly kitchen: Kitchen;

  constructor(kitchen: Kitchen, holder: ItemHolder) {
    this.kitchen = kitchen;
    this.holder = holder;
  }

  IsHoldingPlate(): boolean {
    return this.holder.IsPlate() !== null;
  }

  TryInteractWithItem(): void {
    if (this.holder.HasItem()) {
      if (this.TryInteractWithPlate()) return;

      const wasItemTransfered = this.TryTransferItem();
      const canReleaseItemOnTheFloor = !wasItemTransfered && !this.detector.HasHit;

      if (canReleaseItemOnTheFloor) {
        this.holder.ReleaseItem();
        this.kitchen.Fx("hand", "drop", this.kitchen.SoundSpot());
      }
    } else {
      const item = this.TryGetCollectableItem();
      if (item) {
        this.holder.PlaceItem(item);
        this.kitchen.Fx("hand", "pickup", this.kitchen.SoundSpot());
      }
    }
  }

  TryInteractWithEnvironment(): void {
    const interactable = this.detector.TryGetEnabledComponent<IInteractable>(IInteractableKind);
    if (interactable) interactable.Interact();
  }

  private TryInteractWithPlate(): boolean {
    const plate = this.holder.IsPlate();
    return plate !== null && (this.TryDisposeLastPlateIngredient(plate) || this.TryPlateIngredient(plate));
  }

  private TryDisposeLastPlateIngredient(plate: Plate): boolean {
    if (!plate.HasIngredients()) return false;
    const disposer = this.detector.TryGetEnabledComponent<IItemDisposer>(IItemDisposerKind);
    if (disposer && disposer.IsEnabled) disposer.Dispose(plate.RemoveLast());
    return disposer !== null;
  }

  private TryPlateIngredient(plate: Plate): boolean {
    const holder = this.detector.TryGetEnabledComponent<IItemHolder>(IItemHolderKind);
    return holder !== null && plate.TryTransferItem(holder);
  }

  private TryTransferItem(): boolean {
    const transfer = this.detector.TryGetEnabledComponent<IItemTransfer>(IItemTransferKind);
    return transfer !== null && transfer.TryTransferItem(this.holder);
  }

  private TryGetCollectableItem(): IItemCollectable | null {
    const collector = this.detector.TryGetEnabledComponent<IItemCollector>(IItemCollectorKind);
    if (collector) {
      const collected = collector.TryCollectItem();
      return collected.ok ? collected.item : null;
    }
    // A collector that exists but is switched off still answers "no" upstream (TryGetEnabledComponent returns false,
    // then the item lookup runs on the same hit object, which a counter is not).
    return this.detector.TryGetEnabledComponent<IItemCollectable>(IItemCollectableKind);
  }
}
