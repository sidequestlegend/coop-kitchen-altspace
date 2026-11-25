// Test helpers: chefs in a kitchen on the fake room, acting the way a player does (clicking counters, knobs, the floor,
// the board's buttons), and reading the kitchen back.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Vector3 } from "../portkit/src/index.ts";
import type { FakeClient } from "../portkit/src/platform/fake.ts";
import { TestWorld } from "../portkit/src/testing.ts";
import game from "../src/index.ts";
import type { Kitchen } from "../src/Kitchen.ts";

export const bindings = JSON.parse(readFileSync(fileURLToPath(new URL("../bindings.json", import.meta.url)), "utf8"));
export const SLUG = game.slug;
/** Time given to every action: a command's round trip through the fake room and its write batching, and some. */
export const STEP = 1000;

/** Ingredient variants (data/kitchen-data.json). */
export const V = { Bread: 0, Cabbage: 1, CabbageSliced: 2, Cheese: 3, CheeseSliced: 4, Meat: 5, MeatCooked: 6, MeatBurned: 7, Tomato: 8, TomatoSliced: 9, Plate: -1 } as const;
export const CRATE: Record<number, string> = { 0: "BreadCounter_00", 1: "CabbageCounter_00", 3: "CheeseCounter_00", 5: "MeatCounter_00", 8: "TomatoCounter_00" };

/**
 * Where a chef stands unless a test moves them: in the fake room every kit object is at the origin, and this head is
 * 1.7 m from it, within a chef's reach (2 m). In the app every player has a body the app places; a page that knows no
 * position for its player, or a referee whose app knows none for a chef, now refuses their clicks (fail closed).
 */
export const STAND = new Vector3(0.5, 1.6, 0.5);

/** A kitchen on the fake room; every player who joins stands at STAND (their page and the room know their head). */
export function newWorld(seed = 1): TestWorld {
  const world = new TestWorld(game, bindings, { seed });
  const join = world.join.bind(world);
  world.join = (options) => {
    const client = join(options);
    client.pose(STAND);
    return client;
  };
  return world;
}

export const kitchen = (world: TestWorld, c: FakeClient, inst = "0") => world.behaviour<Kitchen>(c, "kitchen", inst);

/** Everyone has started; then the referee's first writes have reached the room. */
export async function settle(world: TestWorld, inst = "0"): Promise<void> {
  await world.settle(inst);
  await world.run(2500);
}

/** Clicks a kit object (a counter "c_<cell>", a knob "q_<cell>", a button) and waits a step. */
export async function click(world: TestWorld, c: FakeClient, key: string, inst = "0", wait = STEP, point?: Vector3): Promise<void> {
  assert.ok(c.click(SLUG, inst, key, point), `${c.name} cannot click ${key}`);
  await world.run(wait);
}

/** E on a counter. */
export const E = (world: TestWorld, c: FakeClient, cell: string, inst = "0") => click(world, c, "c_" + cell, inst);
/** Q on a board or stove (its knife or knob). */
export const Q = (world: TestWorld, c: FakeClient, cell: string, inst = "0") => click(world, c, "q_" + cell, inst);

/** What a chef holds: the item's record and id, or null. */
export function held(world: TestWorld, c: FakeClient, inst = "0"): { id: string; k: number; ings: number[] } | null {
  const k = kitchen(world, c, inst);
  const id = k.holders["hand:" + c.uid];
  if (!id) return null;
  const rec = k.items[id]!;
  return { id, k: rec.k, ings: (rec.ings ?? []).map((i) => k.items[i]!.k) };
}

/** What a counter holds: the item's variant (-1 a plate) and, for a plate, its ingredients' variants. */
export function on(world: TestWorld, c: FakeClient, cell: string, inst = "0"): { id: string; k: number; ings: number[] } | null {
  const k = kitchen(world, c, inst);
  const id = k.holders[cell];
  if (!id) return null;
  const rec = k.items[id]!;
  return { id, k: rec.k, ings: (rec.ings ?? []).map((i) => k.items[i]!.k) };
}

/** PLAY, by `c`, and the 0.2 s + 3 s countdown. */
export async function play(world: TestWorld, c: FakeClient, inst = "0"): Promise<void> {
  await click(world, c, "btnPlay", inst);
  await world.run(3000);
  assert.equal(kitchen(world, c, inst).match.Phase, "round", "the round has started");
}

/** COOK: joins the kitchen. */
export const cook = (world: TestWorld, c: FakeClient, inst = "0") => click(world, c, "btnCook", inst);

/** Takes a raw ingredient from its crate, prepares it on an appliance (or not), and leaves it in the chef's hands. */
export async function fetch(world: TestWorld, c: FakeClient, variant: number, appliance: string | null, inst = "0"): Promise<void> {
  const raw = variant === V.CabbageSliced ? V.Cabbage : variant === V.CheeseSliced ? V.Cheese : variant === V.MeatCooked ? V.Meat : variant === V.TomatoSliced ? V.Tomato : variant;
  await E(world, c, CRATE[raw]!, inst);
  assert.equal(held(world, c, inst)?.k, raw, `${c.name} took ${raw}`);
  if (raw === variant) return;
  assert.ok(appliance, "an appliance for " + variant);
  await E(world, c, appliance, inst);
  await Q(world, c, appliance, inst);
  const seconds = raw === V.Meat ? 6 : raw === V.Tomato ? 4 : 3;
  await world.run(seconds * 1000);
  await E(world, c, appliance, inst);
  assert.equal(held(world, c, inst)?.k, variant, `${c.name} has ${variant} from ${appliance}`);
}

export function shown(c: FakeClient, target: string, inst = "0"): boolean | undefined {
  return c.graph(SLUG, inst).active.get(target);
}

export function text(c: FakeClient, key: string, inst = "0"): string | undefined {
  return c.graph(SLUG, inst).text.get(key);
}
