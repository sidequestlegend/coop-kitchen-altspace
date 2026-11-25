// Rung 1: the referee checks a chef's reach itself (PORT.md 11.8, trust: "reach is checked on the clicking client only").
// Each test here failed on the code before the check (noted per test): the referee took every chef's intent on its word.
//
// In the fake room every kit object stands at the origin, and the room answers the kit's head reading (Networking.HeadOf,
// relay op pkHead) from the client's last pose. Ref joins first and is the referee; Bob is another chef. The referee
// judges an intent by the nearest the chef's head came to the target in the last HEAD_HISTORY seconds, so a chef who
// has just moved is first left there for longer (`away`).

import assert from "node:assert/strict";
import { test } from "node:test";
import { Quaternion, Vector3, type LocalPoses } from "../portkit/src/index.ts";
import type { FakeClient } from "../portkit/src/platform/fake.ts";
import { TestWorld } from "../portkit/src/testing.ts";
import game from "../src/index.ts";
import { HEAD_HISTORY, HEAD_SECONDS, MAX_REACH_CHECKS_PER_CHEF, REFEREE_REACH_SLACK } from "../src/Kitchen.ts";
import { REACH } from "../src/Counter.ts";
import { CRATE, E, STEP, V, bindings, cook, held, kitchen, newWorld, play, settle } from "./helpers.ts";

const CHEESE = "c:" + CRATE[V.Cheese]!;

async function twoChefs(seed: number) {
  const world = newWorld(seed);
  const ref = world.join({ name: "Ref", elements: [{ round: "300" }] });
  const bob = world.join({ name: "Bob", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, bob);
  await play(world, ref);
  assert.ok(kitchen(world, ref).Networking.IsReferee, "Ref is the referee");
  return { world, ref, bob };
}

/** Moves a chef and waits until the referee's recent readings of them are all from there. */
async function away(world: TestWorld, c: FakeClient, to: Vector3 | LocalPoses): Promise<void> {
  c.pose(to);
  await world.run(HEAD_HISTORY * 1000 + 500);
}

/** A pose with the head at `head` and both hands at `hand`. */
function poses(head: Vector3, hand: Vector3): LocalPoses {
  const at = (position: Vector3) => ({ position, rotation: new Quaternion() });
  return { head: at(head), leftHand: at(hand), rightHand: at(hand) };
}

test("the referee refuses a far intent that a modified client sends past its own reach check", async () => {
  // before the check: Bob took a cheese from a crate 20 m away (his page's check skipped), and the referee let him
  const { world, ref, bob } = await twoChefs(61);
  await away(world, bob, new Vector3(20, 1.6, 0));
  kitchen(world, bob).LocalIntent("E", CHEESE, null); // what a modified page sends: no click, no reach check of its own
  await world.run(STEP);
  assert.equal(held(world, bob), null, "the far intent is refused: Bob holds nothing");
  const k = kitchen(world, ref);
  assert.equal(k.reachRefused, 1);
  const check = k.reachLog.at(-1)!;
  assert.equal(check.uid, bob.uid);
  assert.equal(check.ok, false);
  assert.ok(Math.abs(check.distance - Math.hypot(20, 1.6)) < 0.01, `the referee measured from its app's head reading: ${check.distance}`);
  // just past the slack, even with a hand within his own page's reach: refused too
  await away(world, bob, poses(new Vector3(4.6, 1.6, 0), new Vector3(1.5, 1.2, 0)));
  kitchen(world, bob).LocalIntent("E", CHEESE, null);
  await world.run(STEP);
  assert.equal(held(world, bob), null, "4.9 m from the head is past REACH + slack");
  assert.equal(kitchen(world, ref).reachRefused, 2);
  // and a far floor drop: Bob takes bread where he stands, walks 20 m away and names a spot by the crates
  bob.pose(new Vector3(0.5, 1.6, 0.5));
  await E(world, bob, CRATE[V.Bread]!);
  const bread = held(world, bob)!.id;
  await away(world, bob, new Vector3(20, 1.6, 0));
  kitchen(world, bob).LocalIntent("E", "floor", new Vector3(0.5, 0, 0.5));
  await world.run(STEP);
  assert.equal(held(world, bob)?.id, bread, "a drop named far from the chef is refused: he still holds the bread");
  assert.ok(world.agree());
});

test("an honest chef's intent counts when the referee's app shows the head within reach plus the slack", async () => {
  // before the check there was no reach check on the referee: the test fails on reachLog (no record of the check)
  const { world, ref, bob } = await twoChefs(62);
  // Bob reaches out: his hand is 1.9 m from the crate (his page counts it), his head 4.0 m (the referee allows 4.5 m)
  await away(world, bob, poses(new Vector3(3.7, 1.6, 0), new Vector3(1.5, 1.2, 0))); // and has stood there a while
  await E(world, bob, CRATE[V.Cheese]!);
  assert.equal(held(world, bob)?.k, V.Cheese, "the cheese is Bob's");
  const k = kitchen(world, ref);
  const check = k.reachLog.at(-1)!;
  assert.equal(check.uid, bob.uid);
  assert.equal(check.target, CHEESE);
  assert.equal(check.ok, true);
  assert.ok(check.distance > REACH && check.distance <= REACH + REFEREE_REACH_SLACK, `beyond 2 m, within the slack: ${check.distance}`);
  assert.deepEqual(check.head, [3.7, 1.6, 0], "measured from the referee's app's head reading");
  assert.equal(k.reachRefused, 0);
  // the referee's own intents need no reading
  await E(world, ref, CRATE[V.Bread]!);
  assert.equal(held(world, ref)?.k, V.Bread);
  assert.equal(k.reachLog.length, 1, "no check of the referee's own intent");
  // Bob presses Q on a knife and walks off before his intent arrives: judged by where he was when he pressed
  await E(world, bob, "CutCounter_00");
  await world.run(1000);
  kitchen(world, bob).LocalIntent("Q", "c:CutCounter_00", null);
  bob.pose(new Vector3(20, 1.6, 0));
  await world.run(STEP);
  assert.equal(k.prep["CutCounter_00"]?.p, 1, "the cut started");
  const late = k.reachLog.at(-1)!;
  assert.ok(late.ok && late.age! > 0 && late.distance <= REACH + REFEREE_REACH_SLACK, `judged by an earlier reading: ${JSON.stringify(late)}`);
  assert.ok(world.agree());
});

test("the referee fails closed: an unknown head, a reading that never comes, and too many waiting intents are refused", async () => {
  // before the check: each of these intents ran, and Bob took a cheese
  const { world, ref, bob } = await twoChefs(63);
  const k = kitchen(world, ref);
  bob.head = null; // the referee's app has no body for Bob (any more): it answers 0 0 0
  await world.run(HEAD_HISTORY * 1000 + 500);
  kitchen(world, bob).LocalIntent("E", CHEESE, null);
  await world.run(STEP);
  assert.equal(held(world, bob), null, "no head: refused");
  assert.equal(k.reachLog.at(-1)!.head, null);
  assert.equal(k.reachRefused, 1);
  // a kit whose app never answers: every waiting intent is refused after HEAD_SECONDS, and only a few may wait
  bob.pose(new Vector3(0.5, 1.6, 0.5));
  world.room.headAnswers = false;
  for (let i = 0; i < 20; i++) kitchen(world, bob).LocalIntent("E", CHEESE, null);
  let most = 0;
  for (let t = 0; t < (HEAD_SECONDS + 3) * 1000; t += 50) {
    await world.run(50);
    most = Math.max(most, k.reachWaiting);
  }
  assert.equal(most, MAX_REACH_CHECKS_PER_CHEF, "at most this many of one chef's intents wait at once");
  assert.equal(k.reachWaiting, 0);
  assert.equal(held(world, bob), null, "no answer in time: refused");
  assert.equal(k.reachRefused, 21, "every one of the 20 refused (too many waiting, or no answer in time)");
  assert.ok(k.reachLog.some((c) => c.why === "too many intents waiting for a head reading"));
  // once the app answers again, an honest intent counts
  world.room.headAnswers = true;
  await E(world, bob, CRATE[V.Cheese]!);
  assert.equal(held(world, bob)?.k, V.Cheese);
  assert.ok(world.agree());
});

test("a page that knows no position for its player does not count a click with a reach (fail closed)", async () => {
  // before: InReach and the kit's reach counted every click while no position was known; Cat took a cheese
  const world = new TestWorld(game, bindings, { seed: 64 }); // nobody posed: no page knows where its player is
  const ref = world.join({ name: "Ref", elements: [{ round: "300" }] });
  const cat = world.join({ name: "Cat", elements: [{ round: "300" }] });
  await settle(world);
  await cook(world, cat);
  await play(world, ref);
  await E(world, cat, CRATE[V.Cheese]!);
  assert.equal(held(world, cat), null, "the click does not count");
  assert.equal(kitchen(world, ref).reachLog.length, 0, "and no intent was sent");
  cat.pose(new Vector3(0.5, 1.6, 0.5));
  await E(world, cat, CRATE[V.Cheese]!);
  assert.equal(held(world, cat)?.k, V.Cheese, "with a position it counts");
});
