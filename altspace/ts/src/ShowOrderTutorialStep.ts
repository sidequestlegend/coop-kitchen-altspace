// Upstream: Assets/Scripts/Tutorials/Steps/ShowOrderTutorialStep.cs. Creates one X Burger order whose countdown is
// cancelled at once (it never runs down), and completes after 3 s (118).

import data from "../data/kitchen-data.json" with { type: "json" };
import { AbstractTutorialStep } from "./AbstractTutorialStep.ts";

export class ShowOrderTutorialStep extends AbstractTutorialStep {
  /** The asset's `recipe` (XBurger) and `timeToRead`. */
  recipe = data.tutorial.showOrderRecipe;
  timeToRead = data.tutorial.timeToRead;

  GetDescription(): string {
    return "Orders appear on the board.";
  }

  Begin(): void {
    const settings = this.manager.kitchen.orders.Asset;
    const order = settings.Create(settings.recipeSettings.recipes[this.recipe]!);
    order.CancelCountDownWaitingTime();
    this.Invoke("Complete", this.timeToRead);
  }

  protected override Complete(): void {
    super.Complete();
  }
}
