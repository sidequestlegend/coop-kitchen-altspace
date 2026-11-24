// Upstream: Assets/Scripts/UI/Ingredients/IngredientIcon.cs. One round ingredient icon (an Image whose sprite is set).
// On the boards an icon is a TextMeshPro sprite tag in a text (PORT.md 8.5): `<sprite name="Bread">`.

export class IngredientIcon {
  Icon: string;

  constructor(icon: string) {
    this.Icon = icon;
  }

  /** The icon as rich text. */
  get Tag(): string {
    return this.Icon ? `<sprite name="${this.Icon}">` : "";
  }
}
