// Upstream: Assets/Scripts/Items/Ingredients/IngredientStatus.cs. Cuttable is 4, not 3: the asset values depend on it.

export const IngredientStatus = {
  None: 0,
  Raw: 1,
  Ready: 2,
  Burned: 3,
  Cuttable: 4,
} as const;
export type IngredientStatus = (typeof IngredientStatus)[keyof typeof IngredientStatus];
