// Upstream: Assets/Scripts/UI/Orders/OrderTicketGroup.cs. The row of tickets: a ticket per listed order, a sound for a
// new order (SFX_object_pickup01, 71) and a random success sound for a delivered one (62). Its "removed" sound is
// never played upstream (OrderTicketGroup.cs:59 is never called), so not here either.
//
// The tickets are drawn from the orders' state on every client; the sounds are effects sent by the referee.

import { Behaviour, type GameObject, type TextRef } from "../portkit/src/index.ts";
import type { Kitchen } from "./Kitchen.ts";
import { OrderTicket } from "./OrderTicket.ts";

export class OrderTicketGroup extends Behaviour {
  kitchen!: Kitchen;
  /** The kit object the sounds come from (the board). */
  board = "";
  ticketPaths: string[] = [];
  names: Array<TextRef | null> = [];
  icons: Array<TextRef | null> = [];
  bars: Array<GameObject | null> = [];
  private tickets: OrderTicket[] = [];
  /** Sounds this client played (for tests). */
  readonly played: string[] = [];

  override Start(): void {
    this.tickets = this.ticketPaths.map((path, i) => new OrderTicket(this.Host, path, this.names[i] ?? null, this.icons[i] ?? null, this.bars[i] ?? null));
    this.OnEnable();
  }

  private OnEnable(): void {
    const settings = this.kitchen.orders.Asset;
    settings.OnOrderCreated.push(() => this.kitchen.Fx("orders", "created"));
    settings.OnOrderDelivered.push(() => this.kitchen.Fx("orders", "delivered"));
    this.kitchen.OnEffect("orders", (kind) => (kind === "created" ? this.PlayCreatedSound() : this.PlayDeliveredSound()));
  }

  override Update(): void {
    const G = this.kitchen.match.KitchenG;
    const orders = this.kitchen.match.Phase === "lobby" ? [] : this.kitchen.orders.Asset.Orders;
    this.tickets.forEach((ticket, i) => ticket.Show(orders[i] ?? null, G));
  }

  private PlayCreatedSound(): void {
    this.played.push("created");
    this.kitchen.PlaySound("newOrder", this.board);
  }

  private PlayDeliveredSound(): void {
    this.played.push("delivered");
    this.kitchen.PlaySound("success", this.board);
  }
}
