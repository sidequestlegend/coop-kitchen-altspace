// Upstream: Assets/Scripts/Counters/Preparation/CuttingBoard.cs. Cuts a whole Cabbage, Cheese or Tomato (Cuttable) into
// its sliced (Ready) variant: 3, 3 and 4 s (39). The knife lies on an empty board, hides when something is put on it,
// shows while cutting, hides while cutting is paused, and shows again when the board is emptied (45).

import { AbstractIngredientPreparator } from "./AbstractIngredientPreparator.ts";
import { CounterKnife } from "./CounterKnife.ts";
import { IngredientStatus } from "./IngredientStatus.ts";
import { Kitchen } from "./Kitchen.ts";

const CHOP_EVERY = 0.25;

export class CuttingBoard extends AbstractIngredientPreparator {
  private knife!: CounterKnife;
  private lastChop: number | null = null;
  private shownAnim = "";

  protected override OnEnable(): void {
    this.knife = new CounterKnife(this.kitchen, () => this.Write(), Kitchen.CellKey(this.cell));
    this.holder.OnItemPlaced.push(() => this.HandleItemPlaced());
    this.holder.OnItemReleased.push(() => this.HandleItemReleased());
  }

  PlayCutSound(): void {
    this.knife.PlayCutSound();
  }

  /** Reset(): what the board accepts and makes. */
  protected SetupIngredientStatus(): void {
    this.allowedStatus = IngredientStatus.Cuttable;
    this.preparatedStatus = IngredientStatus.Ready;
  }

  protected override GetIdleAnimationName(): string {
    return "CuttingBoard@Idle";
  }

  protected override GetPreparationAnimationName(): string {
    return "CuttingBoard@Cutting";
  }

  protected override PlayIdleAnimation(): void {
    super.PlayIdleAnimation();
    if (this.IsPaused) this.knife.Hide();
  }

  protected override PlayPreparationAnimation(): void {
    this.knife.Show();
    super.PlayPreparationAnimation();
  }

  private HandleItemPlaced(): void {
    this.knife.Hide();
  }

  private HandleItemReleased(): void {
    this.knife.Show();
  }

  override Render(G: number, previousG: number | null): void {
    const st = this.st;
    this.Host.setActive(`@${this.path}/Knife`, st.knife === 1);
    if (st.anim !== this.shownAnim) {
      this.shownAnim = st.anim;
      this.Host.animPlay(`@${this.path}`, st.anim);
    }
    // The Cutting clip's twelve PlayCutSound events: one chop every 0.25 s while cutting runs.
    const cutting = st.p === 1 && st.ps === 0;
    const chop = Math.floor(G / CHOP_EVERY);
    if (cutting && previousG !== null && this.lastChop !== null && chop !== this.lastChop && G > previousG) this.PlayCutSound();
    this.lastChop = cutting ? chop : null;
  }
}
