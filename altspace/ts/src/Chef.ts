// New file (no upstream counterpart; replaces the ten Player*.cs files: Player, PlayerType, PlayerMotor, PlayerAnimator,
// PlayerAnimationEventHandler, PlayerManager, PlayerMatchController, PlayerSettings, PlayerInputHandler,
// PlayerInputSettings). Every player is a chef with their own hands: no capsule chefs, no Tab switching (C1).
//
//   - The roster (who cooks, in upstream's colour order Blue, Green, Red, Yellow) is in the kitchen's state; COOK joins
//     or leaves, PLAY and TUTORIAL join whoever presses them (Kitchen.Enrol, MainMenuOptions).
//   - Input: a click on a counter, crate, board, stove, trash, delivery counter, loose item or the floor is E on it; a
//     click on a knife or a stove's knob is Q; in VR a grab is E where the item is and a release is E where the hand
//     is (Kitchen.ClickSlot / GrabSlot / DropSlot). Each becomes an intent the referee runs (Kitchen.Intent).
//   - One logical hand per chef: the holder "hand:<uid>" in the kitchen's state, holding at most one item.
//   - This per-player behaviour publishes where its player's head is while they hold something, so that the others can
//     draw the held item in front of them: the runtime gives a page no remote poses (a gap: PORT.md 11). It is also
//     where a chef who leaves drops what they held.

import { Behaviour } from "../portkit/src/index.ts";
import { HAND, type Kitchen } from "./Kitchen.ts";

/** How far (m) the head must move before it is published again. */
const HEAD_STEP = 0.05;

export class Chef extends Behaviour {
  static override perPlayer = true;
  static override synced = ["head"];
  static override syncMode = "continuous" as const;

  /** The head's position, rounded to centimetres, while this player holds an item; null otherwise. */
  head: number[] | null = null;

  kitchen!: Kitchen;

  override Update(): void {
    const player = this.Player;
    if (!player || !player.isLocal || !this.kitchen) return;
    const holding = this.kitchen.holders[HAND + player.uid] !== undefined;
    const at = this.Input.Position;
    let next: number[] | null = null;
    if (holding && at) next = [Math.round(at.x * 100) / 100, Math.round(at.y * 100) / 100, Math.round(at.z * 100) / 100];
    const same =
      next === this.head ||
      (next !== null && this.head !== null && Math.hypot(next[0]! - this.head[0]!, next[1]! - this.head[1]!, next[2]! - this.head[2]!) < HEAD_STEP);
    if (same) return;
    this.head = next;
    this.RequestSerialization();
  }
}
