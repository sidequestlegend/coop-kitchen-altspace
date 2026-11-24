// Upstream: Assets/Scripts/Items/Ingredients/IngredientName.cs (MIT, Hyago Oliveira). The numbers are the asset values.

export const IngredientName = {
  None: 0,
  Bread: 1,
  Cabbage: 2,
  Cheese: 3,
  Tomato: 4,
  Meat: 5,
} as const;
export type IngredientName = (typeof IngredientName)[keyof typeof IngredientName];

export function IngredientNameText(name: IngredientName): string {
  return (Object.keys(IngredientName) as Array<keyof typeof IngredientName>).find((k) => IngredientName[k] === name) ?? String(name);
}
