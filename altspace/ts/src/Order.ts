// Upstream: Assets/Scripts/Orders/Order.cs. One order: a recipe and a waiting time that runs down to 0 (69, 72); a plate
// that matches it delivers it (61); its tip is ceil(seconds left x the recipe's tip multiplier), in 32-bit floats (74).
//
// The coroutine counting the waiting time down becomes (born, wait) on the game clock, and cancelling it freezes the
// value (`left`). The tip is computed as C# does: `Mathf.CeilToInt(WaitingTime * TipMultiplier)` with both floats; in
// doubles 60 x 0.1 would give a tip of 7 where C# gives 6.
//
// One change, a plain bug fixed (coordinator's decision; checklist 128): upstream leaves a delivered or expired order in
// the list for 1 s, where a second matching plate is paid again (an expired one pays tip 0 + 20) and the ticket code
// then throws on the double removal. Here only an open order can be delivered.

import { invoke } from "./ActionCode.ts";
import type { Ingredient } from "./Ingredient.ts";
import type { OrderSettings } from "./OrderSettings.ts";
import type { PlatedIngredient } from "./PlatedIngredient.ts";
import type { RecipeData } from "./RecipeData.ts";

export const OrderStatus = { Open: 0, Delivered: 1, Failed: 2 } as const;

export interface OrderRec {
  id: number;
  /** Recipe index. */
  r: number;
  /** G at which the countdown started. */
  born: number;
  /** The initial waiting time (s). */
  wait: number;
  /** The waiting time frozen when the countdown was cancelled (delivered, stopped, the tutorial's order), else null. */
  left: number | null;
  st: 0 | 1 | 2;
  /** G at which it was delivered or failed (removed 1 s later). */
  at: number;
}

const f = Math.fround;

export class Order {
  readonly rec: OrderRec;
  private readonly settings: OrderSettings;
  readonly OnFailed: Array<() => void> = [];
  readonly OnDelivered: Array<() => void> = [];

  constructor(settings: OrderSettings, rec: OrderRec) {
    this.settings = settings;
    this.rec = rec;
  }

  get Recipe(): RecipeData {
    return this.settings.recipeSettings.recipes[this.rec.r]!;
  }

  get Name(): string {
    return this.Recipe.Name;
  }

  get PlatedIngredients(): PlatedIngredient[] {
    return this.Recipe.PlatedIngredients;
  }

  /** The waiting time left at game time G (the ticket's bar). */
  WaitingTimeAt(G: number): number {
    if (this.rec.left !== null) return this.rec.left;
    return f(Math.max(0, this.rec.wait - (G - this.rec.born)));
  }

  get WaitingTime(): number {
    return this.WaitingTimeAt(this.settings.G);
  }

  get IsOpen(): boolean {
    return this.rec.st === OrderStatus.Open;
  }

  TryDelivery(ingredients: readonly Ingredient[]): boolean {
    if (!this.IsOpen) return false;
    const canDelivery = this.Recipe.ContainsOnly(ingredients);
    if (canDelivery) this.Delivery();
    return canDelivery;
  }

  StartCountDownWaitingTime(G: number): void {
    this.rec.born = G;
    this.rec.left = null;
  }

  CancelCountDownWaitingTime(): void {
    if (this.rec.left === null) this.rec.left = this.WaitingTime;
  }

  GetTip(): number {
    const tip = f(f(this.WaitingTime) * f(this.Recipe.TipMultiplier));
    return Math.ceil(tip);
  }

  /** The countdown's loop, on the referee's tick: at 0 the order fails. */
  CountDown(G: number): void {
    if (this.rec.left !== null || !this.IsOpen) return;
    if (this.rec.wait - (G - this.rec.born) > 0) return;
    this.rec.left = 0;
    invoke(this.OnFailed);
  }

  private Delivery(): void {
    this.CancelCountDownWaitingTime();
    invoke(this.OnDelivered);
  }
}
