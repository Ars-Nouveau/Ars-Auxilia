import { getCanonicalGlyph } from "@ars/addon-builder";
import pako from "pako";
import type { SpellColor, SpellSound } from "./spells.ts";

export type GlyphRegistryNames = Record<string, string>;
export type SpellParticleTimeline = Record<string, unknown>;
export type SpellSoundValue = string | SpellSound;

export type ParsedSpell = {
  name: string;
  glyphs: string[];
  color?: SpellColor | null;
  sound?: SpellSoundValue | null;
  particleTimeline?: SpellParticleTimeline | null;
};

const defaultColor: SpellColor = {
  id: "ars_nouveau:constant",
  r: 255,
  g: 255,
  b: 255,
};

const defaultSound: SpellSoundValue = {
  id: "ars_nouveau:fire_family",
  pitch: 1,
  volume: 1,
};

const getRegistryNameFromCollection = (
  glyph: string,
  glyphRegistryNames: GlyphRegistryNames,
): string => {
  const canonicalGlyph = getCanonicalGlyph(glyph) ?? glyph.trim().toLowerCase();
  const registryName = glyphRegistryNames[canonicalGlyph];

  if (!registryName) {
    throw new Error(`Unknown glyph: ${glyph}`);
  }

  return registryName;
};

const parseSpellObject = (parsed: unknown): ParsedSpell | null => {
  if (
    parsed == null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !("name" in parsed) ||
    typeof parsed.name !== "string" ||
    !("recipe" in parsed) ||
    !Array.isArray(parsed.recipe) ||
    !parsed.recipe.every((glyph) => typeof glyph === "string")
  ) {
    console.warn("Invalid spell JSON format.");
    return null;
  }

  const spell = parsed as {
    name: string;
    recipe: string[];
    color?: SpellColor | null;
    sound?: SpellSoundValue | null;
    particleTimeline?: SpellParticleTimeline | null;
  };

  return {
    name: spell.name,
    glyphs: spell.recipe,
    color: spell.color ?? null,
    sound: spell.sound ?? null,
    particleTimeline: spell.particleTimeline ?? null,
  };
};

export function parseJsonSpell(jsonStr: string): ParsedSpell | null {
  try {
    return parseSpellObject(JSON.parse(jsonStr));
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return null;
  }
}

export function exportToJson(
  name: string,
  glyphs: string[],
  glyphRegistryNames: GlyphRegistryNames,
  color: SpellColor = defaultColor,
  sound: SpellSoundValue = defaultSound,
  spellTimeline: SpellParticleTimeline = {},
): string {
  return JSON.stringify(
    {
      name,
      color,
      sound,
      recipe: glyphs.map((glyph) =>
        getRegistryNameFromCollection(glyph, glyphRegistryNames),
      ),
      particleTimeline: spellTimeline,
    },
    null,
    2,
  );
}

export function parseCompressedSpell(base64Str: string): ParsedSpell | null {
  try {
    const binary = Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0));
    const decompressed = pako.ungzip(binary, { to: "string" });
    return parseSpellObject(JSON.parse(decompressed));
  } catch (error) {
    console.error("Failed to parse compressed spell:", error);
    return null;
  }
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

export function exportCompressedSpell(
  name: string,
  recipe: string[],
  glyphRegistryNames: GlyphRegistryNames,
  color?: SpellColor,
  sound?: SpellSoundValue,
  particleTimeline: SpellParticleTimeline = {},
): string {
  const jsonStr = exportToJson(
    name,
    recipe,
    glyphRegistryNames,
    color,
    sound,
    particleTimeline,
  );
  const compressed = pako.gzip(jsonStr);
  return bytesToBase64(compressed);
}
