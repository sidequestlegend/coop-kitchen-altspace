// Upstream: Assets/Scripts/Tutorials/Steps/PreparingXBurger/CuttingCheeseTutorialStep.cs (120). The same pattern as
// cooking: the Cheese crate, the cutting board, "start cutting"; complete when cutting starts.

import { AbstractTutorialStep } from "./AbstractTutorialStep.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import { IsIngredient } from "./IItemCollectableExtension.ts";
import { IngredientName } from "./IngredientName.ts";
import { IngredientStatus } from "./IngredientStatus.ts";

export class CuttingCheeseTutorialStep extends AbstractTutorialStep {
  GetDescription(): string {
    return "Cutting the Cheese";
  }

  override Listen(): void {
    const m = this.manager;
    m.CheeseCounter.OnItemCollectedFromInside.push(() => this.HandleCheeseCollected());
    m.CuttingBoard.OnItemPlaced.push((item) => this.HandleCheesePlacedOverCuttingBoard(item));
    m.CuttingBoard.OnPreparationStarted.push(() => this.HandleCuttingBoardPreparationStarted());
  }

  Begin(): void {
    this.manager.EnableCheeseBurgerTitle(true);
    this.Invoke("GuideToCheeseCounter", 2);
  }

  GuideToCheeseCounter(): void {
    const m = this.manager;
    m.CheeseCounter.IsEnabled = true;
    m.PlaceArrowOverCounter(m.CheeseCounter.cell);
    m.SetDescription("Take a Cheese from the crate");
    m.tut.sub = "cheese.collect";
  }

  private HandleCheeseCollected(): void {
    if (!this.Waiting("cheese.collect")) return;
    const m = this.manager;
    m.tut.sub = "cheese.place";
    m.HideArrow();
    m.CheeseCounter.IsEnabled = false;
    this.CompleteDescriptionAndInvoke("GuideToPlaceCheeseOverCuttingTable");
  }

  GuideToPlaceCheeseOverCuttingTable(): void {
    const m = this.manager;
    m.CuttingBoard.Counter.IsEnabled = true;
    m.PlaceArrowOverPreparator(m.CuttingBoard.cell);
    m.SetDescription("Put the Cheese on the Cutting Board");
  }

  private HandleCheesePlacedOverCuttingBoard(item: IItemCollectable): void {
    if (!this.Waiting("cheese.place")) return;
    const isCuttableCheese = IsIngredient(item, IngredientName.Cheese, IngredientStatus.Cuttable);
    if (!isCuttableCheese) return;
    this.manager.HideArrow();
    this.manager.tut.sub = "cheese.start";
    this.CompleteDescriptionAndInvoke("GuideToUseCuttingBoard");
  }

  GuideToUseCuttingBoard(): void {
    const isSlicingCheese = this.manager.CuttingBoard.IsPreparing;
    if (isSlicingCheese) return;
    this.manager.PlaceArrowOverPreparator(this.manager.CuttingBoard.cell);
    this.manager.SetDescription("Start cutting: press the knife");
  }

  private HandleCuttingBoardPreparationStarted(): void {
    if (!this.Waiting("cheese.start")) return;
    this.manager.tut.sub = "";
    this.manager.HideArrow();
    this.manager.CuttingBoard.Counter.IsEnabled = false;
    this.Complete();
  }
}
