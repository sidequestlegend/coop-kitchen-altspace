// Upstream: Assets/Scripts/Orders/OrderSettings.cs. The orders of a round: the first one when the countdown ends (66);
// then wait until fewer than 3 are listed, 15 s more, the next (67); a weighted random recipe (68); delivered or
// expired orders stay listed 1 s (and count towards the 3); every plate handed in brings a clean plate back 4 s later
// (64); at time up no more orders and the bars stop (73).
//
// Its three coroutines become state in OrderManager's leaf: `next` is the ordering loop as two states ("room": wait
// until there is room; "wait": the 15 s, until `at`), each order carries its own times, `plates` lists the return times.
// The recipe roll comes from a seeded generator whose seed and draw count are in the same leaf, so a new referee rolls
// what the old one would have.

import data from "../data/kitchen-data.json" with { type: "json" };
import { invoke } from "./ActionCode.ts";
import { roundTime } from "./GameClock.ts";
import type { Ingredient } from "./Ingredient.ts";
import type { IngredientSettings } from "./IngredientSettings.ts";
import { Order, OrderStatus, type OrderRec } from "./Order.ts";
import type { RecipeData } from "./RecipeData.ts";
import type { RecipeSettings } from "./RecipeSettings.ts";

export interface OrdersRec {
  list: OrderRec[];
  seq: number;
  next: { s: "off" | "room" | "wait"; at: number };
  plates: number[];
  seed: number;
  n: number;
}

/** A stateless 32-bit generator: draw n of a seed, in [0, 1). */
export function RollOf(seed: number, n: number): number {
  let t = (seed + Math.imul(n + 1, 0x6d2b79f5)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export class OrderSettings {
  readonly maxOrders = data.order.maxOrders;
  readonly additionalTimePerIngredient = data.order.additionalTimePerIngredient;
  readonly timeByNewOrder = data.order.timeByNewOrder;
  readonly timeToRemoveAfterFail = data.order.timeToRemoveAfterFail;
  readonly timeToRemoveAfterDelivery = data.order.timeToRemoveAfterDelivery;
  readonly timeToReturnPlate = data.order.timeToReturnPlate;

  readonly OnPlateReturned: Array<() => void> = [];
  readonly OnOrderFailed: Array<(order: Order) => void> = [];
  readonly OnOrderCreated: Array<(order: Order) => void> = [];
  readonly OnOrderRemoved: Array<(order: Order) => void> = [];
  readonly OnOrderDelivered: Array<(order: Order) => void> = [];

  readonly recipeSettings: RecipeSettings;
  readonly ingredientSettings: IngredientSettings;
  private readonly state: () => OrdersRec;
  private readonly clock: () => number;
  private readonly newSeed: () => number;
  private readonly views = new Map<number, Order>();
  /** Tests: the roll for draw n instead of the seeded generator (upstream's Random.value, set by the golden harness). */
  rollOverride: ((n: number) => number) | null = null;

  constructor(recipes: RecipeSettings, ingredients: IngredientSettings, state: () => OrdersRec, clock: () => number, newSeed: () => number) {
    this.recipeSettings = recipes;
    this.ingredientSettings = ingredients;
    this.state = state;
    this.clock = clock;
    this.newSeed = newSeed;
  }

  get G(): number {
    return this.clock();
  }

  get TotalOrders(): number {
    return this.state().list.length;
  }

  /** The listed orders, oldest first. */
  get Orders(): Order[] {
    const list = this.state().list;
    for (const id of [...this.views.keys()]) if (!list.some((r) => r.id === id)) this.views.delete(id);
    return list.map((rec) => this.View(rec));
  }

  private View(rec: OrderRec): Order {
    let order = this.views.get(rec.id);
    if (!order || order.rec !== rec) {
      order = new Order(this, rec);
      const o = order;
      order.OnFailed.push(() => this.Fail(o));
      order.OnDelivered.push(() => this.Delivery(o));
      this.views.set(rec.id, order);
    }
    return order;
  }

  /** A new round: the old orders' countdowns are cancelled and the list starts empty. */
  Initialize(): void {
    const s = this.state();
    if (s.list.length) this.CancelAll();
    s.list = [];
    s.next = { s: "off", at: 0 };
    s.plates = [];
    s.seed = this.newSeed();
    s.n = 0;
    this.views.clear();
  }

  TryDelivery(ingredients: readonly Ingredient[]): { delivered: boolean; tip: number } {
    this.state().plates.push(roundTime(this.G + this.timeToReturnPlate));
    for (const order of this.Orders) {
      if (order.TryDelivery(ingredients)) return { delivered: true, tip: order.GetTip() };
    }
    return { delivered: false, tip: 0 };
  }

  StartOrdering(): void {
    this.CreateRandom();
    this.state().next = { s: "room", at: 0 };
    this.Tick(this.G);
  }

  StopOrdering(): void {
    this.state().next = { s: "off", at: 0 };
    this.CancelAll();
  }

  Create(recipe: RecipeData): Order {
    const s = this.state();
    const waitingTime = recipe.GetWaitingTime(this.ingredientSettings, this.additionalTimePerIngredient);
    const rec: OrderRec = { id: ++s.seq, r: recipe.Index, born: 0, wait: waitingTime, left: null, st: OrderStatus.Open, at: 0 };
    const order = this.View(rec);
    order.StartCountDownWaitingTime(roundTime(this.G));
    s.list.push(rec);
    invoke(this.OnOrderCreated, order);
    return order;
  }

  private CreateRandom(): void {
    const s = this.state();
    const n = s.n++;
    const roll = this.rollOverride ? this.rollOverride(n) : RollOf(s.seed, n);
    this.Create(this.recipeSettings.GetRandom(roll));
  }

  private Remove(order: Order): void {
    const s = this.state();
    const at = s.list.indexOf(order.rec);
    if (at < 0) return; // removing twice is a no-op (C12)
    s.list.splice(at, 1);
    this.views.delete(order.rec.id);
    invoke(this.OnOrderRemoved, order);
  }

  private Fail(order: Order): void {
    order.rec.st = OrderStatus.Failed;
    order.rec.at = roundTime(this.G);
    invoke(this.OnOrderFailed, order);
  }

  private Delivery(order: Order): void {
    order.rec.st = OrderStatus.Delivered;
    order.rec.at = roundTime(this.G);
    invoke(this.OnOrderDelivered, order);
  }

  private CancelAll(): void {
    for (const order of this.Orders) order.CancelCountDownWaitingTime();
  }

  private CanCreateNewOrders(): boolean {
    return this.TotalOrders < this.maxOrders;
  }

  /** The coroutines, on the referee's tick. */
  Tick(G: number): void {
    const s = this.state();
    for (const order of this.Orders) order.CountDown(G);
    for (const order of this.Orders) {
      if (order.rec.st === OrderStatus.Open) continue;
      const linger = order.rec.st === OrderStatus.Delivered ? this.timeToRemoveAfterDelivery : this.timeToRemoveAfterFail;
      if (G >= order.rec.at + linger) this.Remove(order);
    }
    while (s.plates.length && s.plates[0]! <= G) {
      s.plates.shift();
      invoke(this.OnPlateReturned);
    }
    // OrderingRoutine: create, wait until there is room, wait 15 s, create...
    if (s.next.s === "room" && this.CanCreateNewOrders()) s.next = { s: "wait", at: roundTime(G + this.timeByNewOrder) };
    if (s.next.s === "wait" && G >= s.next.at) {
      this.CreateRandom();
      s.next = { s: "room", at: 0 };
      if (this.CanCreateNewOrders()) s.next = { s: "wait", at: roundTime(G + this.timeByNewOrder) };
    }
  }
}
