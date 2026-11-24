// Rung 1, rules with no room (RulesBench): the E and Q cases the scenarios do not reach, one checklist line each, and the
// game's cost in room keys.

import assert from "node:assert/strict";
import { test } from "node:test";
import { leafBudget } from "../portkit/src/index.ts";
import { RulesBench } from "../portkit/src/testing.ts";
import game from "../src/index.ts";
import type { Kitchen } from "../src/Kitchen.ts";
import { POOL_SIZE } from "../src/Kitchen.ts";
import { bindings, V } from "./helpers.ts";

const ME = "bench-user";

function kitchenOnBench(settings: Record<string, string> = {}): { bench: RulesBench; k: Kitchen; E: (target: string, point?: number[]) => void; Q: (cell: string) => void } {
  const bench = new RulesBench(game, bindings, { settings }).start();
  const k = bench.behaviour<Kitchen>("kitchen");
  k.match.ResetToLobby();
  Object.assign(k.match.match, { phase: "round", mode: "game", rs: 0, clock: { e: 0, f: null } });
  k.Enrol(ME);
  const E = (target: string, point?: number[]) => k.IntentFor(ME, "E", target.includes(":") || target === "floor" ? target : "c:" + target, point?.[0] ?? null, point?.[1] ?? null, point?.[2] ?? null);
  const Q = (cell: string) => k.IntentFor(ME, "Q", "c:" + cell);
  return { bench, k, E, Q };
}

const hand = (k: Kitchen) => {
  const id = k.holders["hand:" + ME];
  return id ? { id, ...k.items[id]! } : null;
};

test("a loose plate takes the held ingredient (25); a held plate does nothing to a loose ingredient (135)", () => {
  const { k, E } = kitchenOnBench();
  E("Counter_Plate_00");
  E("floor", [1, 0, 1]);
  const plate = Object.keys(k.items).find((id) => k.WhereIs(id) === "loose")!;
  E("BreadCounter_00");
  E("i:" + plate);
  assert.equal(hand(k), null);
  assert.deepEqual(k.items[plate]!.ings!.map((i) => k.items[i]!.k), [V.Bread]);
  E("CheeseCounter_00");
  E("floor", [2, 0, 2]);
  const cheese = Object.keys(k.items).find((id) => k.items[id]!.k === V.Cheese)!;
  E("i:" + plate); // pick the plate up from the floor (24)
  assert.equal(hand(k)?.id, plate);
  E("i:" + cheese);
  assert.equal(hand(k)?.id, plate, "nothing happens");
  assert.equal(k.WhereIs(cheese), "loose");
});

test("a crate's top holds a plate (28) and gives it back before a new ingredient (26)", () => {
  const { k, E } = kitchenOnBench();
  E("Counter_Plate_00");
  E("MeatCounter_00");
  assert.equal(hand(k), null, "the plate is on the crate");
  E("MeatCounter_00");
  assert.equal(hand(k)?.k, V.Plate, "the plate comes back first");
  E("Counter_Normal_05");
  E("MeatCounter_00");
  assert.equal(hand(k)?.k, V.Meat, "then a new meat");
});

test("the plate stack stacks returned plates and gives back the top first (27); a held plate is not put on a plate (35)", () => {
  const { k, E } = kitchenOnBench();
  E("Counter_Plate_00");
  E("Counter_PlateStack");
  E("Counter_Plate_01");
  E("Counter_PlateStack");
  assert.equal(hand(k)?.k, V.Plate, "a plate is not put on the plate on top (ItemHolder.TryTransferItem)");
  E("Counter_Plate_01");
  for (const listener of k.orders.Asset.OnPlateReturned.slice()) listener();
  assert.equal(k.stacks["Counter_PlateStack"]!.length, 2, "a returned plate goes on top");
  const top = k.stacks["Counter_PlateStack"]![1]!;
  E("Counter_PlateStack");
  assert.equal(hand(k)?.id, top);
  assert.equal(k.stacks["Counter_PlateStack"]!.length, 1);
  assert.equal(k.holders["Counter_PlateStack"], k.stacks["Counter_PlateStack"]![0]);
});

test("a switched-off counter is ignored by E and Q but still blocks a drop on the floor (137); corners do nothing (11)", () => {
  const { k, E, Q } = kitchenOnBench();
  E("BreadCounter_00");
  k.off["Counter_Normal_05"] = 1;
  E("Counter_Normal_05");
  assert.equal(hand(k)?.k, V.Bread, "not put down, not dropped");
  E("corner");
  assert.equal(hand(k)?.k, V.Bread);
  E("Counter_Normal_01");
  E("CheeseCounter_00");
  E("CutCounter_00");
  k.off["CutCounter_00"] = 1;
  Q("CutCounter_00");
  assert.equal(k.preparators.get("CutCounter_00")!.IsPreparing, false, "Q on a switched-off counter does nothing");
  E("floor");
  assert.equal(hand(k), null, "empty hands facing the floor: nothing");
});

test("Q on anything but a board or stove does nothing (136); E with empty hands at the trash or delivery does nothing (29)", () => {
  const { k, E, Q } = kitchenOnBench();
  Q("Counter_Normal_05");
  Q("TrashCounter");
  E("TrashCounter");
  E("Counter_Delivery");
  assert.equal(hand(k), null);
  assert.equal(Object.keys(k.items).length, 2, "only the two plates");
});

test("the item pool: the 49th item is refused at the crate with the cue, nothing else changes (C10)", () => {
  const { k, E } = kitchenOnBench();
  let n = 0;
  while (Object.keys(k.items).length < POOL_SIZE) {
    E("BreadCounter_00");
    E("floor", [n++ * 0.1, 0, 0]);
  }
  const before = JSON.stringify(k.items);
  E("BreadCounter_00");
  assert.equal(hand(k), null);
  assert.equal(JSON.stringify(k.items), before);
});

test("a watcher's intents are ignored; intents count only in a countdown, a round or the tutorial, not paused (79, 86)", () => {
  const { k } = kitchenOnBench();
  k.IntentFor("someone-else", "E", "c:BreadCounter_00");
  assert.equal(k.holders["hand:someone-else"], undefined);
  k.match.match.phase = "results";
  k.IntentFor(ME, "E", "c:BreadCounter_00");
  assert.equal(k.holders["hand:" + ME], undefined);
  k.match.match.phase = "countdown";
  k.IntentFor(ME, "E", "c:BreadCounter_00");
  assert.ok(k.holders["hand:" + ME], "chefs can act during the countdown");
});

test("the game's state fits the room's key budget", () => {
  const bench = new RulesBench(game, bindings);
  const budget = leafBudget(bench.bindings, (type) => {
    const cls = game.behaviours[type];
    return cls ? { synced: (cls.synced ?? []).length, perPlayer: cls.perPlayer === true } : null;
  });
  assert.ok(budget.spaceLeaves <= 20, `this game uses ${budget.spaceLeaves} space-state leaves per copy`);
  assert.ok(budget.userLeavesPerPlayer <= 6);
});
