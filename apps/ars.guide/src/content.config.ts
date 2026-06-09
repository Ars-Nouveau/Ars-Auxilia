import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";
import { bookLoader } from "./utils/loaders/book-loader";
import { casterTomeLoader } from "./utils/loaders/caster-tome-loader";
import { glyphLoader } from "./utils/loaders/glyph-loader";
import { langLoader } from "./utils/loaders/lang-loader";
import { projectLoader } from "./utils/loaders/project-loader";
import { spellSubmissionContentSchema } from "./utils/spell-submissions/schema";

const projectSchema = z.object({
  mod_id: z.string(),
  display_name: z.string(),
  color: z.string(),
  cf_id: z.number(),
  dependencies: z
    .array(
      z.object({
        cf_id: z.number(),
        name: z.string(),
      }),
    )
    .default([]),
});

const spellCategorySchema = z.array(
  z.object({
    id: z.string(),
    class: z.string(),
    text: z.string(),
  }),
);

const versionAvailabilitySchema = z.record(
  z.string(),
  z.object({
    docs: z.boolean().default(false),
    kubejs: z.boolean().default(false),
  }),
);

const bookCategorySchema = z.object({
  type: z.literal("category"),
  id: z.string(),
  namespace: z.string(),
  slug: z.string(),
  title: z.string(),
  order: z.number().default(0),
  parents: z.array(z.string()).default([]),
  subCategories: z.array(z.string()).default([]),
  sourcePath: z.string(),
});

const bookEntrySchema = z.object({
  type: z.literal("entry"),
  id: z.string(),
  namespace: z.string(),
  slug: z.string(),
  entrySlug: z.string(),
  category: z.string(),
  categorySlug: z.string(),
  title: z.string(),
  order: z.number().default(0),
  icon: z.string().optional(),
  iconUrl: z.string().optional(),
  pages: z.array(z.record(z.string(), z.any())).default([]),
  sourcePath: z.string(),
});

const bookSchema = z.discriminatedUnion("type", [
  bookCategorySchema,
  bookEntrySchema,
]);

const schema = z.object({
  title: z.string(),
  description: z.string().default(""),
  weight: z.number().default(0),
  slug: z.string().optional(),
});

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema,
});

const kubejs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/kubejs" }),
  schema,
});

const spells = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spells" }),
  schema,
});

const spellSubmissions = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/spell-submissions" }),
  schema: spellSubmissionContentSchema,
});

const projects = defineCollection({
  loader: projectLoader(),
  schema: projectSchema,
});

const spellCategories = defineCollection({
  loader: glob({
    pattern: "categories.json",
    base: "./src/content/spell-categories",
  }),
  schema: spellCategorySchema,
});

const versions = defineCollection({
  loader: glob({ pattern: "versions.json", base: "./src/content/versions" }),
  schema: versionAvailabilitySchema,
});

const glyphs = defineCollection({
  loader: glyphLoader(),
});

const lang = defineCollection({
  loader: langLoader(),
});

const casterTomes = defineCollection({
  loader: casterTomeLoader(),
});

const book = defineCollection({
  loader: bookLoader(),
  schema: bookSchema,
});

export const collections = {
  docs,
  kubejs,
  spells,
  spellSubmissions,
  spellCategories,
  projects,
  versions,
  glyphs,
  lang,
  casterTomes,
  book,
};
