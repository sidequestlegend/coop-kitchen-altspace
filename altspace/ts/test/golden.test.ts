// Rung 1, the translation against the upstream: vectors/upstream.json is written by golden/Harness.cs from
// KitchenChaos's own C#, compiled unchanged with dotnet 8 (`npm run golden`). The same inputs go through the TypeScript
// here. Rules (V1-V7) must match exactly; timelines (V9) event by event, within the upstream's own frame drift: every
// chained WaitForSeconds of upstream ends on the first frame past it (at the 0.05 s frames of the harness: up to 0.05 s
// per wait), where the port's deadlines are exact (PORT.md checklist 131). The one deliberate difference, a delivered
// or expired order that is paid again within its last second (128), is asserted as such.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { RulesBench } from "../portkit/src/testing.ts";
import game from "../src/index.ts";
import type { AbstractItem } from "../src/AbstractItem.ts";
import { Ingredient } from "../src/Ingredient.ts";
import { IngredientSettings } from "../src/IngredientSettings.ts";
import { ItemHolder } from "../src/ItemHolder.ts";
import type { ItemRec, Kitchen, KitchenItems } from "../src/Kitchen.ts";
import { Order, type OrderRec } from "../src/Order.ts";
import { OrderSettings, type OrdersRec } from "../src/OrderSettings.ts";
import { Plate } from "../src/Plate.ts";
import { RandomUtils } from "../src/RandomUtils.ts";
import { RecipeSettings } from "../src/RecipeSettings.ts";
import { ScoreSettings, type ScoreState } from "../src/ScoreSettings.ts";
import type { Stove } from "../src/Stove.ts";
import type { PreparationCounter } from "../src/PreparationCounter.ts";
import { bindings } from "./helpers.ts";

const vectors = JSON.parse(readFileSync(fileURLToPath(new URL("../vectors/upstream.json", import.meta.url)), "utf8"));
const num = (s: string) => Number(s);

/** The kitchen's item state with nothing else: enough for plates, holders and ingredients. */
class MiniKitchen implements KitchenItems {
  items: Record<string, ItemRec> = {};
  holders: Record<string, string> = {};
  stacks: Record<string, string[]> = {};
  readonly ingredientSettings = new IngredientSettings();
  readonly recipeSettings: RecipeSettings;
  readonly plateEvents = [];
  private next = 1;
  private readonly views = new Map<string, AbstractItem>();
  constructor() {
    this.ingredientSettings.InitializeDictionary();
    for (const v of this.ingredientSettings.variants) v.spawner = (d) => this.New(d.Index) as Ingredient;
    this.recipeSettings = new RecipeSettings(this.ingredientSettings);
    this.recipeSettings.Initialize();
  }
  New(k: number): AbstractItem {
    const id = "i" + this.next++;
    this.items[id] = { k, pos: [0, 0, 0] };
    return this.Item(id)!;
  }
  Item(id: string): AbstractItem | null {
    const rec = this.items[id];
    if (!rec) return null;
    let v = this.views.get(id);
    if (!v) this.views.set(id, (v = rec.k < 0 ? new Plate(this, id) : new Ingredient(this, id)));
    return v;
  }
  NewPlate(): Plate {
    return this.New(-1) as Plate;
  }
  DestroyItem(id: string): void {
    delete this.items[id];
  }
  Releasing(): void {}
  DropPoint(): number[] {
    return [0, 0, 0];
  }
}

test("V1 weighted pick: 1,012 rolls give upstream's recipe, in 32-bit floats", () => {
  const k = new MiniKitchen();
  for (const [roll, index] of vectors.weighted) assert.equal(RandomUtils.WeightedIndex(k.recipeSettings.recipes, num(roll)), index, `roll ${roll}`);
});

test("V2 waiting times 60, 127, 93, 130, 160 (cooked meat adds 0 s: checklist 123, kept)", () => {
  const k = new MiniKitchen();
  assert.deepEqual(k.recipeSettings.recipes.map((r) => String(r.GetWaitingTime(k.ingredientSettings, 30))), vectors.waiting);
});

test("V3 tips: ceil(seconds left x multiplier) in 32-bit floats, at every value either side of each integer", () => {
  const k = new MiniKitchen();
  const state: OrdersRec = { list: [], seq: 0, next: { s: "off", at: 0 }, plates: [], seed: 1, n: 0 };
  const settings = new OrderSettings(k.recipeSettings, k.ingredientSettings, () => state, () => 0, () => 1);
  let checked = 0;
  for (const [r, left, tip] of vectors.tips) {
    const rec: OrderRec = { id: 1, r, born: 0, wait: num(left), left: num(left), st: 0, at: 0 };
    assert.equal(new Order(settings, rec).GetTip(), tip, `recipe ${r} with ${left} s left`);
    checked++;
  }
  assert.ok(checked > 400);
});

test("V4 and V5: which variants a plate takes; every sequence of up to five plateable ingredients against the recipes", () => {
  const k = new MiniKitchen();
  assert.deepEqual(k.ingredientSettings.variants.map((v) => k.recipeSettings.CanPlate(v)), vectors.canPlate);
  const pool = new Map<number, Ingredient>();
  for (const v of [0, 2, 4, 6, 9]) pool.set(v, k.New(v) as Ingredient);
  assert.equal(vectors.matching.length, 3905);
  for (const [seq, mask, layout] of vectors.matching) {
    const ings = (seq as string).split(",").map((v) => pool.get(Number(v))!);
    let ours = 0;
    k.recipeSettings.recipes.forEach((r, i) => {
      if (r.ContainsOnly(ings)) ours |= 1 << i;
    });
    assert.equal(ours, mask, `matches for ${seq}`);
    assert.equal(k.recipeSettings.GetClosestRecipe(ings)?.Index ?? -1, layout, `layout for ${seq}`);
  }
});

test("V6 plates: 200 random sequences of offers and scrapes (one bread, sticky bread flag, repeats allowed)", () => {
  for (const steps of vectors.plates) {
    const k = new MiniKitchen();
    const plate = k.NewPlate();
    let n = 0;
    for (const step of steps) {
      if (step[0] === "scrape") {
        const removed = plate.RemoveLast();
        assert.equal(removed.Data.Index, step[1]);
      } else {
        const holder = new ItemHolder(k, "from" + n++);
        holder.PlaceItem(k.New(step[1]));
        assert.equal(plate.TryTransferItem(holder), step[2], `offer ${step[1]}`);
        assert.equal(holder.HasItem(), step[5]);
      }
      const contents = plate.IngredientList.map((i) => i.Data.Index).join(",");
      assert.equal(contents, step[step[0] === "scrape" ? 2 : 3]);
      assert.equal(k.items[plate.id]!.bread === 1, step[step[0] === "scrape" ? 3 : 4]);
    }
  }
});

test("V7 score: 100 random sequences of deliveries and wrong plates (never below 0, the deltas)", () => {
  for (const v of vectors.score) {
    const state: ScoreState = { tips: 0, failed: 0, ok: 0, score: 0 };
    const s = new ScoreSettings(() => state);
    const deltas: string[] = [];
    s.OnScoreIncreased.push((d) => deltas.push("+" + d));
    s.OnScoreDecreased.push((d) => deltas.push("-" + d));
    s.Initialize();
    for (const op of v.ops) {
      if (op < 0) s.DeliveryFailedOrder();
      else s.DeliveryOrder(op);
    }
    assert.deepEqual([s.Tips, s.FailedDeliveries, s.SuccessfulDeliveries, String(s.Score)], [v.tips, v.failed, v.ok, v.score]);
    assert.deepEqual(deltas, v.deltas);
  }
});

/** Parses "<what> <time> [variant]" lines. */
function events(log: string[]): Array<{ what: string; t: number; v?: number }> {
  return log.map((line) => {
    const [what, t, v] = line.split(" ");
    return { what: what!, t: Number(t), v: v === undefined ? undefined : Number(v) };
  });
}

test("V9 preparations: cutting and cooking with pauses and the x1.25 booster, the burn sequence and its warnings", () => {
  for (const tl of vectors.timelines) {
    const bench = new RulesBench(game, bindings).start();
    const kitchen = bench.behaviour<Kitchen>("kitchen");
    const match = kitchen.match;
    kitchen.ResetKitchen();
    match.settings.SetRoundLength(num(tl.limit));
    Object.assign(match.match, { phase: "round", mode: "game", rs: 0, clock: { e: 0, f: null } });
    const cell = tl.stove ? "StoveCounter_00" : "CutCounter_00";
    const preparator = kitchen.preparators.get(cell)!;
    const counter = bench.behaviour<PreparationCounter>("ct_" + cell);
    const log: string[] = [];
    preparator.OnPreparationStarted.push(() => log.push(`started ${bench.time}`));
    preparator.OnPreparationCompleted.push(() => log.push(`completed ${bench.time} ${(kitchen.Holder(cell).CurrentItem as Ingredient).Data.Index}`));
    preparator.OnIngredientRejected.push(() => log.push(`rejected ${bench.time}`));
    kitchen.Holder(cell).OnItemPlaced.push((item) => log.push(`placed ${bench.time} ${(item as Ingredient).Data.Index}`));
    kitchen.Holder(cell).PlaceItem(kitchen.ingredientSettings.variants[tl.variant]!.Spawn()!);
    const actions = (tl.actions as Array<[string, string]>).map(([at, what]) => ({ at: num(at), what }));
    const warnings: number[] = [];
    let beeps = 0;
    let next = 0;
    for (let i = 0; bench.time < num(tl.until) - 1e-4; i++) {
      bench.time = Math.round(i * 5) / 100;
      while (next < actions.length && bench.time >= actions[next]!.at - 1e-4) {
        const a = actions[next++]!;
        if (a.what === "Q") counter.Interact();
        else if (a.what === "take") counter.ReleaseItem();
        log.push(`${a.what} ${bench.time}`);
      }
      preparator.Tick(bench.time);
      if (tl.stove) {
        const now = (preparator as Stove).AnimationAt(bench.time).beeps;
        if (now > beeps) warnings.push(bench.time);
        beeps = (preparator as Stove).st.burn === null ? 0 : now;
      }
    }
    const theirs = events(tl.log);
    const ours = events(log);
    assert.deepEqual(ours.map((e) => [e.what, e.v]), theirs.map((e) => [e.what, e.v]), `${tl.name}: the same events`);
    // a burn passes 18 chained waits upstream (each may end up to one frame late); a preparation, none
    ours.forEach((e, i) => {
      const drift = theirs[i]!.what === "placed" && theirs[i]!.v === 7 ? 18 * 0.05 : 0.06;
      assert.ok(Math.abs(e.t - theirs[i]!.t) <= drift + 1e-6, `${tl.name}: ${e.what} at ${e.t}, upstream ${theirs[i]!.t}`);
    });
    const end = kitchen.Holder(cell).CurrentItem;
    assert.equal(end ? (end as Ingredient).Data.Index : -2, tl.end, `${tl.name}: what is left`);
    assert.equal(tl.stove ? (preparator as Stove).IsBurning : false, tl.burning);
    assert.equal(warnings.length, tl.warnings.length, `${tl.name}: warning beeps`);
    // beep i comes after 2i + 1 chained waits upstream
    warnings.forEach((w, i) => assert.ok(Math.abs(w - num(tl.warnings[i])) <= 0.05 * (2 * i + 2) + 1e-6, `${tl.name}: beep ${i} at ${w}, upstream ${tl.warnings[i]}`));
  }
});

test("V9 orders: cadence, cap, expiry, removal, plate returns, tips; and the fix of 128 (an order is paid once)", () => {
  for (const [index, scenario] of vectors.orders.entries()) {
    const k = new MiniKitchen();
    const state: OrdersRec = { list: [], seq: 0, next: { s: "off", at: 0 }, plates: [], seed: 1, n: 0 };
    let G = 0;
    const settings = new OrderSettings(k.recipeSettings, k.ingredientSettings, () => state, () => G, () => 1);
    const rolls = (scenario.rolls as string[]).map(num);
    settings.rollOverride = (n) => rolls[Math.min(n, rolls.length - 1)]!;
    settings.Initialize();
    const log: string[] = [];
    settings.OnOrderCreated.push((o) => log.push(`created ${G} ${o.rec.id} ${o.rec.r} ${o.rec.wait}`));
    settings.OnOrderFailed.push((o) => log.push(`failed ${G} ${o.rec.id}`));
    settings.OnOrderDelivered.push((o) => log.push(`delivered ${G} ${o.rec.id}`));
    settings.OnOrderRemoved.push((o) => log.push(`removed ${G} ${o.rec.id}`));
    settings.OnPlateReturned.push(() => log.push(`plate ${G}`));
    settings.StartOrdering();
    const deliveries = (scenario.deliveries as Array<[string, number]>).map(([at, r]) => ({ at: num(at), r }));
    let next = 0;
    for (let i = 0; G < num(scenario.until) - 1e-4; i++) {
      G = Math.round(i * 5) / 100;
      while (next < deliveries.length && G >= deliveries[next]!.at - 1e-4) {
        const d = deliveries[next++]!;
        const ings = k.recipeSettings.recipes[d.r]!.PlatedIngredients.map((p) => k.New(p.Data.Index) as Ingredient);
        const result = settings.TryDelivery(ings);
        log.push(`try ${G} ${d.r} ${result.delivered ? "True" : "False"} ${result.tip}`);
      }
      settings.Tick(G);
    }
    const theirs = (scenario.log as string[]).map((l) => l.split(" "));
    const ours = log.map((l) => l.split(" "));
    if (index === 0) {
      // no deliveries: event for event, with the upstream's drift (each order waits WaitUntil + WaitForSeconds)
      assert.deepEqual(ours.map((e) => [e[0], e[2], e[3]]), theirs.map((e) => [e[0], e[2], e[3]]));
      ours.forEach((e, i) => assert.ok(Math.abs(Number(e[1]) - Number(theirs[i]![1])) <= 0.06 * (1 + Number(e[2] ?? 1)), `${e.join(" ")} against ${theirs[i]!.join(" ")}`));
      for (const e of ours.filter((x) => x[0] === "created")) assert.equal(e[4], theirs.find((t) => t[0] === "created" && t[2] === e[2])![4], "waiting time");
      continue;
    }
    // with deliveries: the whole log, event for event, against the upstream's log with the one deliberate difference
    // (128: an order in its last second is not delivered again) applied to it as written below. Kinds, order ids,
    // recipes, waiting times and delivered-or-not must be equal; times within the upstream's drift; a tip may differ
    // by 1 where the seconds left times the multiplier lands on a whole number: upstream's waiting time is 0.05 s
    // subtracted 400 times in 32-bit floats (39.99999 or 40.00001 where the port has exactly 40); V3 checks the formula
    // itself exactly. Events in the last second before the scenario's end are left out (a deadline on the boundary).
    const until = num(scenario.until);
    const near = (r: string[], what: string, t: number) => r[0] === what && Math.abs(Number(r[1]) - t) < 0.2;
    let expected = theirs;
    if (index === 1) {
      // upstream pays order 1 again at 20.5 (it is being removed) and removes it twice; the port takes that plate as a
      // wrong plate (a plate still comes back for it) and removes order 1 once
      assert.ok(theirs.some((r) => near(r, "delivered", 20.5)) && theirs.some((r) => near(r, "removed", 21.5)), "upstream's double payment is in the vectors");
      expected = theirs
        .filter((r) => !near(r, "delivered", 20.5) && !near(r, "removed", 21.5))
        .map((r) => (near(r, "try", 20.5) ? ["try", r[1]!, r[2]!, "False", "0"] : r));
    } else if (index === 2) {
      // upstream pays order 2 again at 30.3; the port delivers order 3 (open since 30.1) there. Order 3 is then gone at
      // 61.5, where the port delivers order 4; and with one order fewer listed from 31.3 on, the port's sixth order
      // comes 15 s after the fifth (75), where upstream's waits for room first (62.55 + 15).
      const cut = theirs.findIndex((r) => near(r, "delivered", 30.35));
      assert.equal(theirs[cut]![2], "2", "upstream pays order 2 twice");
      expected = [
        ...theirs.slice(0, cut),
        ["delivered", "30.3", "3"], ["try", "30.3", "0", "True", "6"],
        ["removed", "31", "2"], ["removed", "31.3", "3"], ["plate", "34"], ["plate", "34.3"],
        ["created", "45", "4", "0", "60"], ["created", "60", "5", "0", "60"],
        ["delivered", "61.5", "4"], ["try", "61.5", "0", "True", "5"], ["removed", "62.5", "4"], ["plate", "65.5"],
        ["created", "75", "6", "0", "60"],
      ];
    }
    const inWindow = (rows: string[][]) => rows.filter((r) => Number(r[1]) < until - 1);
    const a = inWindow(ours);
    const b = inWindow(expected);
    const shape = (r: string[]) => (r[0] === "try" ? [r[0], r[2], r[3]] : r[0] === "created" ? [r[0], r[2], r[3], r[4]] : [r[0], r[2]]);
    assert.deepEqual(a.map(shape), b.map(shape), `scenario ${index}: the same events in the same order`);
    a.forEach((r, i) => {
      const id = Number(r[0] === "try" || r[0] === "plate" ? 1 : r[2]);
      assert.ok(Math.abs(Number(r[1]) - Number(b[i]![1])) <= 0.06 * (1 + id) + 1e-6, `scenario ${index}: ${r.join(" ")} against ${b[i]!.join(" ")}`);
      if (r[0] === "try") assert.ok(Math.abs(Number(r[4]) - Number(b[i]![4])) <= 1, `scenario ${index}: tip ${r[4]} against ${b[i]![4]}`);
    });
    assert.equal(ours.filter((e) => e[0] === "plate").length, theirs.filter((e) => e[0] === "plate").length, "a plate back for every plate handed in");
  }
});
