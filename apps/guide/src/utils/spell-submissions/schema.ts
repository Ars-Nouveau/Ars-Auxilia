import { getCanonicalGlyph, getNamespace } from "@ars/addon-builder";
import { z } from "zod";
import { getAddonFromNamespace } from "../spell-data/addons";
import type { Version } from "../versions";

const asNonEmptyStringTuple = (
  name: string,
  values: readonly string[],
): [string, ...string[]] => {
  if (values.length === 0) {
    throw new Error(`${name} must contain at least one value.`);
  }

  return values as [string, ...string[]];
};

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const jsonObjectFromText = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value?.trim()) return undefined;

    try {
      const parsed = JSON.parse(value);
      if (
        parsed == null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        ctx.addIssue({ code: "custom", message: "Expected a JSON object." });
        return z.NEVER;
      }
      return parsed as Record<string, unknown>;
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid JSON." });
      return z.NEVER;
    }
  });

export const spellColorSchema = z.object({
  id: z.string().min(1),
  r: z.number(),
  g: z.number(),
  b: z.number(),
});

const spellColorFromText = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value?.trim()) return undefined;

    try {
      return spellColorSchema.parse(JSON.parse(value));
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid spell color JSON." });
      return z.NEVER;
    }
  });

export const spellSoundSchema = z.union([
  z.string().min(1),
  z.object({
    id: z.string().min(1),
    pitch: z.number(),
    volume: z.number(),
  }),
]);

export const spellSoundFromText = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value?.trim()) return undefined;

    try {
      return spellSoundSchema.parse(JSON.parse(value));
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid spell sound JSON." });
      return z.NEVER;
    }
  });

export const createSpellSubmissionFormSchema = (
  categoryValues: readonly string[],
  allowedVersions: readonly Version[],
) =>
  z.object({
    spell: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(4000),
    glyphs: z
      .string()
      .trim()
      .min(1)
      .transform(splitCsv)
      .pipe(z.array(z.string().min(1)).min(1)),
    category: z.enum(asNonEmptyStringTuple("Categories", categoryValues)),
    versions: z
      .string()
      .trim()
      .min(1)
      .transform(splitCsv)
      .pipe(
        z
          .array(z.enum(asNonEmptyStringTuple("Versions", allowedVersions)))
          .min(1),
      ),
    style: jsonObjectFromText,
    spell_color: spellColorFromText,
    spell_sound: spellSoundFromText,
  });

export const spellSubmissionSpellSchema = z.object({
  glyphs: z.array(z.string().min(1)).min(1),
  description: z.string().min(1),
  spell_color: spellColorSchema.optional(),
  spell_sound: spellSoundSchema.optional(),
  style: z.record(z.string(), z.unknown()).optional(),
});

export const spellSubmissionContentSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  author: z.string().min(1),
  userId: z.string().min(1).optional(),
  versions: z.array(z.string().min(1)).min(1),
  spells: z.array(spellSubmissionSpellSchema).min(1),
});

export const createSpellSubmissionFileSchema = (
  categoryValues: readonly string[],
  allowedVersions: readonly Version[],
) =>
  spellSubmissionContentSchema.extend({
    category: z.enum(asNonEmptyStringTuple("Categories", categoryValues)),
    versions: z
      .array(z.enum(asNonEmptyStringTuple("Versions", allowedVersions)))
      .min(1),
  });

export type SpellSubmissionForm = z.infer<
  ReturnType<typeof createSpellSubmissionFormSchema>
>;
export type SpellSubmissionFile = z.infer<typeof spellSubmissionContentSchema>;

export type SubmitterIdentity = {
  displayName: string;
  userId?: string;
};

export const readSpellSubmissionFormData = (
  formData: FormData,
  categoryValues: readonly string[],
  allowedVersions: readonly Version[],
) =>
  createSpellSubmissionFormSchema(categoryValues, allowedVersions).parse({
    spell: formData.get("spell"),
    description: formData.get("description"),
    glyphs: formData.get("glyphs"),
    category: formData.get("category"),
    versions: formData.get("versions"),
    style: formData.get("style") || undefined,
    spell_color: formData.get("spell_color") || undefined,
    spell_sound: formData.get("spell_sound") || undefined,
  });

export const deriveAddonsFromGlyphs = (glyphs: string[]) =>
  Array.from(
    new Set(
      glyphs
        .map((glyph) => getAddonFromNamespace(getNamespace(glyph)))
        .filter((addon): addon is string => Boolean(addon)),
    ),
  ).sort((a, b) => a.localeCompare(b));

export const deriveAddonsFromSpells = (
  spells: Pick<z.infer<typeof spellSubmissionSpellSchema>, "glyphs">[],
) => deriveAddonsFromGlyphs(spells.flatMap((spell) => spell.glyphs));

export const canonicalizeGlyphs = (
  glyphs: string[],
  availableGlyphs: Set<string>,
) => {
  const unknownGlyphs: string[] = [];
  const canonicalGlyphs = glyphs.map((glyph) => {
    const canonical = getCanonicalGlyph(glyph) ?? glyph.trim().toLowerCase();
    if (!availableGlyphs.has(canonical)) unknownGlyphs.push(glyph);
    return canonical;
  });

  if (unknownGlyphs.length > 0) {
    throw new Error(`Unknown glyphs: ${unknownGlyphs.join(", ")}`);
  }

  return canonicalGlyphs;
};

export const createSpellSubmissionFile = ({
  form,
  submitter,
  availableGlyphs,
  categoryValues,
  allowedVersions,
}: {
  form: SpellSubmissionForm;
  submitter: SubmitterIdentity;
  availableGlyphs: Set<string>;
  categoryValues: readonly string[];
  allowedVersions: readonly Version[];
}) => {
  const glyphs = canonicalizeGlyphs(form.glyphs, availableGlyphs);
  const spell = {
    glyphs,
    description: form.description,
    ...(form.spell_color ? { spell_color: form.spell_color } : {}),
    ...(form.spell_sound ? { spell_sound: form.spell_sound } : {}),
    ...(form.style ? { style: form.style } : {}),
  };

  return createSpellSubmissionFileSchema(categoryValues, allowedVersions).parse(
    {
      name: form.spell,
      category: form.category,
      author: submitter.displayName,
      ...(submitter.userId ? { userId: submitter.userId } : {}),
      versions: form.versions,
      spells: [spell],
    },
  );
};
