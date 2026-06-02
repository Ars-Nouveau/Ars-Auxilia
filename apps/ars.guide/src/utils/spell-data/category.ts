import { getCollection } from "astro:content";
import { deriveAddonsFromSpells } from "../spell-submissions/schema";
import type { Version } from "../versions";
import type { Category } from "./categories";
import type { Submission } from "./spells";

export const getSpellSubmissions = async () => {
  const entries = await getCollection("spellSubmissions");
  return entries.map((entry) => ({
    ...(entry.data as Omit<Submission, "addons">),
    addons: deriveAddonsFromSpells(entry.data.spells),
  }));
};

export const getSubmissionsFromCategory = async (
  category: Category,
  version?: Version,
) => {
  return (await getSpellSubmissions())
    .filter((submission) => submission.category === category)
    .filter((submission) => !version || submission.versions.includes(version))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
};
