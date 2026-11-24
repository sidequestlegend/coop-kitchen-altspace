// Upstream: Assets/Scripts/Tutorials/Steps/PreparingXBurger/PlatingTutorialStep.cs (121). Bread from its crate; the
// plate and its counter switched on; bread on the plate; "get the plate" unless a chef already holds it; arrows over
// the stove and the board, "Plate the other Ingredients."; when cooked meat and sliced cheese are both on the plate the
// delivery counter is switched on; delivering completes the tutorial.
//
// Upstream locks chef switching between the bread and the delivery prompt "so the other chef cannot take the plate".
// There is no switching here; any chef may carry the plate, and the step only checks what is on it (8.7).

import { AbstractTutorialStep } from "./AbstractTutorialStep.ts";
import { IsIngredient } from "./IItemCollectableExtension.ts";
import type { Ingredient } from "./Ingredient.ts";
import { IngredientName } from "./IngredientName.ts";
import { IngredientStatus } from "./IngredientStatus.ts";
import type { Plate } from "./Plate.ts";

const stoveArrowIndex = 0;
const cuttingBoardArrowIndex = 1;

export class PlatingTutorialStep extends AbstractTutorialStep {
  GetDescription(): string {
    return "Plating Ingredients";
  }

  override Listen(): void {
    const m = this.manager;
    m.BreadCounter.OnItemCollectedFromInside.push(() => this.HandleBreadCollected());
    m.kitchen.plateEvents.push((ingredient, plate) => {
      this.HandleBreadPlacedOverPlate(ingredient, plate);
      this.HandleRemainIngredientsPlated(ingredient, plate);
    });
    m.PlateCounter.OnItemCollectedFromTop.push(() => this.HandlePlateCollected());
    m.kitchen.orders.Asset.OnOrderDelivered.push(() => this.HandleOrderDelivered());
  }

  Begin(): void {
    this.manager.EnableCheeseBurgerTitle(true);
    this.Invoke("GuideToBreadCounter", 2);
  }

  GuideToBreadCounter(): void {
    const m = this.manager;
    m.BreadCounter.IsEnabled = true;
    m.PlaceArrowOverCounter(m.BreadCounter.cell);
    m.SetDescription("Take a Bread from the crate");
    m.tut.sub = "plate.bread";
  }

  private HandleBreadCollected(): void {
    if (!this.Waiting("plate.bread")) return;
    const m = this.manager;
    m.tut.sub = "plate.breadOn";
    m.BreadCounter.IsEnabled = false;
    m.HideArrow();
    const plate = m.Plate;
    if (plate) plate.IsEnabled = true;
    m.PlateCounter.IsEnabled = true;
    this.CompleteDescriptionAndInvoke("GuideToPlaceBreadOverPlate");
  }

  GuideToPlaceBreadOverPlate(): void {
    this.manager.PlaceArrowOverPlate();
    this.manager.SetDescription("Put the Bread on the Plate");
  }

  private HandleBreadPlacedOverPlate(ingredient: Ingredient, plate: Plate): void {
    if (!this.Waiting("plate.breadOn") || plate.id !== this.manager.tut.plate) return;
    if (!IsIngredient(ingredient, IngredientName.Bread)) return;
    this.manager.tut.sub = "plate.check";
    this.manager.HideArrow();
    this.CompleteDescriptionAndInvoke("CheckWhetherPlayerIsHoldingPlate");
  }

  CheckWhetherPlayerIsHoldingPlate(): void {
    // upstream: the current chef's ItemHandler.IsHoldingPlate(); here: is any chef holding the tutorial plate
    const isPlayerHoldingPlate = this.manager.kitchen.WhereIs(this.manager.tut.plate).startsWith("holder:hand:");
    if (isPlayerHoldingPlate) this.GuideToPlateRemainIngredients();
    else this.GuideToGetPlate();
  }

  private GuideToGetPlate(): void {
    this.manager.PlaceArrowOverPlate();
    this.manager.SetDescription("Get the Plate");
    this.manager.tut.sub = "plate.get";
  }

  private HandlePlateCollected(): void {
    if (!this.Waiting("plate.get")) return;
    this.manager.tut.sub = "plate.got";
    this.manager.HideArrow();
    this.CompleteDescriptionAndInvoke("GuideToPlateRemainIngredients");
  }

  GuideToPlateRemainIngredients(): void {
    const m = this.manager;
    m.Stove.Counter.IsEnabled = true;
    m.CuttingBoard.Counter.IsEnabled = true;
    m.PlaceArrowOverPreparator(m.Stove.cell, stoveArrowIndex);
    m.PlaceArrowOverPreparator(m.CuttingBoard.cell, cuttingBoardArrowIndex);
    m.SetDescription("Plate the other Ingredients.");
    m.tut.sub = "plate.rest";
  }

  private HandleRemainIngredientsPlated(ingredient: Ingredient, plate: Plate): void {
    if (!this.Waiting("plate.rest") || plate.id !== this.manager.tut.plate) return;
    const m = this.manager;
    if (IsIngredient(ingredient, IngredientName.Meat, IngredientStatus.Ready)) {
      m.HideArrow(stoveArrowIndex);
      m.Stove.Counter.IsEnabled = false;
      m.tut.meat = 1;
    }
    if (IsIngredient(ingredient, IngredientName.Cheese, IngredientStatus.Ready)) {
      m.HideArrow(cuttingBoardArrowIndex);
      m.CuttingBoard.Counter.IsEnabled = false;
      m.tut.cheese = 1;
    }
    const isRemainIngredientsPlated = m.tut.meat === 1 && m.tut.cheese === 1;
    if (!isRemainIngredientsPlated) return;
    m.tut.sub = "plate.toDeliver";
    this.CompleteDescriptionAndInvoke("GuideToDeliveryCounter");
  }

  GuideToDeliveryCounter(): void {
    const m = this.manager;
    m.DeliveryCounter.IsEnabled = true;
    m.PlaceArrowOverDeliveryCounter();
    m.SetDescription("Delivery your order!");
    m.tut.sub = "plate.deliver";
  }

  private HandleOrderDelivered(): void {
    if (!this.Waiting("plate.deliver")) return;
    this.manager.tut.sub = "";
    this.manager.HideArrow();
    this.Complete();
  }
}
