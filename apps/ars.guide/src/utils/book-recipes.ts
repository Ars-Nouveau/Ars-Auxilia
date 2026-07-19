export type BookRecipeRecord = Record<string, unknown>;

export interface Point {
  x: number;
  y: number;
}

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

export const rotatePointAbout = (
  point: Point,
  about: Point,
  degrees: number,
): Point => {
  const radians = (degrees * Math.PI) / 180;
  const x =
    Math.cos(radians) * (point.x - about.x) -
    Math.sin(radians) * (point.y - about.y) +
    about.x;
  const y =
    Math.sin(radians) * (point.x - about.x) +
    Math.cos(radians) * (point.y - about.y) +
    about.y;

  return { x, y };
};

export const genOffsets = (n: number): Point[] => {
  if (n === 0) {
    return [];
  } else if (n === 1) {
    return [{ x: -4, y: -5 }];
  }

  const degrees = 360 / n;
  const about = { x: 4, y: 0 };
  let point = { x: 4, y: -6 };
  const offsets: Point[] = [];
  for (let i = 0; i < n; i++) {
    offsets.push(point);
    point = rotatePointAbout(point, about, degrees);
  }
  return offsets;
};
