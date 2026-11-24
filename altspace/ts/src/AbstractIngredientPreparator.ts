// Upstream: Assets/Scripts/Counters/Preparation/AbstractIngredientPreparator.cs. A cutting board or a stove: Q toggles
// the preparation (start, pause, resume; 38, 41, 48); it runs on its own and, when done, replaces the ingredient by its
// prepared variant (42); in the final seconds it runs 1.25 times faster (55); Q with nothing it can prepare shows the
// "Cannot ..." cue (43, 54).
//
// The coroutine becomes state (PORT.md 3.1): `prep[cell]` = {p: IsPreparing, ps: IsPaused, acc, since, dur, n}. Progress
// at game time G is acc + boostedElapsed(since, G) while running, where the booster window is the final seconds of a
// round (TimeLimit's OnFinalSecondsStarted to OnFinished). The referee's Tick completes it on the first tick at or past
// its duration (upstream: the first frame). Every client draws the bar from the same numbers.

import { Behaviour, type GameObject } from "../portkit/src/index.ts";
import { invoke } from "./ActionCode.ts";
import { boostedElapsed, roundTime } from "./GameClock.ts";
import { IInteractableKind, type IInteractable } from "./IInteractable.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import type { Ingredient } from "./Ingredient.ts";
import type { IngredientName } from "./IngredientName.ts";
import type { IngredientStatus } from "./IngredientStatus.ts";
import type { ItemHolder } from "./ItemHolder.ts";
import type { Kitchen, PrepRec } from "./Kitchen.ts";
import type { PreparationCounter } from "./PreparationCounter.ts";

export abstract class AbstractIngredientPreparator extends Behaviour implements IInteractable {
  // ---- from bindings.json (the prefab's serialized fields) ----
  kitchen!: Kitchen;
  /** The counter cell this preparator sits on; its holder's key. */
  cell = "";
  /** The preparator's object path under the kit root (its knife, pan, warning and texts are children). */
  path = "";
  allowedStatus = 0 as IngredientStatus;
  preparatedStatus = 0 as IngredientStatus;
  finalSecondsBooster = 1.25;
  /** `Counter = GetComponentInParent<Counter>()`. */
  counter!: PreparationCounter;
  /** The progress bar's fill (scaled along x), under PreparationWorldSpaceCanvas. */
  barFill: GameObject | null = null;

  readonly kinds: readonly string[] = [IInteractableKind];
  readonly OnInteracted: Array<() => void> = [];
  readonly OnIngredientRejected: Array<() => void> = [];
  readonly OnPreparationStarted: Array<() => void> = [];
  readonly OnPreparationCompleted: Array<() => void> = [];
  readonly OnPreparationUpdated: Array<(progress: number) => void> = [];
  holder!: ItemHolder;

  /** `event OnItemPlaced` forwards to the holder's. */
  get OnItemPlaced(): Array<(item: IItemCollectable) => void> {
    return this.holder.OnItemPlaced;
  }

  get Counter(): PreparationCounter {
    return this.counter;
  }

  get IsEnabled(): boolean {
    return this.kitchen.off["prep:" + this.cell] !== 1;
  }
  set IsEnabled(value: boolean) {
    if (value) delete this.kitchen.off["prep:" + this.cell];
    else this.kitchen.off["prep:" + this.cell] = 1;
  }

  /** This preparator's state; a fresh one when the kitchen has none yet. */
  get st(): PrepRec {
    return this.kitchen.prep[this.cell] ?? this.DefaultState();
  }

  get IsPreparing(): boolean {
    return this.st.p === 1;
  }
  private set IsPreparing(value: boolean) {
    this.Write().p = value ? 1 : 0;
  }

  get IsPaused(): boolean {
    return this.st.ps === 1;
  }
  private set IsPaused(value: boolean) {
    const st = this.Write();
    const G = this.kitchen.match.G;
    if (value && st.ps === 0 && st.since !== null) {
      st.acc = roundTime(this.ProgressAt(G));
      st.since = null;
    } else if (!value) st.since = roundTime(G);
    st.ps = value ? 1 : 0;
  }

  /** The state to change; created in the kitchen's state if missing. */
  protected Write(): PrepRec {
    return (this.kitchen.prep[this.cell] ??= this.DefaultState());
  }

  DefaultState(): PrepRec {
    return { p: 0, ps: 0, acc: 0, since: null, dur: 0, n: 0, burn: null, nb: 0, knife: 1, fry: 0, smoke: 0, anim: this.GetIdleAnimationName() };
  }

  override Start(): void {
    this.holder = this.kitchen.Holder(this.cell);
    this.OnEnable();
  }

  protected OnEnable(): void {}

  /** Q, on the referee. */
  override Interact(): void {
    invoke(this.OnInteracted);
    this.TogglePreparation();
  }

  protected abstract GetIdleAnimationName(): string;
  protected abstract GetPreparationAnimationName(): string;

  protected PlayIdleAnimation(): void {
    this.Write().anim = this.GetIdleAnimationName();
  }

  protected PlayPreparationAnimation(): void {
    this.Write().anim = this.GetPreparationAnimationName();
  }

  protected CompletePreparation(): void {
    this.IsPreparing = false;
    this.PlayIdleAnimation();
    invoke(this.OnPreparationCompleted);
  }

  private TogglePreparation(): void {
    if (!this.IsPreparing) this.TryStartPreparation();
    else if (this.IsPaused) this.ContinuePreparation();
    else this.PausePreparation();
  }

  protected TryStartPreparation(): void {
    const item = this.holder.CurrentItem as (IItemCollectable & { kind?: string }) | null;
    const ingredient = item && item.kind === "ingredient" ? (item as unknown as Ingredient) : null;
    const canPrepare = ingredient !== null && this.CanPrepare(ingredient.Status);
    if (canPrepare) this.StartPreparation(ingredient!);
    else invoke(this.OnIngredientRejected);
  }

  private StartPreparation(ingredient: Ingredient): void {
    this.IsPreparing = true;
    invoke(this.OnPreparationStarted);
    this.ContinuePreparation();
    this.PreparationRoutine(ingredient);
  }

  private PausePreparation(): void {
    this.IsPaused = true;
    this.PlayIdleAnimation();
  }

  private ContinuePreparation(): void {
    this.IsPaused = false;
    this.PlayPreparationAnimation();
  }

  /** The coroutine's start: `currentTime = 0`, `preparingTime = ingredient.PreparationTime`. */
  private PreparationRoutine(ingredient: Ingredient): void {
    const st = this.Write();
    st.acc = 0;
    st.since = roundTime(this.kitchen.match.G);
    st.dur = ingredient.PreparationTime;
    st.n = ingredient.Name;
    invoke(this.OnPreparationUpdated, 0);
  }

  /** The coroutine's loop, on the referee's tick: done when the progress reaches the preparation time. */
  Tick(G: number): void {
    const st = this.st;
    if (st.p !== 1 || st.ps === 1 || st.since === null) return;
    if (this.ProgressAt(G) < st.dur) return;
    invoke(this.OnPreparationUpdated, 1);
    this.PrepareIngredient(st.n as IngredientName);
    this.CompletePreparation();
  }

  /** Seconds of progress at game time G (upstream's `currentTime`). */
  ProgressAt(G: number): number {
    const st = this.st;
    if (st.p !== 1) return 0;
    if (st.since === null) return st.acc;
    const boost = this.kitchen.match.BoostWindow();
    return st.acc + boostedElapsed(st.since, G, boost?.[0] ?? null, boost?.[1] ?? null, this.finalSecondsBooster);
  }

  /** The bar's value, 0 to 1 (OnPreparationUpdated's argument). */
  NormalizedProgress(G: number): number {
    const st = this.st;
    return st.p === 1 && st.dur > 0 ? Math.min(1, this.ProgressAt(G) / st.dur) : 0;
  }

  private PrepareIngredient(name: IngredientName): void {
    const preparedIngredient = this.kitchen.ingredientSettings.SpawnIngredient(name, this.preparatedStatus);
    if (preparedIngredient) this.holder.ReplaceItem(preparedIngredient);
  }

  private CanPrepare(status: IngredientStatus): boolean {
    return status === this.allowedStatus;
  }

  /** Every client, every tick: what this preparator looks like (and sounds like) at game time G. */
  Render(_G: number, _previousG: number | null): void {}
}
