// Upstream: Assets/Scripts/Tutorials/Steps/AbstractTutorialStep.cs. One tutorial step: a description, Begin, Complete,
// and "finish the description (green, a sound, fade out) then do the next thing".
//
// Upstream steps chain one-shot event subscriptions and Invoke/coroutine waits on one machine. In the port a step's
// progress is a value in the tutorial's synced state (`sub`, the sub-goal it waits for), its listeners are subscribed
// once on every client and act only when that value says so, and its waits are deadlines on the game clock (PORT.md
// 7 step 23). So any chef may do any step, and a new referee carries on.
//
// Prompts are reworded for clicks and hands, without the key glyphs of the upstream's sprite sheet (C18, 6.3 C).

import type { TutorialManager } from "./TutorialManager.ts";

export abstract class AbstractTutorialStep {
  protected manager!: TutorialManager;
  /** This step's place in the tutorial's list. */
  index = -1;

  Initialize(manager: TutorialManager, index: number): void {
    this.manager = manager;
    this.index = index;
  }

  /** Subscribes the step's listeners (once, on every client). */
  Listen(): void {}

  abstract Begin(): void;
  abstract GetDescription(): string;

  /** Whether the tutorial is on this step and waiting for `sub`. */
  protected Waiting(sub: string): boolean {
    return this.manager.IsRunning && this.manager.tut.i === this.index && this.manager.tut.sub === sub;
  }

  protected Complete(): void {
    this.manager.CompleteStep();
  }

  /** CompleteDescriptionAndInvoke(action): the description completes and fades, then `action` runs. */
  protected CompleteDescriptionAndInvoke(action: string): void {
    this.manager.CompleteDescription();
    this.manager.Schedule(this.manager.FadeSeconds, `${this.index}:${action}`);
  }

  /** Invoke(nameof(action), seconds). */
  protected Invoke(action: string, seconds: number): void {
    this.manager.Schedule(seconds, `${this.index}:${action}`);
  }

  /** Runs a scheduled action of this step by name. */
  Run(action: string): void {
    const fn = (this as unknown as Record<string, unknown>)[action];
    if (typeof fn === "function") fn.call(this);
  }
}
