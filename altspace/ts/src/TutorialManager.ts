// Upstream: Assets/Scripts/Tutorials/TutorialManager.cs. The tutorial (113 to 122): every counter, the plate and the
// delivery counter start switched off (E and Q ignore them), the round timer never starts, no random orders; after the
// countdown the steps run in order, 0.4 s apart; finishing a step turns its text green with a sound and fades it out;
// the last step opens the results with the tutorial's score.
//
// Ported in substance (PORT.md 8.7, C18): steps 1 and 2 (move, switch chef) are dropped, the rest are kept one for one;
// it runs in the classic kitchen with the `_00` stove, board and crates, the first plate counter and the delivery
// counter (the trash and the other plate stay off, as the upstream tutorial kitchen has no trash and one plate); every
// chef sees the same step and any chef may do it. Its progress is this behaviour's synced state, its waits are
// deadlines on the game clock, so a new referee carries on.

import { Behaviour, Vector3, type GameObject } from "../portkit/src/index.ts";
import type { AbstractTutorialStep } from "./AbstractTutorialStep.ts";
import { CookingMeatTutorialStep } from "./CookingMeatTutorialStep.ts";
import type { Counter } from "./Counter.ts";
import { CuttingCheeseTutorialStep } from "./CuttingCheeseTutorialStep.ts";
import type { CuttingBoard } from "./CuttingBoard.ts";
import data from "../data/kitchen-data.json" with { type: "json" };
import type { DeliveryCounter } from "./DeliveryCounter.ts";
import { roundTime } from "./GameClock.ts";
import type { IngredientCounter } from "./IngredientCounter.ts";
import { IngredientName } from "./IngredientName.ts";
import type { Kitchen } from "./Kitchen.ts";
import type { Plate } from "./Plate.ts";
import { PlatingTutorialStep } from "./PlatingTutorialStep.ts";
import { ShowOrderTutorialStep } from "./ShowOrderTutorialStep.ts";
import type { Stove } from "./Stove.ts";
import type { Trash } from "./Trash.ts";
import { TutorialIngredientCounters } from "./TutorialIngredientCounters.ts";
import type { TutorialDescription } from "./TutorialDescription.ts";

export interface TutRec {
  /** currentIndex: -1 before the first step. */
  i: number;
  /** The sub-goal the current step waits for. */
  sub: string;
  /** Scheduled actions ("<step>:<method>" or "m:<method>") and when (G). */
  timers: Array<{ at: number; act: string }>;
  text: string;
  /** The description is completed (green) and fading since `fade`. */
  green: 0 | 1;
  fade: number | null;
  title: 0 | 1;
  /** The two arrows: [cell or "plate" or "delivery", height] or null. */
  arrows: Array<[string, number] | null>;
  meat: 0 | 1;
  cheese: 0 | 1;
  /** The tutorial's plate (the one on the first plate counter). */
  plate: string;
  done: 0 | 1;
}

export function EmptyTutorial(): TutRec {
  return { i: -1, sub: "", timers: [], text: "", green: 0, fade: null, title: 0, arrows: [null, null], meat: 0, cheese: 0, plate: "", done: 0 };
}

export class TutorialManager extends Behaviour {
  static override synced = ["tut"];
  tut: TutRec = EmptyTutorial();

  kitchen!: Kitchen;
  description!: TutorialDescription;
  /** "Cooking a Cheese Burger" (cheeseBurgerStepTitle). */
  titlePath = "";
  arrowObjects: GameObject[] = [];
  deliveryCounter!: DeliveryCounter;
  /** The cells the tutorial uses: the first plate counter. */
  plateCounterCell = "Counter_Plate_00";
  timeBetweenSteps = data.tutorial.timeBetweenSteps;

  readonly steps: AbstractTutorialStep[] = [new ShowOrderTutorialStep(), new CookingMeatTutorialStep(), new CuttingCheeseTutorialStep(), new PlatingTutorialStep()];
  private readonly counters = new TutorialIngredientCounters();
  private shownArrows = "";
  private shownTitle = -1;

  get TotalSteps(): number {
    return this.steps.length;
  }

  get IsRunning(): boolean {
    return this.kitchen.match.match.mode === "tutorial" && (this.kitchen.match.Phase === "tutorial" || this.kitchen.match.Phase === "countdown");
  }

  /** The text fades out at 1.2 a second from full: about 0.83 s. */
  get FadeSeconds(): number {
    return 1 / data.ui.tutorialFadeSpeed;
  }

  // FindItems
  get Stove(): Stove {
    return this.kitchen.preparators.get(this.Cell("StoveCounter"))! as Stove;
  }
  get CuttingBoard(): CuttingBoard {
    return this.kitchen.preparators.get(this.Cell("CutCounter"))! as CuttingBoard;
  }
  get DeliveryCounter(): DeliveryCounter {
    return this.deliveryCounter;
  }
  get PlateCounter(): Counter {
    return this.kitchen.counters.get(this.plateCounterCell) as Counter;
  }
  get Plate(): Plate | null {
    return this.tut.plate ? (this.kitchen.Item(this.tut.plate) as Plate | null) : null;
  }
  get MeatCounter(): IngredientCounter {
    return this.counters.FindCounter(IngredientName.Meat);
  }
  get BreadCounter(): IngredientCounter {
    return this.counters.FindCounter(IngredientName.Bread);
  }
  get CheeseCounter(): IngredientCounter {
    return this.counters.FindCounter(IngredientName.Cheese);
  }
  /** Every Counter (FindObjectsByType<Counter>: plain counters, crates, the counters under boards and stoves). */
  get Counters(): Counter[] {
    return [...this.kitchen.counters.values()].filter((c): c is Counter => "holder" in c && "startsWithPlate" in c);
  }

  private Cell(prefix: string): string {
    const cells = [...this.kitchen.preparators.keys()].filter((c) => c.startsWith(prefix)).sort();
    return cells.find((c) => c.endsWith("_00")) ?? cells[0]!;
  }

  override Start(): void {
    this.counters.Load(this.kitchen.FindBehavioursOfType<IngredientCounter>("IngredientCounter"));
    this.steps.forEach((step, i) => step.Initialize(this, i));
    for (const step of this.steps) step.Listen();
    this.kitchen.match.settings.CountDown.OnFinished.push(() => this.HandleCountDownFinished());
  }

  ResetTutorial(): void {
    this.tut = EmptyTutorial();
  }

  /** Awake (when the tutorial starts): find the items, switch everything off. */
  Awake(): void {
    this.tut = EmptyTutorial();
    const plate = this.kitchen.Holder(this.plateCounterCell).CurrentItem;
    this.tut.plate = plate?.id ?? "";
    // DisableItems
    for (const id of Object.keys(this.kitchen.items)) if (this.kitchen.items[id]!.k < 0) this.kitchen.items[id]!.off = 1;
    this.DeliveryCounter.IsEnabled = false;
    for (const c of this.kitchen.counters.values()) if ((c as Trash).kinds?.indexOf("IItemDisposer") >= 0) (c as Trash).IsEnabled = false;
    this.EnableCounters(false);
  }

  EnableCounters(enabled: boolean): void {
    for (const counter of this.Counters) counter.IsEnabled = enabled;
  }

  // ---- arrows, title, description ----

  PlaceArrowOverCounter(cell: string, index = 0): void {
    this.tut.arrows[index] = [cell, 1.5];
  }

  PlaceArrowOverDeliveryCounter(index = 0): void {
    this.tut.arrows[index] = [this.DeliveryCounter.cell, 2];
  }

  PlaceArrowOverPreparator(cell: string, index = 0): void {
    this.tut.arrows[index] = [cell, 0.5 + 0.2];
  }

  PlaceArrowOverPlate(index = 0): void {
    this.tut.arrows[index] = ["plate", 0.5];
  }

  HideArrow(index = 0): void {
    this.tut.arrows[index] = null;
  }

  EnableCheeseBurgerTitle(enabled: boolean): void {
    this.tut.title = enabled ? 1 : 0;
  }

  SetDescription(text: string): void {
    this.description.SetUncompletedText(text);
  }

  CompleteDescription(): void {
    this.description.Complete();
    this.description.FadeOut();
  }

  /** CompleteStep: the description completes and fades, then 0.4 s, then the next step. */
  CompleteStep(): void {
    this.CompleteDescription();
    this.Schedule(this.FadeSeconds + this.timeBetweenSteps, "m:TryBeginNextStep");
  }

  Schedule(seconds: number, act: string): void {
    this.tut.timers.push({ at: roundTime(this.kitchen.match.G + seconds), act });
  }

  private HandleCountDownFinished(): void {
    if (this.kitchen.match.match.mode !== "tutorial") return;
    this.Schedule(this.timeBetweenSteps, "m:TryBeginNextStep");
  }

  TryBeginNextStep(): void {
    if (++this.tut.i >= this.TotalSteps) {
      this.CompleteTutorial();
      return;
    }
    const step = this.steps[this.tut.i]!;
    this.tut.sub = "";
    this.SetDescription(step.GetDescription());
    step.Begin();
  }

  private CompleteTutorial(): void {
    this.EnableCounters(true);
    this.tut.done = 1;
    this.tut.arrows = [null, null];
    this.tut.title = 0;
    this.kitchen.match.GoToResults();
  }

  /** The referee's tick: runs the scheduled actions that are due, in time order. */
  Tick(G: number): void {
    if (!this.IsRunning) return;
    for (let guard = 0; guard < 16; guard++) {
      const due = this.tut.timers.filter((t) => t.at <= G).sort((a, b) => a.at - b.at)[0];
      if (!due) return;
      this.tut.timers.splice(this.tut.timers.indexOf(due), 1);
      const [who, method] = due.act.split(":") as [string, string];
      if (who === "m") (this as unknown as Record<string, () => void>)[method]!.call(this);
      else this.steps[Number(who)]?.Run(method);
    }
  }

  // ---- drawing (every client) ----

  override Update(): void {
    const on = this.IsRunning ? this.tut.title : 0;
    if (on !== this.shownTitle && this.titlePath) {
      this.shownTitle = on;
      this.Host.setActive(this.titlePath, on === 1);
    }
    const arrows = this.IsRunning ? this.tut.arrows : [null, null];
    const key = JSON.stringify(arrows) + (arrows.some((a) => a?.[0] === "plate") ? this.kitchen.WhereIs(this.tut.plate) : "");
    if (key === this.shownArrows) return;
    this.shownArrows = key;
    this.arrowObjects.forEach((arrow, i) => {
      const target = arrows[i];
      const at = target ? this.ArrowPosition(target) : null;
      arrow.SetActive(at !== null);
      if (at) arrow.transform.position = at;
    });
  }

  private ArrowPosition([target, height]: [string, number]): Vector3 | null {
    const scale = this.kitchen.kitScale;
    let base: Vector3 | null = null;
    if (target === "plate") {
      const where = this.kitchen.WhereIs(this.tut.plate);
      if (where.startsWith("holder:")) base = this.kitchen.AnchorOf(where.slice(7));
      else {
        const pos = this.kitchen.items[this.tut.plate]?.pos;
        base = pos ? new Vector3(pos[0]!, pos[1]!, pos[2]!) : null;
      }
    } else base = this.kitchen.AnchorOf(target);
    return base ? base.add(Vector3.up.scale(height * scale)) : null;
  }
}
