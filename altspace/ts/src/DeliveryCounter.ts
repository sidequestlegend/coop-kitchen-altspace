// Upstream: Assets/Scripts/Counters/DeliveryCounter.cs. Something that is not a plate: "Need Plate!" and it stays in the
// hands (59). A plate, even empty: it leaves the hands and is destroyed with everything on it (60); the first order it
// matches is delivered with a tip (61, 62), otherwise "Wrong Plate!" and a wrong plate counted (63). Either way a clean
// plate comes back to the plate stack 4 s later (64).

import { Behaviour, type GameObject, type HostEventDetail } from "../portkit/src/index.ts";
import type { DeliveryCounterCanvas } from "./DeliveryCounterCanvas.ts";
import type { IItemHolder } from "./IItemHolder.ts";
import { IItemTransferKind, type IItemTransfer } from "./IItemTransfer.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { Plate } from "./Plate.ts";

export class DeliveryCounter extends Behaviour implements IItemTransfer {
  kitchen!: Kitchen;
  cell = "";
  top: GameObject | null = null;
  canvas!: DeliveryCounterCanvas;

  readonly kinds: readonly string[] = [IItemTransferKind];

  get IsEnabled(): boolean {
    return this.kitchen.off[this.cell] !== 1;
  }
  set IsEnabled(value: boolean) {
    if (value) delete this.kitchen.off[this.cell];
    else this.kitchen.off[this.cell] = 1;
  }

  /** The local player clicked the delivery counter: E on it. */
  Clicked(detail?: HostEventDetail): void {
    this.kitchen.LocalIntent("E", "c:" + this.cell, detail?.point ?? null);
  }

  TryTransferItem(fromHolder: IItemHolder): boolean {
    const item = fromHolder.CurrentItem as (IItemHolder["CurrentItem"] & { kind?: string }) | null;
    const plate = item && item.kind === "plate" ? (item as unknown as Plate) : null;

    if (plate === null) {
      this.canvas.ShowNeedPlate();
      return false;
    }

    fromHolder.ReleaseItem();
    const ingredients = plate.IngredientsToArray();
    const delivery = this.kitchen.orders.Asset.TryDelivery(ingredients);

    this.kitchen.DestroyItem(plate.id);

    if (delivery.delivered) {
      this.canvas.ShowTip(delivery.tip);
      this.kitchen.score.Asset.DeliveryOrder(delivery.tip);
      return true;
    }

    this.canvas.ShowWrongPlate();
    this.kitchen.score.Asset.DeliveryFailedOrder();
    return false;
  }
}
