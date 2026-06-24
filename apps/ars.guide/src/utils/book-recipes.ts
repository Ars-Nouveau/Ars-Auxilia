export type BookRecipeRecord = Record<string, unknown>;

export const isRecipeRecord = (value: unknown): value is BookRecipeRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const asRecipeRecord = (value: unknown) =>
  isRecipeRecord(value) ? value : undefined;

export const asRecipeRecordArray = (value: unknown) => 
  Array.isArray(value) ? value.filter(isRecipeRecord) : [];

export const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

export const asPedestalCells = (center: unknown, items: unknown[]): unknown[] => {
  const cells = [
    {},
    {},
    {},
    {},
    center,
    {},
    {},
    {},
    {},
  ];

  const cellIndices = [
    [1],
    [1, 7],
    [1, 6, 8],
    [1, 5, 7, 3],
    [1, 2, 8, 6, 0],
    [1, 2, 8, 7, 6, 0],
  ]

  let usedCells = cellIndices[items.length - 1] ?? [1, 2, 5, 8, 7, 6, 3, 0];

  for (let i = 0; i < usedCells.length; i++) {
    cells[usedCells[i]] = items[i];
  }

  return cells;
}

export const getRecipeResult = (recipe: BookRecipeRecord) =>
  asRecipeRecord(recipe.result) ?? asRecipeRecord(recipe.output);

export const getRecipeSourceCost = (recipe: BookRecipeRecord) =>
  typeof recipe.sourceCost === "number"
    ? recipe.sourceCost
    : typeof recipe.source === "number"
      ? recipe.source
      : undefined;

export const getRecipeTypeLabel = (type: string | undefined) =>
  type
    ?.replace(/^minecraft:/, "")
    .replace(/^ars_nouveau:/, "")
    .replaceAll("_", " ");
