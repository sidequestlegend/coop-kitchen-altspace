// Upstream: Assets/Scripts/Physics/CollectableBody.cs. A Rigidbody able to be collected: PickUp parents it to a holder
// and switches its physics off; Drop unparents it and switches physics on, so it falls where it is.
//
// In the port an item is a record in the kitchen's state, not a physics object (PORT.md 8.3, C8). PickUp clears its
// loose position (it is now wherever its holder or plate says); Drop gives it a loose position on the floor: the point
// the chef chose for a drop, or below the holder it left.

import type { ICollectable } from "./ICollectable.ts";
import type { KitchenItems } from "./Kitchen.ts";

export class CollectableBody implements ICollectable {
  private readonly kitchen: KitchenItems;
  private readonly id: string;

  constructor(kitchen: KitchenItems, id: string) {
    this.kitchen = kitchen;
    this.id = id;
  }

  PickUp(_holder: string): void {
    const rec = this.kitchen.items[this.id];
    if (!rec) return;
    delete rec.pos;
    delete rec.lp;
  }

  Drop(): void {
    const rec = this.kitchen.items[this.id];
    if (!rec) return;
    rec.pos = this.kitchen.DropPoint();
    delete rec.lp;
  }
}
