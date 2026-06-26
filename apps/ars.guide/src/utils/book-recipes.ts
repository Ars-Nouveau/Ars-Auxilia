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

export const rotatePointAbout = (point: number[], about: number[], degrees: number) => {
  let rad = degrees * Math.PI / 180;
  let newX = Math.cos(rad) * (point[0] - about[0]) - Math.sin(rad) * (point[1] - about[1]) + about[0];
  let newY = Math.sin(rad) * (point[0] - about[0]) + Math.cos(rad) * (point[1] - about[1]) + about[1];
  return [newX, newY];
}

export const genOffsets = (n) => {
  if (n === 0) {
    return []
  } else if (n === 1) {
    return [[-5, -4]]
  }

  const degrees = -360 / n;
  const about = [0, 4];
  let point = [-6, 4];
  let offsets = [];
  for (let i = 0; i < n; i++) {
    offsets.push(point);
    point = rotatePointAbout(point, about, degrees);
  }
  return offsets;
};

