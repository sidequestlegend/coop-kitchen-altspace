// Rung 1: the findings of the independent review (REVIEW-FINDINGS.md, coop-kitchen), one test or more each. Every test
// here failed on the code before its fix (noted per test), except where a finding was a missing test (PORT.md 9.2).

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { NetworkEventTarget, Vector3 } from "../portkit/src/index.ts";
import type { FakeClient } from "../portkit/src/platform/fake.ts";
import type { TestWorld } from "../portkit/src/testing.ts";
import type { GameDataManager } from "../src/GameDataManager.ts";
import { POOL_SIZE, type Kitchen } from "../src/Kitchen.ts";
import { CREDITS } from "../src/MainMenu.ts";
import type { Results } from "../src/Results.ts";
import { CRATE, E, Q, SLUG, STEP, V, click, cook, fetch, held, kitchen, newWorld, on, play, settle, text } from "./helpers.ts";

const file = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const slotKey = (slot: number) => "s" + String(slot).padStart(2, "0");

/** A plate on Counter_Normal_05 with an X Burger on it (bread, cheese slice, cooked meat), delivered by `c`. */
async function deliverXBurger(world: TestWorld, c: FakeClient): Promise<void> {
  await E(world, c, "Counter_Plate_00");
  await E(world, c, "Counter_Normal_05");
  await fetch(world, c, V.Bread, null);
  await E(world, c, "Counter_Normal_05");
  await fetch(world, c, V.CheeseSliced, "CutCounter_00");
  await E(world, c, "Counter_Normal_05");
  await fetch(world, c, V.MeatCooked, "StoveCounter_00");
  await E(world, c, "Counter_Normal_05");
  await E(world, c, "Counter_Normal_05");
  await E(world, c, "Counter_Delivery");
}

// ---- 1, 8, 9: names, credits, licences -------------------------------------------------------------------------

test("credits and notices: the MIT attribution as decided, every licensed file named, no upstream title or course-art credit (findings 1, 8, 9)", async () => {
  // the attribution the MIT licence needs, in the decided words; the credits name everything the kit uses
  assert.ok(CREDITS.includes("Based on code by <color=yellow>Hyago Oliveira</color>, github.com/HyagoOliveira/KitchenChaos (MIT)"), CREDITS);
  for (const needed of ["Copyright (c) 2023 Hyago Oliveira", "KayKit Restaurant Bits", "Kay Lousberg", "Kenney", "Liberation Sans", "Red Hat", "Not affiliated", "portkit"]) {
    assert.ok(CREDITS.includes(needed), `the credits name ${needed}`);
  }
  // the kit shows the same text as the script (before: the builder's own fuller text, which the script overwrote)
  const contract = JSON.parse(file("../../Assets/Kit/Editor/kit-contract.json"));
  assert.equal(contract.credits, CREDITS, "the kit builder takes its credits from the contract, which carries the script's");
  const builder = file("../../Assets/Kit/Editor/CoopKitchenKitBuilder.cs");
  const notices = file("../../Assets/Kit/THIRD-PARTY-NOTICES.md");
  const header = file("../script-header.txt");
  for (const [name, shipped] of [["credits", CREDITS], ["builder", builder], ["notices in the kit", notices], ["script banner", header]] as const) {
    assert.ok(!/code ?monkey/i.test(shipped), `${name}: no course-art credit`);
    assert.ok(!/<b>\s*KitchenChaos/i.test(shipped) && !/\*\*KitchenChaos\*\*/.test(shipped), `${name}: no bold upstream title`);
  }
  assert.ok(builder.includes("Based on code by Hyago Oliveira, github.com/HyagoOliveira/KitchenChaos (MIT)"), "the manifest's description uses the decided words");
  // the root copy of the notices is the kit's
  assert.equal(file("../../THIRD-PARTY-NOTICES.md"), notices);
  // every licence text the notices name is in the kit, and the font's copyright lines are named
  for (const named of notices.match(/Licenses\/[A-Za-z0-9.-]+\.txt/g) ?? []) {
    assert.ok(existsSync(fileURLToPath(new URL("../../Assets/Kit/" + named, import.meta.url))), `${named} is in Assets/Kit`);
  }
  assert.ok(notices.includes("Licenses/KitchenChaos-LICENSE.txt") && notices.includes("Licenses/portkit-LICENSE.txt"));
  assert.ok(file("../../Assets/Kit/Licenses/KitchenChaos-LICENSE.txt").includes("Copyright (c) 2023 Hyago Oliveira"));
  assert.ok(notices.includes("Copyright (c) 2012 Red Hat, Inc.") && notices.includes("Digitized data copyright (c) 2010 Google Corporation"));
  // the built script carries the upstream's MIT notice (copyright line and permission notice) in its banner
  assert.ok(header.includes("Copyright (c) 2023 Hyago Oliveira") && header.includes("Permission is hereby granted") && header.includes("THE SOFTWARE IS PROVIDED"));
  // and the board shows the script's text
  const world = newWorld(40);
  const ann = world.join({ name: "Ann" });
  await settle(world);
  assert.equal(text(ann, "creditsText"), CREDITS);
});

// ---- 2: reach --------------------------------------------------------------------------------------------------

test("a chef reaches what is within 2 m of their head or hands, not across the room (finding 2)", async () => {
  // before the fix: no reach, so a chef 20 m away took a cheese
  const world = newWorld(42);
  const ann = world.join({ name: "Ann", elements: [{ round: "300", input: "click" }] }); // pool slots clickable
  await settle(world);
  await play(world, ann);
  ann.pose(new Vector3(20, 1.6, 0)); // the kit's objects stand at the origin in the fake room
  await E(world, ann, CRATE[V.Cheese]!);
  assert.equal(held(world, ann), null, "a crate 20 m away is out of reach");
  await click(world, ann, "floor", "0", STEP, new Vector3(0, 0, 0));
  await Q(world, ann, "CutCounter_00");
  assert.equal(kitchen(world, ann).prep["CutCounter_00"]!.p, 0, "a knife out of reach");
  ann.pose(new Vector3(0.6, 1.6, 0.4));
  await E(world, ann, CRATE[V.Cheese]!);
  assert.equal(held(world, ann)?.k, V.Cheese, "within reach it counts");
  // the floor and the pool slots check the same reach
  ann.pose(new Vector3(20, 1.6, 0));
  await click(world, ann, "floor", "0", STEP, new Vector3(1, 0, 1));
  assert.equal(held(world, ann)?.k, V.Cheese, "a floor click out of reach drops nothing");
  ann.pose(new Vector3(1, 1.6, 1));
  await click(world, ann, "floor", "0", STEP, new Vector3(1, 0, 1));
  assert.equal(held(world, ann), null, "dropped where clicked, within reach");
  const k = kitchen(world, ann);
  const cheese = Object.keys(k.items).find((id) => k.items[id]!.k === V.Cheese)!;
  ann.pose(new Vector3(20, 1.6, 0));
  await click(world, ann, slotKey(k.SlotOf(cheese)), "0", STEP, new Vector3(1, 0, 1));
  assert.equal(held(world, ann), null, "a loose item out of reach");
  ann.pose(new Vector3(1, 1.6, 1));
  await click(world, ann, slotKey(k.SlotOf(cheese)), "0", STEP, new Vector3(1, 0, 1));
  assert.equal(held(world, ann)?.id, cheese, "picked up within reach");
  assert.deepEqual(world.problems(), []);
});

// ---- 3: high scores in later sessions ----------------------------------------------------------------------------

test("a round in a later session is still compared with the saved high score (finding 3)", async () => {
  // before the fix: the device had "round 1" checked from the first session, and the new room's round 1 was skipped
  const world = newWorld(43);
  const me = { uid: "u-ann", name: "Ann", device: "annsPhone" };
  let ann = world.join({ ...me, elements: [{ round: "30", seed: "1" }] });
  await settle(world);
  await play(world, ann);
  await world.room.runUntil(() => kitchen(world, ann).match.Phase === "results", 60000);
  await world.run(500);
  const first = world.behaviour<GameDataManager>(ann, "gameData").settings.Data;
  assert.equal(first.HighScore, 0);
  assert.equal(first.Checked.length, 1, "the first session's round is checked");
  const firstRound = kitchen(world, ann).match.match.round;
  world.leave(ann);
  await world.run(5000);
  ann = world.join({ ...me, elements: [{ round: "90", seed: "1" }] });
  await settle(world);
  await play(world, ann);
  assert.equal(kitchen(world, ann).match.match.round, firstRound, "a fresh room numbers its rounds from 1 again");
  await deliverXBurger(world, ann);
  const scored = kitchen(world, ann).score.Asset.Score;
  assert.ok(scored > 0, "a delivery");
  await world.room.runUntil(() => kitchen(world, ann).match.Phase === "results", 120000);
  await world.run(500);
  assert.equal(world.behaviour<Results>(ann, "results").isNewHighScore, true, "New High Score!");
  const second = world.behaviour<GameDataManager>(ann, "gameData").settings.Data;
  assert.equal(second.HighScore, scored, "saved on the device");
  assert.equal(second.Checked.length, 2);
  assert.deepEqual(world.problems(), []);
});

// ---- 4: a departing chef's item ------------------------------------------------------------------------------------

test("a chef who leaves holding something drops it below where they were last seen, not at the world's origin (finding 4)", async () => {
  // before the fix: the Chef went with its player, so nobody knew where they were, and the plate landed at (0, 0, 0)
  const world = newWorld(44);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  bob.pose(new Vector3(1, 1.2, -0.8));
  await E(world, bob, "Counter_Plate_00");
  const plate = held(world, bob)!;
  assert.equal(plate.k, V.Plate);
  await world.run(2000);
  world.leave(bob);
  await world.run(6000);
  const k = kitchen(world, ann);
  assert.equal(k.WhereIs(plate.id), "loose");
  assert.deepEqual(k.items[plate.id]!.pos, [1, 0, -0.8], "on the floor below Bob's last position");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

// ---- 5 and 10: drops land on the floor, inside the kitchen -------------------------------------------------------

test("a VR release in the air drops the item to the floor below the hand (finding 5)", async () => {
  // before the fix: the plate stayed at hand height (y 1.2), floating
  const world = newWorld(45);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  await settle(world);
  await play(world, ann);
  const k = kitchen(world, ann);
  const plate = on(world, ann, "Counter_Plate_00")!.id;
  const key = slotKey(k.SlotOf(plate));
  assert.ok(ann.grab(SLUG, "0", key), "Ann grabs the plate");
  await world.run(STEP);
  assert.equal(held(world, ann)?.id, plate);
  ann.move(SLUG, "0", key, new Vector3(1, 1.2, -2));
  await world.run(200);
  ann.drop(SLUG, "0", key);
  await world.run(STEP);
  assert.equal(k.WhereIs(plate), "loose");
  assert.deepEqual(k.items[plate]!.pos, [1, 0, -2], "on the floor below the hand");
  assert.deepEqual(world.problems(), []);
});

test("a dropped item never lands outside the kitchen's floor, whatever point a client names (finding 10)", async () => {
  // before the fix: a forged intent put the bread 1 km away
  const world = newWorld(46);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const eve = world.join({ name: "Eve", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, eve);
  await play(world, ann);
  await E(world, eve, CRATE[V.Bread]!);
  const bread = held(world, eve)!.id;
  kitchen(world, eve).SendCommand("Intent", "E", "floor", 1000, 5, -1000, false, "");
  await world.run(STEP);
  const k = kitchen(world, ann);
  const pos = k.items[bread]!.pos!;
  const half = [8.25 * 0.64, 5.25 * 0.64];
  assert.ok(Math.abs(pos[0]!) <= half[0]! + 1e-6 && Math.abs(pos[2]!) <= half[1]! + 1e-6 && pos[1] === 0, `inside the floor: ${pos.join(" ")}`);
  assert.ok(world.agree());
});

test("only the referee's effects are played: a client's forged OnFx is ignored (finding 10)", async () => {
  // before the fix: Eve's event made everyone hear the "Cannot" sound at the bread crate
  const world = newWorld(47);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const eve = world.join({ name: "Eve", elements: [{ round: "300" }] });
  await settle(world);
  assert.ok(world.instance(ann).networking.IsReferee, "Ann is the referee");
  const sounds = (c: FakeClient) => c.graph(SLUG).events.filter((e) => e.op === "audio" && e.target === "c_BreadCounter_00").length;
  kitchen(world, eve).SendCustomNetworkEvent(NetworkEventTarget.All, "OnFx", "full", ["BreadCounter_00"]);
  await world.run(STEP);
  assert.equal(sounds(ann), 0, "Ann hears nothing");
  assert.equal(sounds(eve), 0, "nor does Eve");
  // the referee's own effect plays everywhere
  kitchen(world, ann).Fx("full", "BreadCounter_00");
  await world.run(STEP);
  assert.equal(sounds(ann), 1);
  assert.equal(sounds(eve), 1);
});

// ---- 6: two chefs at one counter (PORT.md 9.2 #2) ---------------------------------------------------------------

test("two chefs press Q on one board in the same moment: it starts, and the second press does not pause it (finding 6)", async () => {
  // before the fix: the first Q started the cut and the second, sent before it had seen the start, paused it
  const world = newWorld(48);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  await E(world, ann, CRATE[V.Cheese]!);
  await E(world, ann, "CutCounter_00");
  assert.ok(ann.click(SLUG, "0", "q_CutCounter_00"));
  assert.ok(bob.click(SLUG, "0", "q_CutCounter_00"));
  await world.run(STEP);
  const board = kitchen(world, bob).preparators.get("CutCounter_00")!;
  assert.ok(board.IsPreparing, "cutting");
  assert.equal(board.IsPaused, false, "not paused by the second press");
  await world.run(3500);
  assert.equal(on(world, bob, "CutCounter_00")?.k, V.CheeseSliced);
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("two chefs press E on one counter in the same moment: the first takes the item, the second's press finds it changed and does nothing (finding 6; PORT.md 9.2 #2)", async () => {
  // before the fix: Bob, holding bread, saw a tomato there and pressed; Ann took the tomato first, and Bob's bread
  // went onto the counter he had seen full
  const world = newWorld(49);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  await E(world, ann, CRATE[V.Tomato]!);
  await E(world, ann, "Counter_Normal_05");
  await E(world, bob, CRATE[V.Bread]!);
  const tomato = on(world, ann, "Counter_Normal_05")!.id;
  assert.ok(ann.click(SLUG, "0", "c_Counter_Normal_05"));
  assert.ok(bob.click(SLUG, "0", "c_Counter_Normal_05"));
  await world.run(STEP);
  assert.equal(held(world, ann)?.id, tomato, "Ann took the tomato");
  assert.equal(held(world, bob)?.k, V.Bread, "Bob still holds his bread");
  assert.equal(on(world, ann, "Counter_Normal_05"), null, "the counter is empty");
  assert.ok(world.agree());
  // two empty-handed chefs: exactly one gets the item
  await E(world, bob, "Counter_Normal_01");
  await E(world, ann, "Counter_Normal_05");
  assert.ok(ann.click(SLUG, "0", "c_Counter_Normal_05"));
  assert.ok(bob.click(SLUG, "0", "c_Counter_Normal_05"));
  await world.run(STEP);
  const holders = [held(world, ann), held(world, bob)].filter((h) => h !== null);
  assert.equal(holders.length, 1, "one chef holds the tomato");
  assert.equal(holders[0]!.id, tomato);
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

test("two chefs grab one item in VR: the one who does not get it lets go (finding 6)", async () => {
  // before the fix: the losing hand kept holding a slot the kitchen no longer drew for it
  const world = newWorld(50);
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  const plate = on(world, ann, "Counter_Plate_00")!.id;
  const keyA = slotKey(kitchen(world, ann).SlotOf(plate));
  const keyB = slotKey(kitchen(world, bob).SlotOf(plate));
  assert.ok(ann.grab(SLUG, "0", keyA));
  assert.ok(bob.grab(SLUG, "0", keyB));
  await world.run(4000);
  const winner = held(world, ann)?.id === plate ? ann : bob;
  const loser = winner === ann ? bob : ann;
  assert.equal(held(world, winner)?.id, plate);
  assert.equal(held(world, loser), null);
  assert.equal(winner.object(SLUG, "0", winner === ann ? keyA : keyB).held, true, "the winner still holds it");
  assert.equal(loser.object(SLUG, "0", loser === ann ? keyA : keyB).held, false, "the loser's hand let go");
  assert.ok(world.agree());
  assert.deepEqual(world.problems(), []);
});

// ---- 11: the pause panel ----------------------------------------------------------------------------------------

test("during one chef's pause another chef cannot restart or end the round (finding 11)", async () => {
  // before the fix: Ann restarted the round Bob had paused
  const world = newWorld(51);
  const ref = world.join({ name: "Ref", elements: [{ round: "300" }] });
  const ann = world.join({ name: "Ann", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ann);
  await E(world, ann, CRATE[V.Meat]!);
  const k = kitchen(world, ref);
  await click(world, bob, "btnPause");
  assert.ok(k.match.Paused);
  await click(world, ann, "btnRestart", "0", 300);
  await click(world, ann, "btnYes");
  assert.equal(k.match.Phase, "round", "Ann's Restart is refused");
  await click(world, ann, "btnEndRound", "0", 300);
  await click(world, ann, "btnYes");
  assert.equal(k.match.Phase, "round", "Ann's End round is refused");
  assert.ok(k.match.Paused && held(world, ann)?.k === V.Meat, "still Bob's pause, nothing lost");
  // once the chef who paused has left, any chef may
  world.leave(bob);
  await world.run(6000);
  await click(world, ann, "btnEndRound", "0", 300);
  await click(world, ann, "btnYes");
  assert.equal(k.match.Phase, "lobby", "Ann ends the round once Bob has gone");
  assert.deepEqual(world.problems(), []);
});

// ---- PORT.md 9.2 #3 and #12: many chefs, random intents; joins, leaves and referee loss ---------------------------

/** A small seeded generator (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The kitchen's invariants (PORT.md 9.2 #3); an empty list when they hold. */
function invariants(k: Kitchen): string[] {
  const out: string[] = [];
  const count = new Map<string, number>();
  const place = (id: string, where: string) => {
    count.set(id, (count.get(id) ?? 0) + 1);
    if (!k.items[id]) out.push(`${where} holds ${id}, which does not exist`);
  };
  for (const [key, id] of Object.entries(k.holders)) if (!k.stacks[key]) place(id, "holder " + key);
  for (const [key, list] of Object.entries(k.stacks)) for (const id of list) place(id, "stack " + key);
  for (const [id, rec] of Object.entries(k.items)) for (const child of rec.ings ?? []) place(child, "plate " + id);
  for (const [id, n] of count) if (n > 1) out.push(`${id} is in ${n} places`);
  for (const [id, rec] of Object.entries(k.items)) if (!count.has(id) && !rec.pos) out.push(`${id} is nowhere`);
  for (const key of Object.keys(k.holders)) if (key.startsWith("hand:") && k.roster[key.slice(5)] === undefined) out.push(`${key} is not a chef's`);
  const plates = Object.values(k.items).filter((r) => r.k < 0).length + k.orders.orders.plates.length;
  if (k.match.Phase === "round" && plates !== 2) out.push(`${plates} plates, counting returns`);
  if (k.orders.orders.list.length > 3) out.push(`${k.orders.orders.list.length} orders`);
  if (k.ItemCount() > POOL_SIZE + 2) out.push(`${k.ItemCount()} items`);
  return out;
}

/** Every key a chef can click: counters (E), knives and knobs (Q). */
function targets(k: Kitchen): string[] {
  const keys: string[] = [];
  for (const cell of k.counters.keys()) keys.push("c_" + cell);
  for (const cell of k.preparators.keys()) keys.push("q_" + cell);
  return keys;
}

/** One random action by `c`: a click on a counter, knife or knob, the floor, or a loose item; sometimes a grab. */
function randomAction(world: TestWorld, c: FakeClient, next: () => number): void {
  const k = kitchen(world, c);
  const roll = next();
  if (roll < 0.08) {
    void c.click(SLUG, "0", "floor", new Vector3(next() * 6 - 3, 0, next() * 4 - 2));
    return;
  }
  if (roll < 0.14) {
    const loose = Object.keys(k.items).filter((id) => k.WhereIs(id) === "loose" && k.SlotOf(id) >= 0);
    if (loose.length) {
      const id = loose[Math.floor(next() * loose.length)]!;
      if (roll < 0.11) void c.click(SLUG, "0", slotKey(k.SlotOf(id)));
      else if (c.grab(SLUG, "0", slotKey(k.SlotOf(id)))) world.room.schedule(400, () => c.drop(SLUG, "0", slotKey(k.SlotOf(id))));
      return;
    }
  }
  const all = targets(k);
  void c.click(SLUG, "0", all[Math.floor(next() * all.length)]!);
}

test("four chefs, 500 random intents, races included: every item in one place, two plates, three orders at most, the pool never over (PORT.md 9.2 #3)", async () => {
  const world = newWorld(52);
  const chefs = ["Ann", "Bob", "Cat", "Dan"].map((name) => world.join({ name, elements: [{ round: "600", seed: "5" }] }));
  await settle(world);
  for (const c of chefs.slice(1)) await cook(world, c);
  await play(world, chefs[0]!);
  const next = rng(52);
  const referee = () => chefs.find((c) => world.instance(c).networking.IsReferee)!;
  for (let i = 0; i < 500; i++) {
    randomAction(world, chefs[Math.floor(next() * chefs.length)]!, next);
    // often in the same tick as the last one (a race), else after a short while
    await world.run(next() < 0.3 ? 0 : Math.floor(next() * 300));
    if (i % 10 === 9) assert.deepEqual(invariants(kitchen(world, referee())), [], `after intent ${i + 1}`);
  }
  await world.run(3000);
  assert.deepEqual(invariants(kitchen(world, referee())), []);
  assert.ok(world.agree(), world.digests().join(" "));
  assert.deepEqual(world.problems(), []);
});

test("ten minutes of joins, leaves and referee losses while chefs cook: the kitchen keeps its invariants and everyone agrees (PORT.md 9.2 #12)", async () => {
  const world = newWorld(53);
  const settings = { round: "600", seed: "9" };
  let n = 0;
  const join = () => world.join({ name: `P${++n}`, elements: [settings] });
  const present: FakeClient[] = [join(), join(), join()];
  await settle(world);
  for (const c of present.slice(1)) await cook(world, c);
  await play(world, present[0]!);
  const next = rng(53);
  let left = 0;
  let refereesLost = 0;
  const end = world.room.clockSeconds() + 600;
  while (world.room.clockSeconds() < end) {
    const roll = next();
    if (roll < 0.04 && present.length > 1) {
      // someone leaves, often the referee
      const leaver = next() < 0.5 ? present.find((c) => world.instance(c).networking.IsReferee) ?? present[0]! : present[Math.floor(next() * present.length)]!;
      if (world.instance(leaver).networking.IsReferee) refereesLost++;
      world.leave(leaver);
      present.splice(present.indexOf(leaver), 1);
      left++;
    } else if (roll < 0.08 && present.length < 5) {
      const c = join();
      present.push(c);
      await world.room.runUntil(() => world.started(c), 20000);
      void c.click(SLUG, "0", "btnCook");
    } else {
      const c = present[Math.floor(next() * present.length)]!;
      if (world.started(c)) randomAction(world, c, next);
    }
    await world.run(200 + Math.floor(next() * 800));
    const ref = present.find((c) => world.started(c) && world.instance(c).networking.IsReferee);
    if (ref && kitchen(world, ref).match.Phase === "round") assert.deepEqual(invariants(kitchen(world, ref)), [], `at ${world.room.clockSeconds()} s`);
    if (ref && kitchen(world, ref).match.Phase === "lobby") void ref.click(SLUG, "0", "btnPlay");
  }
  await world.run(8000);
  assert.ok(left >= 5 && refereesLost >= 2, `${left} left, ${refereesLost} of them referees`);
  const ref = present.find((c) => world.instance(c).networking.IsReferee)!;
  assert.ok(ref, "a referee");
  assert.deepEqual(invariants(kitchen(world, ref)), []);
  assert.ok(world.agree(), world.digests().join(" "));
  assert.deepEqual(world.problems(), []);
});
