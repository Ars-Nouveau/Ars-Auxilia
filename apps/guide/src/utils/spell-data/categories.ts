import { getEntry } from "astro:content";

export interface SpellCategory {
  id: string;
  class: string;
  text: string;
}

export type Category = string;

export type CategoryMap = Record<string, Omit<SpellCategory, "id">>;

export const getCategories = async (): Promise<SpellCategory[]> => {
  const entry = await getEntry("spellCategories", "categories");
  return entry?.data ?? [];
};

export const getCategoryMap = async (): Promise<CategoryMap> =>
  Object.fromEntries(
    (await getCategories()).map(({ id, ...category }) => [id, category]),
  );

export const getCategoryIds = async (): Promise<string[]> =>
  (await getCategories()).map((category) => category.id);
