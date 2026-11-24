// Upstream: Assets/Scripts/UI/PreparationWorldSpaceCanvas.cs. Over each board and stove: the preparation bar (40) and
// the "Cannot Cut" / "Cannot Cook" text that rises for 2 s with SFX_delivery_fail01 when Q is refused (43, 54).
//
// The bar is drawn from the preparator's state on every client (shown while preparing, paused or not). The refusal
// happens on the referee, which sends it to everyone as an effect.

import { Behaviour, type GameObject } from "../portkit/src/index.ts";
import type { AbstractIngredientPreparator } from "./AbstractIngredientPreparator.ts";
import { Kitchen } from "./Kitchen.ts";
import { PreparationTimer } from "./PreparationTimer.ts";

export const REJECTED_SECONDS = 2;

export class PreparationWorldSpaceCanvas extends Behaviour {
  kitchen!: Kitchen;
  preparator!: AbstractIngredientPreparator;
  /** The canvas's path under the kit root. */
  path = "";
  barFill: GameObject | null = null;
  /** "Cannot \nCut" or "Cannot \nCook" (the prefab's text override). */
  rejectedText = "";
  private timer!: PreparationTimer;
  /** How many refusals this client has shown (for tests). */
  rejectedShown = 0;

  override Start(): void {
    this.timer = new PreparationTimer(this.Host, `@${this.path}/Bar`, this.barFill);
    this.timer.Hide();
    this.Host.setText(`@${this.path}/Rejected`, this.rejectedText);
    this.Host.setActive(`@${this.path}/Rejected`, false);
    this.OnEnable();
  }

  private OnEnable(): void {
    this.preparator.OnIngredientRejected.push(() => this.HandleIngredientRejected());
    this.kitchen.OnEffect("rejected", (cell) => {
      if (cell === this.preparator.cell) this.ShowRejected();
    });
  }

  override Update(): void {
    const G = this.kitchen.match.KitchenG;
    if (this.preparator.IsPreparing) {
      this.timer.Show();
      this.timer.Progress = this.preparator.NormalizedProgress(G);
    } else this.timer.Hide();
  }

  /** Referee: the preparator refused Q. */
  private HandleIngredientRejected(): void {
    this.kitchen.Fx("rejected", this.preparator.cell);
  }

  private ShowRejected(): void {
    this.rejectedShown++;
    this.kitchen.Flash(`@${this.path}/Rejected`, REJECTED_SECONDS);
    this.kitchen.PlaySound("fail01", Kitchen.CellKey(this.preparator.cell));
  }

  get BarVisible(): boolean {
    return this.timer.Visible;
  }
}
