// The held item must not push its holder (world 9d7311, 2026-11-25): an item a chef holds is drawn 0.45 m in front of
// and 0.3 m below their head (Kitchen.HandPosition), moved there every frame, and on the Default layer while held
// (Kitchen.SetHeldSlots); a remote holder's item sits 0.3 m under their head. Its box was solid, so it shoved the
// holder, and anyone near a remote holder. The kit makes every item box a trigger (it is clicked and grabbed, both of
// which find triggers, and the page places it). Failed on the kit built before.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

test("every item slot's collider is a trigger (a held item never pushes its holder)", () => {
  const prefab = readFileSync(fileURLToPath(new URL("../../Assets/Kit/coop-kitchen.prefab", import.meta.url)), "utf8");
  const docs = prefab.split("--- !u!");
  const names = new Map<string, string>();
  for (const d of docs) {
    const go = /^1 &(\d+)/.exec(d);
    if (go) names.set(go[1]!, /m_Name: (.*)/.exec(d)![1]!.trim());
  }
  let slots = 0;
  const solid: string[] = [];
  for (const d of docs) {
    if (!/^(65|135|136|64) &/.test(d)) continue;
    const name = names.get(/m_GameObject: \{fileID: (\d+)\}/.exec(d)![1]!) ?? "";
    if (!/^Slot\d\d$/.test(name)) continue;
    slots++;
    if (/m_IsTrigger: 0/.test(d)) solid.push(name);
  }
  assert.equal(slots, 48, "the 48 item slots' colliders");
  assert.deepEqual(solid, [], "solid item colliders");
});
