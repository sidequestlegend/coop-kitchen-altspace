// Rung 1: several chefs in the fake room (virtual time), playing through what a player has: clicks on counters, knives,
// knobs, the floor and the board's buttons, and grabs of items.

import assert from "node:assert/strict";
import { test } from "node:test";
import { Vector3 } from "../portkit/src/index.ts";
import type { FakeClient } from "../portkit/src/platform/fake.ts";
import type { TestWorld } from "../portkit/src/testing.ts";
import data from "../data/kitchen-data.json" with { type: "json" };
import type { DeliveryCounterCanvas } from "../src/DeliveryCounterCanvas.ts";
import type { CountDown } from "../src/CountDown.ts";
import type { PreparationWorldSpaceCanvas } from "../src/PreparationWorldSpaceCanvas.ts";
import type { Stove } from "../src/Stove.ts";
import { CRATE, E, Q, SLUG, STEP, V, click, cook, fetch, held, kitchen, newWorld, on, play, settle, shown } from "./helpers.ts";

/** The prepared variants of a recipe, and where each is prepared. */
function recipeParts(r: number): number[] {
  return data.recipes[r]!.plated.map((p) => p.variant);
}
const APPLIANCE: Record<number, [string, string]> = {
  [V.MeatCooked]: ["StoveCounter_00", "StoveCounter_01"],
  [V.CheeseSliced]: ["CutCounter_00", "CutCounter_01"],
  [V.CabbageSliced]: ["CutCounter_00", "CutCounter_01"],
  [V.TomatoSliced]: ["CutCounter_00", "CutCounter_01"],
};

/** The chefs make one order's recipe on the plate standing on `at`, sharing the work, and `runner` delivers it. */
async function makeAndDeliver(world: TestWorld, chefs: FakeClient[], r: number, at: string, runner: FakeClient, inst = "0"): Promise<void> {
  const parts = recipeParts(r);
  for (let i = 0; i < parts.length; i++) {
    const chef = chefs[i % chefs.length]!;
    const variant = parts[i]!;
    const appliance = APPLIANCE[variant]?.[chefs.indexOf(chef) % 2] ?? null;
    await fetch(world, chef, variant, appliance, inst);
    await E(world, chef, at, inst);
    assert.equal(held(world, chef, inst), null, `${chef.name} put ${variant} on the plate`);
  }
  assert.deepEqual(on(world, runner, at, inst)?.ings.slice().sort(), parts.slice().sort());
  await E(world, runner, at, inst);
  await E(world, runner, "Counter_Delivery", inst);
}

test("three chefs cook and deliver three orders; everyone agrees on the score", async () => {
  const world = newWorld(21);
  const [ann, bob, cat] = ["Ann", "Bob", "Cat"].map((name) => world.join({ name, elements: [{ seed: "7", round: "300" }] })) as [FakeClient, FakeClient, FakeClient];
  await settle(world);
  await cook(world, bob);
  await cook(world, cat);
  await play(world, ann);
  const k = kitchen(world, cat);
  assert.deepEqual(Object.keys(k.roster).length, 3, "three chefs");
  const plates = ["Counter_Plate_01", "Counter_Plate_00", "Counter_PlateStack"];
  for (let n = 0; n < 3; n++) {
    // a plate onto the plating counter
    await E(world, ann, plates[n]!);
    assert.equal(held(world, ann)?.k, V.Plate, `plate ${n}`);
    await E(world, ann, "Counter_Normal_05");
    const open = k.orders.orders.list.filter((o) => o.st === 0);
    assert.ok(open.length > 0, "an open order");
    const before = k.score.Asset.SuccessfulDeliveries;
    await makeAndDeliver(world, [bob, cat, ann], open[0]!.r, "Counter_Normal_05", ann);
    assert.equal(k.score.Asset.SuccessfulDeliveries, before + 1, `order ${n} delivered`);
    if (n === 1) await world.run(4000); // the returned plates are on the stack by the third
  }
  const s = kitchen(world, ann).score.Asset;
  const canvas = world.behaviour<DeliveryCounterCanvas>(bob, "deliveryCanvas");
  const tips = canvas.shown.filter((t) => t.endsWith("Tip!")).map((t) => Number(t.slice(1, 3)));
  assert.equal(tips.length, 3);
  assert.equal(s.Tips, tips.reduce((a, b) => a + b, 0));
  assert.equal(s.Score, s.Tips + 3 * 20);
  for (const c of [ann, bob, cat]) assert.equal(c.graph(SLUG).text.get("scoreText"), String(s.Score), `${c.name} sees the score`);
  assert.ok(world.agree(), "every client holds the same state");
  assert.deepEqual(world.problems(), []);
});

test("cutting: 3 s of game time, paused by Q and resumed, the bar stays; Cannot Cut on an empty board", async () => {
  const world = newWorld(22);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await play(world, ann);
  const k = kitchen(world, ann);
  const board = k.preparators.get("CutCounter_00")!;
  await Q(world, ann, "CutCounter_00");
  assert.equal(world.behaviour<PreparationWorldSpaceCanvas>(bob, "pc_CutCounter_00").rejectedShown, 1, "Bob sees Cannot Cut");
  await E(world, ann, "CheeseCounter_00");
  await E(world, ann, "CutCounter_00");
  assert.equal(shown(bob, "@Counters/CutCounter_00/CuttingBoard/Knife/Model"), false, "the knife hides under the cheese");
  await click(world, ann, "q_CutCounter_00", "0", 1000);
  assert.ok(board.IsPreparing);
  await click(world, ann, "q_CutCounter_00", "0", 2000); // pause after about 1 s of cutting
  assert.ok(board.IsPaused && board.IsPreparing);
  const frozen = board.ProgressAt(k.match.G);
  await world.run(5000);
  assert.equal(board.ProgressAt(k.match.G), frozen, "progress does not move while paused");
  assert.equal(on(world, bob, "CutCounter_00")?.k, V.Cheese, "still whole");
  assert.equal(world.behaviour<PreparationWorldSpaceCanvas>(bob, "pc_CutCounter_00").BarVisible, true, "the bar stays while paused");
  await E(world, ann, "CutCounter_00");
  assert.equal(held(world, ann), null, "nothing is taken from a board that is preparing");
  await Q(world, ann, "CutCounter_00");
  await world.run(3000);
  assert.equal(on(world, bob, "CutCounter_00")?.k, V.CheeseSliced, "sliced");
  assert.equal(board.IsPreparing, false);
  assert.ok(frozen > 0.5 && frozen < 2, `cut ${frozen} s before the pause`);
  assert.ok(world.agree());
});

test("the stove: cooking, the burn sequence, Q cancels it, taking the meat off stops it, else it burns at 7 s", async () => {
  const world = newWorld(23);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await play(world, ann);
  const k = kitchen(world, bob);
  const stove = k.preparators.get("StoveCounter_00") as Stove;
  const g = () => k.match.G;
  // cook and leave it
  await E(world, ann, "MeatCounter_00");
  await E(world, ann, "StoveCounter_00");
  await click(world, ann, "q_StoveCounter_00", "0", 0);
  const startAt = g();
  await world.room.runUntil(() => on(world, bob, "StoveCounter_00")?.k === V.MeatCooked, 10000);
  const cookedAt = g();
  assert.ok(cookedAt - startAt > 5.5 && cookedAt - startAt < 7, `cooked after ${cookedAt - startAt} s`);
  assert.ok(stove.IsBurning, "the burn sequence runs");
  const burnFrom = stove.st.burn!;
  await world.room.runUntil(() => on(world, bob, "StoveCounter_00")?.k === V.MeatBurned, 10000);
  assert.ok(Math.abs(g() - burnFrom - 7) < 0.25, `burned ${g() - burnFrom} s after cooking ended`);
  assert.equal(stove.IsBurning, false);
  assert.equal(stove.st.smoke, 1, "smoke");
  assert.equal(stove.st.anim, "Stove@Idle");
  // Bob heard the eight warning beeps
  const beeps = bob.graph(SLUG).events.filter((e) => e.op === "audio" && e.args[0] === "7" && e.target === "c_StoveCounter_00").length;
  assert.equal(beeps, 8, "eight warning beeps");
  // Q on burned meat: Cannot Cook; take it to the trash; smoke stops
  await Q(world, ann, "StoveCounter_00");
  assert.equal(world.behaviour<PreparationWorldSpaceCanvas>(bob, "pc_StoveCounter_00").rejectedShown, 1);
  await E(world, ann, "StoveCounter_00");
  assert.equal(held(world, ann)?.k, V.MeatBurned);
  assert.equal(stove.st.smoke, 0, "smoke stops when the burned meat is removed");
  await E(world, ann, "TrashCounter");
  assert.equal(held(world, ann), null);
  // cook again and cancel the burn with Q: it never burns
  await E(world, ann, "MeatCounter_00");
  await E(world, ann, "StoveCounter_00");
  await Q(world, ann, "StoveCounter_00");
  await world.room.runUntil(() => stove.IsBurning, 10000);
  await Q(world, ann, "StoveCounter_00");
  assert.equal(stove.IsBurning, false);
  await world.run(10000);
  assert.equal(on(world, bob, "StoveCounter_00")?.k, V.MeatCooked, "cancelled: stays cooked");
  // and once more: taking it off during the sequence stops it
  await E(world, ann, "StoveCounter_00");
  await E(world, ann, "Counter_Normal_05");
  await E(world, ann, "MeatCounter_00");
  await E(world, ann, "StoveCounter_00");
  await Q(world, ann, "StoveCounter_00");
  await world.room.runUntil(() => stove.IsBurning, 10000);
  await world.run(3000);
  await E(world, ann, "StoveCounter_00");
  assert.equal(held(world, ann)?.k, V.MeatCooked, "taken off cooked");
  assert.equal(stove.IsBurning, false);
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("plating rules: only plateable variants, one bread, never from a busy board; trash scrapes the last; empty plate stays; Need Plate; Wrong Plate", async () => {
  const world = newWorld(24);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await play(world, ann);
  await cook(world, bob);
  const k = kitchen(world, bob);
  const P = "Counter_Plate_01";
  // a raw meat is refused by the plate on the counter, and stays in hand (22, 30)
  await E(world, ann, "MeatCounter_00");
  await E(world, ann, P);
  assert.equal(held(world, ann)?.k, V.Meat, "a raw meat is not plated");
  await E(world, ann, "TrashCounter");
  // bread, then a second bread is refused (31)
  await E(world, ann, "BreadCounter_00");
  await E(world, ann, P);
  await E(world, ann, "BreadCounter_00");
  await E(world, ann, P);
  assert.equal(held(world, ann)?.k, V.Bread, "a second bread is refused");
  assert.deepEqual(on(world, bob, P)?.ings, [V.Bread]);
  // a holding plate takes an ingredient off a counter (34); not from a board that is cutting (32)
  await E(world, ann, "Counter_Normal_05"); // put the bread down
  await E(world, bob, "TomatoCounter_00");
  await E(world, bob, "CutCounter_00");
  await click(world, bob, "q_CutCounter_00", "0", 500);
  await E(world, ann, P); // take the plate
  assert.equal(held(world, ann)?.k, V.Plate);
  await E(world, ann, "CutCounter_00");
  assert.deepEqual(held(world, ann)?.ings, [V.Bread], "nothing from a board that is preparing");
  await world.run(4000);
  await E(world, ann, "CutCounter_00");
  assert.deepEqual(held(world, ann)?.ings, [V.Bread, V.TomatoSliced], "the sliced tomato onto the held plate");
  // the plate's ingredients are laid out as the first recipe that contains all of them (Salad Burger's)
  const tomato = k.items[k.items[held(world, ann)!.id]!.ings![1]!]!;
  assert.deepEqual(tomato.lp, [0.146, 0.369, 0.117, 0]);
  // trash: the last ingredient only, one per press (57); the bread flag is sticky (127)
  await E(world, ann, "TrashCounter");
  assert.deepEqual(held(world, ann)?.ings, [V.Bread]);
  await E(world, ann, "TrashCounter");
  assert.deepEqual(held(world, ann)?.ings, []);
  await E(world, ann, "TrashCounter");
  assert.equal(held(world, ann)?.k, V.Plate, "an empty plate cannot be thrown away (58)");
  await E(world, ann, "Counter_Normal_05"); // the plate on a counter holding bread: nothing (22)
  assert.equal(held(world, ann)?.k, V.Plate);
  await E(world, ann, "Counter_Normal_01");
  await E(world, ann, "Counter_Normal_05");
  await E(world, ann, "Counter_Normal_01");
  assert.deepEqual(on(world, bob, "Counter_Normal_01")?.ings, [], "a plate that has held bread refuses bread for ever");
  assert.equal(held(world, ann)?.k, V.Bread);
  // Need Plate (59): the bread stays in hand; Wrong Plate (63): the empty plate is taken and counted
  await E(world, ann, "Counter_Delivery");
  assert.equal(held(world, ann)?.k, V.Bread);
  await E(world, ann, "TrashCounter");
  await E(world, ann, "Counter_Normal_01");
  await E(world, ann, "Counter_Delivery");
  assert.equal(held(world, ann), null);
  const canvas = world.behaviour<DeliveryCounterCanvas>(bob, "deliveryCanvas");
  assert.deepEqual(canvas.shown, ["Need Plate!", "Wrong Plate!"]);
  assert.equal(k.score.Asset.FailedDeliveries, 1);
  assert.equal(k.score.Asset.Score, 0, "never below 0");
  // 4 s later a clean plate is on the stack (64)
  await world.run(4500);
  assert.equal(on(world, bob, "Counter_PlateStack")?.k, V.Plate);
  // drop on the floor and pick up again by grabbing it (23, 24)
  await E(world, ann, "Counter_PlateStack");
  await click(world, ann, "floor", "0", STEP, new Vector3(1, 0, -2));
  const loose = Object.keys(k.items).find((id) => k.items[id]!.pos && k.WhereIs(id) === "loose");
  assert.ok(loose, "a loose plate on the floor");
  assert.deepEqual(k.items[loose!]!.pos, [1, 0, -2]);
  const slot = kitchen(world, bob).SlotOf(loose!);
  assert.ok(bob.grab(SLUG, "0", "s" + String(slot).padStart(2, "0")), "Bob grabs the plate");
  await world.run(STEP);
  assert.equal(held(world, bob)?.id, loose);
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("an order expires: it flashes for a second and is removed, at no cost; orders keep coming 15 s apart, at most 3", async () => {
  const world = newWorld(25);
  const ann = world.join({ name: "Ann", elements: [{ round: "600", seed: "3" }] });
  await settle(world);
  await play(world, ann);
  const k = kitchen(world, ann);
  const first = k.orders.orders.list[0]!;
  const created = first.born;
  await world.run(14000);
  assert.equal(k.orders.orders.list.length, 1);
  await world.run(2000);
  assert.equal(k.orders.orders.list.length, 2, "the second order 15 s after the first");
  await world.run(15000);
  assert.equal(k.orders.orders.list.length, 3, "the third");
  await world.run(20000);
  assert.equal(k.orders.orders.list.length, 3, "never more than 3");
  await world.room.runUntil(() => first.st === 2, 200000);
  assert.ok(Math.abs(k.match.G - created - first.wait) < 0.2, "failed when its waiting time ran out");
  assert.equal(k.score.Asset.Score, 0);
  assert.equal(k.score.Asset.FailedDeliveries, 0, "an expired order costs nothing (130)");
  const failedAt = k.match.G;
  await world.room.runUntil(() => !k.orders.orders.list.some((o) => o.id === first.id), 5000);
  assert.ok(Math.abs(k.match.G - failedAt - 1) < 0.2, "removed 1 s later");
  assert.equal(k.orders.orders.next.s, "wait", "room again: the next order is 15 s away");
  assert.deepEqual(world.problems(), []);
});

test("pause and resume: the kitchen's clock stops for everyone; only the pauser or the referee resumes", async () => {
  const world = newWorld(26);
  const ref = world.join({ name: "Ref", elements: [{ round: "300" }] });
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  const k = kitchen(world, bob);
  await E(world, ann, "MeatCounter_00");
  await E(world, ann, "StoveCounter_00");
  await Q(world, ann, "StoveCounter_00");
  const stove = k.preparators.get("StoveCounter_00")!;
  const order = () => k.orders.Asset.Orders[0]!;
  await click(world, bob, "btnPause");
  assert.ok(k.match.Paused, "Bob paused");
  assert.equal(shown(ann, "pausePanel") ?? kitchen(world, ann).match.Paused, true, "Ann sees the pause panel");
  const g0 = k.match.G;
  const left0 = order().WaitingTime;
  const cook0 = stove.ProgressAt(g0);
  const nextAt = k.orders.orders.next.at;
  await world.run(30000);
  assert.equal(k.match.G, g0, "game time stands still");
  assert.equal(order().WaitingTime, left0);
  assert.equal(stove.ProgressAt(k.match.G), cook0);
  await E(world, ann, "BreadCounter_00");
  assert.equal(held(world, ann), null, "no E while paused");
  await click(world, ann, "btnResume");
  assert.ok(k.match.Paused, "Ann did not pause, is not the referee: she cannot resume");
  await click(world, ref, "btnResume");
  assert.ok(!k.match.Paused, "the referee resumes");
  assert.ok(Math.abs(k.match.G - g0 - 1) < 0.3, `game time carries on from the pause (+${k.match.G - g0})`);
  assert.equal(k.orders.orders.next.at, nextAt, "deadlines keep their game times: everything moved by the pause");
  await world.room.runUntil(() => on(world, bob, "StoveCounter_00")?.k === V.MeatCooked, 10000);
  // the pauser resumes too; restart is offered while paused
  await click(world, bob, "btnPause");
  await click(world, bob, "btnResume");
  assert.ok(!k.match.Paused, "the pauser resumes");
  await click(world, bob, "btnPause");
  await click(world, bob, "btnRestart", "0", 300);
  await click(world, bob, "btnYes");
  assert.equal(k.match.Phase, "countdown", "restarted");
  assert.equal(on(world, bob, "StoveCounter_00"), null, "a fresh kitchen");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("the referee leaves mid-round: the next one carries the clock, the stove, the orders and the plate returns on", async () => {
  const world = newWorld(27);
  const ref = world.join({ name: "Ref", elements: [{ round: "300" }] });
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  assert.ok(world.instance(ref).networking.IsReferee);
  await cook(world, bob);
  await play(world, ann);
  const k = kitchen(world, ann);
  await E(world, ann, "MeatCounter_00");
  await E(world, ann, "StoveCounter_00");
  await click(world, ann, "q_StoveCounter_00", "0", 0);
  await world.room.runUntil(() => kitchen(world, ann).preparators.get("StoveCounter_00")!.IsPreparing, 3000);
  const cookFrom = k.prep["StoveCounter_00"]!.since!;
  // a wrong plate, so a plate return is pending
  await E(world, bob, "Counter_Plate_00");
  await E(world, bob, "Counter_Delivery");
  const plateDue = k.orders.orders.plates[0]!;
  const nextOrderAt = k.orders.orders.next.at;
  let returnedAt = -1;
  for (const c of [ann, bob]) kitchen(world, c).orders.Asset.OnPlateReturned.push(() => (returnedAt = kitchen(world, c).match.G));
  world.leave(ref);
  await world.room.runUntil(() => world.instance(ann).networking.IsReferee || world.instance(bob).networking.IsReferee, 15000);
  const electedAt = k.match.G;
  const boss = world.instance(ann).networking.IsReferee ? ann : bob;
  await world.room.runUntil(() => on(world, ann, "StoveCounter_00")?.k === V.MeatCooked, 15000);
  const cookedAt = k.match.G;
  assert.ok(cookedAt - cookFrom >= 6 && cookedAt - cookFrom < 6.5, `cooked at ${cookedAt - cookFrom} s of game time`);
  await world.room.runUntil(() => on(world, boss, "Counter_PlateStack") !== null, 10000);
  // due during the gap with no referee: it comes with the new referee's first tick; due after: on time
  assert.ok(returnedAt >= plateDue - 0.05 && returnedAt - Math.max(plateDue, electedAt) < 0.3, `the plate came back at ${returnedAt}, due ${plateDue}, referee from ${electedAt}`);
  await world.room.runUntil(() => k.orders.orders.list.length >= 2, 20000);
  assert.ok(Math.abs(k.orders.orders.list[1]!.born - nextOrderAt) < 0.3, "the next order came on time");
  // game time on both clients matches the server clock since the round started
  const kb = kitchen(world, bob);
  assert.ok(Math.abs(kb.match.G - k.match.G) < 0.05);
  await world.run(1500);
  assert.ok(world.agree(), world.digests().join(" "));
  assert.deepEqual(world.problems(), []);
});

test("a chef who leaves holding a plate drops it where they were, and their place is free", async () => {
  const world = newWorld(28);
  const ann = world.join({ name: "Ann", elements: [{ round: "300", chefs: "2" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300", chefs: "2" }] });
  const cat = world.join({ name: "Cat", elements: [{ round: "300", chefs: "2" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  await cook(world, cat);
  const k = kitchen(world, ann);
  assert.equal(k.roster[cat.uid], undefined, "the kitchen is full at two chefs");
  await E(world, cat, "BreadCounter_00");
  assert.equal(held(world, cat), null, "a watcher's E is ignored");
  await E(world, bob, "Counter_Plate_00");
  await E(world, bob, "Counter_Normal_05");
  await E(world, bob, "BreadCounter_00");
  await E(world, bob, "Counter_Normal_05");
  await E(world, bob, "Counter_Normal_05");
  const plate = held(world, bob)!;
  assert.deepEqual(plate.ings, [V.Bread]);
  world.leave(bob);
  await world.run(6000);
  assert.equal(k.roster[bob.uid], undefined, "Bob is no longer a chef");
  assert.equal(k.WhereIs(plate.id), "loose", "the plate is on the floor");
  assert.deepEqual(k.items[plate.id]!.ings!.length, 1, "with its bread");
  await cook(world, cat);
  assert.notEqual(k.roster[cat.uid], undefined, "Cat takes the free place");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("a late joiner sees the kitchen as it is, agrees, hears nothing that already happened, and can cook", async () => {
  const world = newWorld(29);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  await settle(world);
  await play(world, ann);
  await E(world, ann, "CheeseCounter_00");
  await E(world, ann, "CutCounter_00");
  await E(world, ann, "Counter_Plate_00");
  await E(world, ann, "Counter_Normal_05");
  await world.run(20000);
  const dan = world.join({ name: "Dan", elements: [{ round: "300" }] });
  await settle(world);
  const k = kitchen(world, dan);
  assert.equal(k.match.Phase, "round");
  assert.equal(on(world, dan, "CutCounter_00")?.k, V.Cheese);
  assert.equal(on(world, dan, "Counter_Normal_05")?.k, V.Plate);
  assert.equal(k.orders.orders.list.length, kitchen(world, ann).orders.orders.list.length);
  assert.ok(Math.abs(k.match.G - kitchen(world, ann).match.G) < 0.06, "the same game time, within a tick");
  assert.deepEqual(world.behaviour<CountDown>(dan, "countDown").played, [], "no countdown replayed");
  assert.ok(world.agree());
  await cook(world, dan);
  await Q(world, dan, "CutCounter_00");
  await world.run(3500);
  assert.equal(on(world, ann, "CutCounter_00")?.k, V.CheeseSliced, "Dan cut Ann's cheese");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("two kitchens in one room stay separate", async () => {
  const world = newWorld(30);
  const both = [{ room: "north", round: "300" }, { room: "south", round: "300" }];
  const ann = world.join({ name: "Ann", elements: both });
  const bob = world.join({ name: "Bob", elements: both });
  await settle(world, "north");
  await settle(world, "south");
  await play(world, ann, "north");
  await E(world, ann, "BreadCounter_00", "north");
  await E(world, ann, "Counter_Normal_05", "north");
  assert.equal(kitchen(world, bob, "south").match.Phase, "lobby", "the south kitchen is still in its lobby");
  assert.equal(on(world, bob, "Counter_Normal_05", "south"), null);
  await play(world, bob, "south");
  await E(world, bob, "MeatCounter_00", "south");
  assert.equal(held(world, bob, "south")?.k, V.Meat);
  assert.equal(held(world, bob, "north"), null);
  assert.equal(on(world, ann, "Counter_Normal_05", "north")?.k, V.Bread);
  assert.notEqual(kitchen(world, ann, "north").roster[bob.uid] !== undefined, true, "Bob does not cook in the north");
  const keys = world.room.stateKeys("pk1.coop-kitchen.");
  assert.ok(keys.some((x) => x.startsWith("pk1.coop-kitchen.north.")) && keys.some((x) => x.startsWith("pk1.coop-kitchen.south.")));
  assert.ok(keys.every((x) => x.startsWith("pk1.coop-kitchen.north.") || x.startsWith("pk1.coop-kitchen.south.")));
  assert.ok(world.agree("north") && world.agree("south"));
  assert.deepEqual(world.problems(), []);
});

test("time up: the last 20 s run preparations 1.25 times faster; then Times Up!, frozen kitchen, results, high score, lobby", async () => {
  const world = newWorld(31);
  const ann = world.join({ name: "Ann", device: "annsPhone", elements: [{ round: "30" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "30" }] });
  await settle(world);
  await play(world, ann);
  const k = kitchen(world, ann);
  const rs = k.match.match.rs!;
  // a tomato (4 s) started 1 s before the final seconds: 1 s plain, then 3 s at 1.25 = 2.4 s
  await E(world, ann, "TomatoCounter_00");
  await E(world, ann, "CutCounter_00");
  await world.room.runUntil(() => k.match.G >= rs + 9 - 0.6, 20000);
  await click(world, ann, "q_CutCounter_00", "0", 0);
  await world.room.runUntil(() => k.preparators.get("CutCounter_00")!.IsPreparing, 3000);
  const from = k.prep["CutCounter_00"]!.since!;
  await world.room.runUntil(() => on(world, ann, "CutCounter_00")?.k === V.TomatoSliced, 10000);
  const took = k.match.G - from;
  const expected = rs + 10 - from + (4 - (rs + 10 - from)) / 1.25;
  assert.ok(Math.abs(took - expected) < 0.1, `cut in ${took} s, expected ${expected}`);
  // a delivery for the score: the first order is still open
  await E(world, ann, "Counter_Plate_00");
  await E(world, ann, "CutCounter_00");
  const recipe = k.orders.Asset.Orders[0]!;
  await E(world, ann, "Counter_Delivery");
  await world.room.runUntil(() => k.match.Phase === "timesup", 30000);
  await E(world, ann, "BreadCounter_00");
  assert.equal(held(world, ann), null, "no E after time is up");
  await world.room.runUntil(() => k.match.Phase === "results", 5000);
  const res = k.match.match.res!;
  assert.equal(res.bad, recipe.rec.r >= 0 ? k.score.Asset.FailedDeliveries : 0);
  assert.equal(ann.graph(SLUG).text.get("resTotal"), String(res.score));
  assert.equal(ann.graph(SLUG).text.get("resFailed"), `Failed Orders x ${String(res.bad).padStart(2, "0")}`);
  await click(world, ann, "btnContinue");
  assert.equal(k.match.Phase, "lobby");
  assert.equal(on(world, bob, "Counter_Plate_00")?.k, V.Plate, "the start state again");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("the tutorial, two chefs sharing the steps: gated counters, the X Burger, results with 32", async () => {
  const world = newWorld(32);
  const ann = world.join({ name: "Ann" });
  const bob = world.join({ name: "Bob" });
  await settle(world);
  await cook(world, bob);
  await click(world, ann, "btnTutorial");
  const k = kitchen(world, bob);
  const tut = k.tutorial!;
  await world.room.runUntil(() => tut.tut.i === 0, 10000);
  assert.equal(k.orders.orders.list.length, 1, "the X Burger order");
  assert.equal(k.orders.orders.list[0]!.r, 2);
  // a wrong action: the bread crate is off
  await E(world, ann, "BreadCounter_00");
  assert.equal(held(world, ann), null, "a switched-off crate is ignored");
  await world.room.runUntil(() => tut.tut.sub === "meat.collect", 15000);
  await E(world, ann, CRATE[V.Meat]!);
  await world.room.runUntil(() => k.off["StoveCounter_00"] === undefined, 5000);
  await E(world, ann, "StoveCounter_00");
  await world.run(1500);
  await Q(world, bob, "StoveCounter_00");
  await world.room.runUntil(() => tut.tut.sub === "cheese.collect", 15000);
  await E(world, bob, CRATE[V.Cheese]!);
  await world.room.runUntil(() => k.off["CutCounter_00"] === undefined, 5000);
  await E(world, bob, "CutCounter_00");
  await world.run(1500);
  await Q(world, ann, "CutCounter_00");
  await world.room.runUntil(() => tut.tut.sub === "plate.bread", 15000);
  assert.equal(on(world, ann, "StoveCounter_00")?.k, V.MeatCooked, "the stove cannot burn in the tutorial");
  await world.run(9000);
  assert.equal(on(world, ann, "StoveCounter_00")?.k, V.MeatCooked, "still cooked");
  await E(world, bob, CRATE[V.Bread]!);
  await world.room.runUntil(() => k.off["Counter_Plate_00"] === undefined, 5000);
  await E(world, bob, "Counter_Plate_00");
  await world.room.runUntil(() => tut.tut.sub === "plate.get", 5000);
  await E(world, ann, "Counter_Plate_00");
  await world.room.runUntil(() => tut.tut.sub === "plate.rest", 5000);
  await E(world, ann, "StoveCounter_00");
  await E(world, ann, "CutCounter_00");
  await world.room.runUntil(() => tut.tut.sub === "plate.deliver", 5000);
  await E(world, ann, "Counter_Delivery");
  await world.room.runUntil(() => k.match.Phase === "results", 10000);
  assert.equal(k.match.match.res!.score, 32, "20 + a tip of 12: the order never ran down");
  assert.equal(k.match.match.best, 0, "the tutorial is not the kitchen's best");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("only the listed methods can be called from another client: a forged command to reset the kitchen is refused", async () => {
  const world = newWorld(33);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const eve = world.join({ name: "Eve", elements: [{ round: "300" }] });
  await settle(world);
  await play(world, ann);
  await E(world, ann, "BreadCounter_00");
  kitchen(world, eve).match.SendCommand("ResetToLobby");
  kitchen(world, eve).SendCommand("ResetKitchen");
  await world.run(3000);
  assert.equal(kitchen(world, ann).match.Phase, "round");
  assert.equal(held(world, ann)?.k, V.Bread, "nothing was reset");
  assert.ok(world.agree());
});
