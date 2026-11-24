// Upstream: Assets/Scripts/Counters/Counter.cs. A plain counter: holds an item with its ItemHolder (checklist 17, 20, 22).
//
// A port counter is a behaviour on its kit object. A click on it is the local chef's E on it (Clicked, bound in
// bindings.json), which goes to the referee as an intent; the rule methods below run on the referee.

import { Behaviour, type GameObject, type HostEventDetail } from "../portkit/src/index.ts";
import { HighlighterContainer } from "./ActionCode.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import { IItemCollectorKind, type Collected, type IItemCollector } from "./IItemCollector.ts";
import { IItemHolderKind, type IItemHolder } from "./IItemHolder.ts";
import { IItemTransferKind } from "./IItemTransfer.ts";
import type { ItemHolder } from "./ItemHolder.ts";
import { ItemHolderStack } from "./ItemHolderStack.ts";
import type { Kitchen } from "./Kitchen.ts";

/**
 * A chef's reach in metres, measured from the nearest of their head and hands to the point clicked (C2). Upstream a chef
 * acts on what a 0.5 m box cast 0.8 m ahead of it hits; here a player's hands are the pointer, so a click on a counter,
 * a knife, a knob, an item or the floor counts within an arm's length and a step: 2 m from the head reaches the far
 * edge of a counter top (0.96 m deep, 0.9 m high) from where one stands at it, and the floor about 1 m ahead.
 */
export const REACH = 2;

export class Counter extends Behaviour implements IItemHolder, IItemCollector {
  /** Clicks on counters (E), knives and knobs (Q) count within a chef's reach (the runtime checks it before Clicked). */
  static override interactReach = REACH;
  // ---- from bindings.json ----
  kitchen!: Kitchen;
  /** The cell's name in the upstream scene (CutCounter_00); also its holder's key. */
  cell = "";
  /** Where items sit (the ItemHolder child's position). */
  top: GameObject | null = null;
  /** Counter_Plate: a plate is under its holder in the prefab (ItemHolder.Awake places it). */
  startsWithPlate = false;
  /** Counter_PlateStack: its holder carries an ItemHolderStack. */
  plateStack = false;

  readonly kinds: readonly string[] = [IItemHolderKind, IItemCollectorKind, IItemTransferKind];
  holder!: ItemHolder;
  protected readonly highlightableContainer = new HighlighterContainer();
  stack: ItemHolderStack | null = null;

  /** `event OnItemCollectedFromTop` forwards to the holder's OnItemReleased. */
  get OnItemCollectedFromTop(): Array<(item: IItemCollectable | null) => void> {
    return this.holder.OnItemReleased;
  }

  get CurrentItem(): IItemCollectable | null {
    return this.holder.CurrentItem;
  }

  get IsEnabled(): boolean {
    return this.kitchen.off[this.cell] !== 1;
  }
  set IsEnabled(value: boolean) {
    if (value) delete this.kitchen.off[this.cell];
    else this.kitchen.off[this.cell] = 1;
  }

  override Start(): void {
    this.holder = this.kitchen.Holder(this.cell);
    this.OnEnable();
  }

  /** Upstream OnEnable: what this component listens to. */
  protected OnEnable(): void {
    this.holder.OnItemPlaced.push((item) => this.HandleItemPlaced(item));
    this.holder.OnItemReleased.push((item) => this.HandleItemReleased(item));
    if (this.plateStack) {
      this.stack = new ItemHolderStack(this.kitchen, this.holder);
      this.stack.Enable(this.kitchen.orders.Asset);
    }
  }

  /** The local player clicked the counter: E on it. */
  Clicked(detail?: HostEventDetail): void {
    this.kitchen.LocalIntent("E", "c:" + this.cell, detail?.point ?? null);
  }

  TryTransferItem(fromHolder: IItemHolder): boolean {
    return this.holder.TryTransferItem(fromHolder);
  }

  TryCollectItem(): Collected {
    return this.holder.TryCollectItem();
  }

  HasPlate(): boolean {
    return this.holder.IsPlate() !== null;
  }

  ReleaseItem(): void {
    this.holder.ReleaseItem();
  }

  private HandleItemReleased(item: IItemCollectable | null): void {
    if (item) this.highlightableContainer.Remove(item.GetHighlightable());
  }

  private HandleItemPlaced(item: IItemCollectable): void {
    this.highlightableContainer.Add(item.GetHighlightable());
  }
}
