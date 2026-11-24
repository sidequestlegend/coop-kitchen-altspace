// Upstream: Assets/Scripts/Tutorials/Steps/PreparingXBurger/CookingMeatTutorialStep.cs (119). The stove cannot burn in
// the tutorial; after 2 s the Meat crate is switched on with an arrow over it; then the stove; then "start cooking";
// the step completes when cooking starts. Each sub-goal switches off the counter just used.

import { AbstractTutorialStep } from "./AbstractTutorialStep.ts";
import type { IItemCollectable } from "./IItemCollectable.ts";
import { IsIngredient } from "./IItemCollectableExtension.ts";
import { IngredientName } from "./IngredientName.ts";
import { IngredientStatus } from "./IngredientStatus.ts";

export class CookingMeatTutorialStep extends AbstractTutorialStep {
  GetDescription(): string {
    return "Cooking a Meat";
  }

  override Listen(): void {
    const m = this.manager;
    m.MeatCounter.OnItemCollectedFromInside.push(() => this.HandleMeatCollected());
    m.Stove.OnItemPlaced.push((item) => this.HandleMeatPlacedOverStove(item));
    m.Stove.OnPreparationStarted.push(() => this.HandleStovePreparationStarted());
  }

  Begin(): void {
    this.manager.Stove.IsAbleToBurn = false;
    this.manager.EnableCheeseBurgerTitle(true);
    this.Invoke("GuideToMeatCounter", 2);
  }

  GuideToMeatCounter(): void {
    const m = this.manager;
    m.MeatCounter.IsEnabled = true;
    m.PlaceArrowOverCounter(m.MeatCounter.cell);
    m.SetDescription("Take a Meat from the crate");
    m.tut.sub = "meat.collect";
  }

  private HandleMeatCollected(): void {
    if (!this.Waiting("meat.collect")) return;
    const m = this.manager;
    m.tut.sub = "meat.place";
    m.HideArrow();
    m.MeatCounter.IsEnabled = false;
    this.CompleteDescriptionAndInvoke("GuideToPlaceMeatOverStove");
  }

  GuideToPlaceMeatOverStove(): void {
    const m = this.manager;
    m.Stove.Counter.IsEnabled = true;
    m.PlaceArrowOverPreparator(m.Stove.cell);
    m.SetDescription("Put the Meat on the Stove");
  }

  private HandleMeatPlacedOverStove(item: IItemCollectable): void {
    if (!this.Waiting("meat.place")) return;
    const isRawMeat = IsIngredient(item, IngredientName.Meat, IngredientStatus.Raw);
    if (!isRawMeat) return;
    this.manager.tut.sub = "meat.start";
    this.manager.HideArrow();
    this.CompleteDescriptionAndInvoke("GuideToUseStove");
  }

  GuideToUseStove(): void {
    const isCookingMeat = this.manager.Stove.IsPreparing;
    if (isCookingMeat) return;
    this.manager.PlaceArrowOverPreparator(this.manager.Stove.cell);
    this.manager.SetDescription("Start cooking: press the stove's knob");
  }

  private HandleStovePreparationStarted(): void {
    if (!this.Waiting("meat.start")) return;
    this.manager.tut.sub = "";
    this.manager.Stove.Counter.IsEnabled = false;
    this.manager.HideArrow();
    this.Complete();
  }
}
