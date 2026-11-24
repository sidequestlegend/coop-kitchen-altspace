// Upstream: Assets/Scripts/Counters/Preparation/Stove.cs. Cooks raw Meat in 6 s (46) with sizzle, particles and the pan
// animation (47); when done, a burn sequence starts at once (49): 2 s, then the icon blinks 3 times (0.8 s on, 0.2 s
// off) and 5 times (0.2 s on, 0.2 s off), the animation doubling its speed for the second part; at 7 s the meat is
// Burned and smoke starts (50). Taking the meat off stops it (51); Q cancels it and the meat never burns (52).
//
// The coroutine becomes one number, `burn` = the game time the sequence started (IsBurning while it is set); the
// referee's Tick burns the meat at burn + 7; blinks, beeps and the animation's two speeds are drawn from it.
//
// One subtlety reproduced as an end state (PORT.md 7 step 15): BurnIngredient replaces the meat, whose release handler
// stops the very coroutine that is running; Unity still runs the coroutine's last two statements, so the stove ends
// idle, not burning, with smoke on.

import { AbstractIngredientPreparator } from "./AbstractIngredientPreparator.ts";
import { FryingPan } from "./FryingPan.ts";
import { roundTime } from "./GameClock.ts";
import type { Ingredient } from "./Ingredient.ts";
import { IngredientStatus } from "./IngredientStatus.ts";
import { Kitchen } from "./Kitchen.ts";
import { PreparationWarning } from "./PreparationWarning.ts";

const burningAnimationName = "Stove@Burning";
const waitBurningAnimationName = "Stove@WaitBurning";

export class Stove extends AbstractIngredientPreparator {
  timeBeforeBurn = 2;
  private fryingPan!: FryingPan;
  private shown = { anim: "", fry: -1, smoke: -1, warning: -1 };
  private beeps: number | null = null;

  get IsBurning(): boolean {
    return this.st.burn !== null;
  }

  get IsAbleToBurn(): boolean {
    return this.st.nb !== 1;
  }
  set IsAbleToBurn(value: boolean) {
    this.Write().nb = value ? 0 : 1;
  }

  /** Seconds from the start of the burn sequence to the burned meat. */
  get BurnDuration(): number {
    return this.timeBeforeBurn + 3 * (0.8 + 0.2) + 5 * (0.2 + 0.2);
  }

  protected override OnEnable(): void {
    this.fryingPan = new FryingPan(() => this.Write());
    this.holder.OnItemReleased.push(() => this.HandleOnItemReleased());
  }

  protected SetupIngredientStatus(): void {
    this.allowedStatus = IngredientStatus.Raw;
    this.preparatedStatus = IngredientStatus.Ready;
  }

  override Interact(): void {
    if (this.IsBurning) this.StopBurning();
    else super.Interact();
  }

  protected override PlayPreparationAnimation(): void {
    super.PlayPreparationAnimation();
    this.fryingPan.StartFry();
  }

  protected override PlayIdleAnimation(): void {
    super.PlayIdleAnimation();
    this.fryingPan.StopFry();
  }

  protected override CompletePreparation(): void {
    super.CompletePreparation();
    this.BurningRoutine();
  }

  protected override GetIdleAnimationName(): string {
    return "Stove@Idle";
  }

  protected override GetPreparationAnimationName(): string {
    return "Stove@Heatting";
  }

  /** The coroutine's start: IsBurning, the wait-burning animation. The rest is timed from `burn`. */
  private BurningRoutine(): void {
    if (!this.IsAbleToBurn) return;
    const st = this.Write();
    st.burn = roundTime(this.kitchen.match.G);
    st.anim = waitBurningAnimationName;
  }

  override Tick(G: number): void {
    super.Tick(G);
    const st = this.st;
    if (st.burn === null || G - st.burn < this.BurnDuration) return;
    this.BurnIngredient();
    this.CompleteBurning();
    this.fryingPan.StartBurn();
  }

  private BurnIngredient(): void {
    const ingredient = this.holder.CurrentItem as Ingredient | null;
    if (!ingredient) return;
    const burnedIngredient = this.kitchen.ingredientSettings.SpawnIngredient(ingredient.Name, IngredientStatus.Burned);
    if (burnedIngredient) this.holder.ReplaceItem(burnedIngredient);
  }

  private StopBurning(): void {
    this.CompleteBurning();
  }

  private CompleteBurning(): void {
    this.Write().burn = null;
    this.PlayIdleAnimation();
  }

  private HandleOnItemReleased(): void {
    if (this.IsBurning) this.StopBurning();
    this.fryingPan.StopBurn();
  }

  /** The animation and the warning at game time G (the burn sequence's parts, from its start). */
  AnimationAt(G: number): { anim: string; speed: number; warning: boolean; beeps: number } {
    const st = this.st;
    if (st.burn === null) return { anim: st.anim, speed: 1, warning: false, beeps: 0 };
    const elapsed = G - st.burn;
    const burning = elapsed >= this.timeBeforeBurn;
    return {
      anim: burning ? burningAnimationName : waitBurningAnimationName,
      speed: elapsed >= this.timeBeforeBurn + 3 ? 2 : 1,
      warning: PreparationWarning.IsVisibleAt(elapsed, this.timeBeforeBurn),
      beeps: PreparationWarning.ShownCount(elapsed, this.timeBeforeBurn),
    };
  }

  override Render(G: number, previousG: number | null): void {
    const st = this.st;
    const now = this.AnimationAt(G);
    const anim = now.anim + (now.speed === 2 ? "@x2" : "");
    if (anim !== this.shown.anim) {
      this.shown.anim = anim;
      this.Host.animPlay(`@${this.path}`, now.anim);
      if (now.anim === burningAnimationName) this.Host.animFloat(`@${this.path}`, "Speed", now.speed);
    }
    if (st.fry !== this.shown.fry) {
      this.shown.fry = st.fry;
      this.Host.particles(`@${this.path}/Pan/Sizzle`, st.fry === 1);
      // BS.AudioSource has no documented Stop: the looping sizzle is a play-on-enable child switched on and off.
      this.Host.setActive(`@${this.path}/Pan/SizzleAudio`, st.fry === 1);
    }
    if (st.smoke !== this.shown.smoke) {
      this.shown.smoke = st.smoke;
      this.Host.particles(`@${this.path}/Pan/Smoke`, st.smoke === 1);
    }
    const warning = now.warning ? 1 : 0;
    if (warning !== this.shown.warning) {
      this.shown.warning = warning;
      this.Host.setActive(`@${this.path}/Warning`, now.warning);
    }
    // a beep each time the icon shows; none replayed when the page arrives mid-sequence
    if (previousG !== null && this.beeps !== null && now.beeps > this.beeps) this.kitchen.PlaySound("warning", Kitchen.CellKey(this.cell));
    this.beeps = st.burn === null ? 0 : now.beeps;
  }
}
