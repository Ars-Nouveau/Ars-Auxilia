export type BookPageBlockData = Record<string, unknown>;

export interface BookPageItemData {
  key: string;
  item: string;
  iconUrl?: string;
  data: Record<string, unknown>;
}

export interface BookPageRecipeData {
  id: string;
  recipe?: Record<string, unknown>;
}

export const knownBookPageKeys = new Set([
  "title",
  "description",
  "icon",
  "iconUrl",
  "tier",
  "recipe_1",
  "recipe_2",
  "recipeData",
  "related",
  "entity_type",
]);

export const asString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getRecipeKeys = (page: BookPageBlockData) =>
  Object.keys(page)
    .filter((key) => /^recipe_\d+$/.test(key))
    .sort(
      (a, b) =>
        Number(a.replace("recipe_", "")) - Number(b.replace("recipe_", "")),
    );

export const getItemKeys = (page: BookPageBlockData) =>
  Object.keys(page)
    .filter((key) => /^item\d+$/.test(key))
    .sort(
      (a, b) => Number(a.replace("item", "")) - Number(b.replace("item", "")),
    );

export const getBookItems = (page: BookPageBlockData): BookPageItemData[] =>
  getItemKeys(page).reduce<BookPageItemData[]>((items, key) => {
    const data = page[key];
    if (!isRecord(data) || typeof data.item !== "string") return items;

    const iconUrl = asString(data.iconUrl);
    items.push({
      key,
      item: data.item,
      ...(iconUrl ? { iconUrl } : {}),
      data,
    });
    return items;
  }, []);

export const getBookRecipes = (
  page: BookPageBlockData,
): BookPageRecipeData[] => {
  if (!Array.isArray(page.recipeData)) {
    return getRecipeKeys(page).map((key) => ({ id: String(page[key]) }));
  }

  return page.recipeData.reduce<BookPageRecipeData[]>((recipes, value) => {
    if (!isRecord(value) || typeof value.id !== "string") return recipes;
    const recipe = isRecord(value.recipe) ? value.recipe : undefined;
    recipes.push({ id: value.id, ...(recipe ? { recipe } : {}) });
    return recipes;
  }, []);
};

export const getUnknownEntries = (page: BookPageBlockData) =>
  Object.entries(page).filter(
    ([key]) =>
      !knownBookPageKeys.has(key) &&
      !/^recipe_\d+$/.test(key) &&
      !/^item\d+$/.test(key),
  );

export const getRelatedValues = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const isDescriptionOnlyPage = (page: BookPageBlockData) => {
  const keys = Object.keys(page);
  return (
    keys.length === 1 &&
    keys[0] === "description" &&
    typeof page.description === "string"
  );
};

export const mergeDescriptionOnlyPages = (pages: BookPageBlockData[]) =>
  pages.reduce<BookPageBlockData[]>((acc, page, index) => {
    if (index > 0 && isDescriptionOnlyPage(page) && acc.length > 0) {
      const previous = acc[acc.length - 1];
      const previousDescription = asString(previous.description);
      previous.description = previousDescription
        ? `${previousDescription} ${page.description}`
        : page.description;
      return acc;
    }

    acc.push({ ...page });
    return acc;
  }, []);

export const getRelationLanguageKeyCandidates = (relation: string) => {
  const [namespace, path = relation] = relation.split(":");
  const normalizedPath = path.replace(/^glyph_/, "");
  const candidates = [
    relation,
    path,
    `${namespace}.glyph_name.glyph_${normalizedPath}`,
    `block.${namespace}.${path}`,
    `item.${namespace}.${path}`,
    `${namespace}.${path}`,
    `${namespace}.page.${path}`,
    `${namespace}.page1.${path}`,
  ];

  return [...new Set(candidates)];
};

export const getRelationLabel = (
  relation: string,
  langByKey: Map<string, string>,
) => {
  const languageKey = getRelationLanguageKeyCandidates(relation).find(
    (candidate) => langByKey.has(candidate),
  );

  return {
    languageKey,
    label: languageKey ? (langByKey.get(languageKey) ?? relation) : relation,
  };
};
