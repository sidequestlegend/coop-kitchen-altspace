// Upstream: Assets/Scripts/UI/Orders/OrderTicket.cs. One order on the board: the recipe's name, one icon per ingredient,
// and a bar from full to empty over the waiting time; it flashes for its last second when delivered or failed (70, 72).
//
// Upstream instantiates a ticket per order; the board has three fixed ticket slots (C7). Icons are sprite tags.

import { Vector3, type GameObject, type HostActions, type TextRef } from "../portkit/src/index.ts";
import { IngredientIcons } from "./IngredientIcons.ts";
import { OrderStatus, type Order } from "./Order.ts";

export class OrderTicket {
  private readonly host: HostActions;
  private readonly path: string;
  private readonly orderName: TextRef | null;
  private readonly icons: TextRef | null;
  private readonly waitingTimer: GameObject | null;
  private shownId: number | null = null;
  private value = -1;
  private flash = "";

  constructor(host: HostActions, path: string, orderName: TextRef | null, icons: TextRef | null, waitingTimer: GameObject | null) {
    this.host = host;
    this.path = path;
    this.orderName = orderName;
    this.icons = icons;
    this.waitingTimer = waitingTimer;
  }

  /** Shows an order (or nothing), its bar at game time G. */
  Show(order: Order | null, G: number): void {
    if (!order) {
      if (this.shownId !== null || this.value === -1) this.host.setActive(`@${this.path}`, false);
      this.shownId = null;
      this.value = -2;
      return;
    }
    if (this.shownId !== order.rec.id) {
      this.shownId = order.rec.id;
      this.host.setActive(`@${this.path}`, true);
      this.Initialize(order);
    }
    this.WaitingTime = order.rec.wait > 0 ? order.WaitingTimeAt(G) / order.rec.wait : 0;
    const flash = order.rec.st === OrderStatus.Delivered ? "OrderTicket@Delivered" : order.rec.st === OrderStatus.Failed ? "OrderTicket@Failed" : "";
    if (flash !== this.flash) {
      this.flash = flash;
      if (flash) this.host.animPlay(`@${this.path}`, flash);
    }
  }

  private Initialize(order: Order): void {
    if (this.orderName) this.orderName.text = order.Name;
    if (this.icons) this.icons.text = IngredientIcons.Text(order.PlatedIngredients.map((p) => p.Data.Icon));
    this.flash = "";
  }

  /** The bar, 0 to 1 of the order's own waiting time. */
  private set WaitingTime(value: number) {
    const rounded = Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
    if (rounded === this.value) return;
    this.value = rounded;
    if (this.waitingTimer) this.waitingTimer.transform.localScale = new Vector3(Math.max(0.001, rounded), 1, 1);
  }

  get ShownOrder(): number | null {
    return this.shownId;
  }
}
