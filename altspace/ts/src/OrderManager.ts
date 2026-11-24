// Upstream: Assets/Scripts/Orders/OrderManager.cs. Starts ordering when the countdown ends (unless it is the tutorial's,
// whose StartOrderingAfterCountDown is off) and stops it when time is up. Here it is also the orders' synced home.

import { Behaviour } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";
import { OrderSettings, type OrdersRec } from "./OrderSettings.ts";

export class OrderManager extends Behaviour {
  static override synced = ["orders"];
  orders: OrdersRec = { list: [], seq: 0, next: { s: "off", at: 0 }, plates: [], seed: 1, n: 0 };

  kitchen!: Kitchen;
  Asset!: OrderSettings;

  /** Off in the tutorial (OrderManager_Tutorial.prefab). */
  get StartOrderingAfterCountDown(): boolean {
    return this.kitchen.match.match.mode === "game";
  }

  override Start(): void {
    const k = this.kitchen;
    this.Asset = new OrderSettings(
      k.recipeSettings,
      k.ingredientSettings,
      () => this.orders,
      () => k.match.G,
      () => {
        const fixed = Math.floor(Number(this.Settings.get("seed") ?? ""));
        return fixed > 0 ? fixed : this.Random.RangeInt(1, 0x7fffffff);
      },
    );
    this.OnEnable();
  }

  private OnEnable(): void {
    const match = this.kitchen.match.settings;
    match.CountDown.OnFinished.push(() => this.HandleCountDownFinished());
    match.TimeLimit.OnFinished.push(() => this.HandleTimeLimitFinished());
  }

  private HandleCountDownFinished(): void {
    if (this.StartOrderingAfterCountDown) this.Asset.StartOrdering();
  }

  private HandleTimeLimitFinished(): void {
    this.Asset.StopOrdering();
  }
}
