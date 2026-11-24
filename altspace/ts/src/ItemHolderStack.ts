// Upstream: Assets/Scripts/Items/ItemHolderStack.cs. The plate-stack counter's holder: whatever is put on it is stacked
// 0.12 m apart and the top one is given back first (checklist 27); a returned plate appears on it (64).
//
// The stack's order is `stacks[key]` in the kitchen's state (bottom to top); the holder's current item is the top.

import type { IItemCollectable } from "./IItemCollectable.ts";
import type { ItemHolder } from "./ItemHolder.ts";
import type { KitchenItems } from "./Kitchen.ts";
import type { OrderSettings } from "./OrderSettings.ts";
import { Vector3 } from "../portkit/src/index.ts";

export const PLATE_HEIGHT = 0.12;

export class ItemHolderStack {
  private readonly kitchen: KitchenItems;
  private readonly holder: ItemHolder;
  private readonly initialPosition = Vector3.zero;

  constructor(kitchen: KitchenItems, holder: ItemHolder) {
    this.kitchen = kitchen;
    this.holder = holder;
  }

  private get stack(): string[] {
    return (this.kitchen.stacks[this.holder.key] ??= []);
  }

  /** OnEnable. */
  Enable(orders: OrderSettings): void {
    this.holder.OnItemPlaced.push((item) => this.HandleItemPlaced(item));
    this.holder.OnItemReleased.push(() => this.HandleItemReleased());
    orders.OnPlateReturned.push(() => this.HandlePlateReturned());
  }

  private HandleItemPlaced(item: IItemCollectable): void {
    const position = this.initialPosition.add(Vector3.up.scale(this.stack.length * PLATE_HEIGHT));
    item.SetPosition(position);
    this.stack.push(item.id);
  }

  private HandleItemReleased(): void {
    const stack = this.stack;
    stack.pop();
    const nextItem = stack.length ? this.kitchen.Item(stack[stack.length - 1]!) : null;
    if (stack.length === 0) delete this.kitchen.stacks[this.holder.key];
    if (nextItem) this.holder.CurrentItem = nextItem;
  }

  private HandlePlateReturned(): void {
    const plate = this.kitchen.NewPlate();
    if (plate) this.holder.PlaceItem(plate);
  }
}
