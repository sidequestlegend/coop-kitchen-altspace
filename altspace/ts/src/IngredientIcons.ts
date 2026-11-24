// Upstream: Assets/Scripts/UI/Ingredients/IngredientIcons.cs. The icons floating over a plate, one per ingredient on it.
//
// Upstream instantiates an icon prefab per ingredient (Add) and destroys the last one with that sprite (Remove). That is
// always the icon of the plate's last ingredient, so the list equals the plate's ingredients in order, and the port draws
// it from the plate's state (one text of sprite tags per plate). Add and Remove keep the upstream's list for the view.

import { IngredientIcon } from "./IngredientIcon.ts";

export class IngredientIcons {
  private readonly icons: IngredientIcon[] = [];

  Add(icon: string): void {
    this.icons.push(new IngredientIcon(icon));
  }

  Remove(sprite: string): void {
    for (let i = this.icons.length - 1; i >= 0; i--) {
      if (this.icons[i]!.Icon === sprite) {
        this.icons.splice(i, 1);
        return;
      }
    }
  }

  Clear(): void {
    this.icons.length = 0;
  }

  /** The text a plate's icon line shows, for these icon names. */
  static Text(icons: readonly string[]): string {
    return icons.map((icon) => new IngredientIcon(icon).Tag).join("");
  }
}
