// Upstream: Assets/Scripts/Items/AbstractItem.cs. An item able to be highlighted and collected.
//
// The port's item is a view over its record in the kitchen's state (`items[id]`): the referee changes the record, every
// client draws it with a pooled kit object. A view holds no state of its own, so a new referee builds the same views
// from the same records.

import { NoHighlight, type IHighlightable } from "./ActionCode.ts";
import { CollectableBody } from "./CollectableBody.ts";
import type { ICollectable } from "./ICollectable.ts";
import { IItemCollectableKind, type IItemCollectable } from "./IItemCollectable.ts";
import type { ItemRec, KitchenItems } from "./Kitchen.ts";
import type { Vector3 } from "../portkit/src/index.ts";

export abstract class AbstractItem implements IItemCollectable {
  readonly id: string;
  protected readonly kitchen: KitchenItems;
  private readonly collectibleBody: CollectableBody;
  abstract readonly kind: "ingredient" | "plate";
  readonly kinds: readonly string[] = [IItemCollectableKind];

  constructor(kitchen: KitchenItems, id: string) {
    this.kitchen = kitchen;
    this.id = id;
    this.collectibleBody = new CollectableBody(kitchen, id);
  }

  protected get rec(): ItemRec {
    const rec = this.kitchen.items[this.id];
    if (!rec) throw new Error(`item ${this.id} is gone`);
    return rec;
  }

  get Exists(): boolean {
    return this.kitchen.items[this.id] !== undefined;
  }

  get IsEnabled(): boolean {
    return this.kitchen.items[this.id]?.off !== 1;
  }
  set IsEnabled(value: boolean) {
    const rec = this.kitchen.items[this.id];
    if (!rec) return;
    if (value) delete rec.off;
    else rec.off = 1;
  }

  GetCollectible(): ICollectable {
    return this.collectibleBody;
  }

  GetHighlightable(): IHighlightable {
    return NoHighlight;
  }

  /** Upstream moves the transform (the plate stack's height); the port draws stack heights from the stack's order. */
  SetPosition(_position: Vector3): void {}

  Destroy(): void {
    this.kitchen.DestroyItem(this.id);
  }

  toString(): string {
    return `${this.kind}:${this.id}`;
  }
}
