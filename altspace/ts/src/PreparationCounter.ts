// Upstream: Assets/Scripts/Counters/Preparation/PreparationCounter.cs. The counter under a cutting board or a stove: its
// holder is the board's or stove's; nothing is taken from it or put on it while it is preparing (19, 21); Q on it is
// Q on its preparator (38, 46).
//
// Q has its own kit object (the knife or the stove's knob, ClickedKnob in bindings.json); a click on the counter is E.

import type { HostEventDetail } from "../portkit/src/index.ts";
import type { AbstractIngredientPreparator } from "./AbstractIngredientPreparator.ts";
import { Counter } from "./Counter.ts";
import { IInteractableKind, type IInteractable } from "./IInteractable.ts";
import type { Collected } from "./IItemCollector.ts";
import { IItemCollectorKind } from "./IItemCollector.ts";
import type { IItemHolder } from "./IItemHolder.ts";
import { IItemHolderKind } from "./IItemHolder.ts";
import { IItemTransferKind } from "./IItemTransfer.ts";

export class PreparationCounter extends Counter implements IInteractable {
  preparator!: AbstractIngredientPreparator;

  override readonly kinds: readonly string[] = [IItemHolderKind, IItemCollectorKind, IItemTransferKind, IInteractableKind];
  /** `fromHolder is PreparationCounter` without a runtime import cycle (Plate.cs). */
  readonly isPreparationCounter = true;
  readonly OnInteracted: Array<() => void> = [];

  get IsPreparing(): boolean {
    return this.preparator.IsPreparing;
  }

  override TryCollectItem(): Collected {
    if (this.IsPreparing) return { ok: false, item: null };
    return super.TryCollectItem();
  }

  override TryTransferItem(fromHolder: IItemHolder): boolean {
    return !this.preparator.IsPreparing && super.TryTransferItem(fromHolder);
  }

  /** Q, on the referee. (Not the runtime's click: clicks come in through Clicked and ClickedKnob.) */
  override Interact(): void {
    this.preparator.Interact();
    for (const listener of this.OnInteracted.slice()) listener();
  }

  /** The local player clicked the knife or the knob: Q on this counter. */
  ClickedKnob(_detail?: HostEventDetail): void {
    this.kitchen.LocalIntent("Q", "c:" + this.cell, null);
  }
}
