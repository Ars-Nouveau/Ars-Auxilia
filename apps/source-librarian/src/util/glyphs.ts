import { getGlyphsUrl, getLangUrl } from "@ars/addon-builder";
import type { ExportedGlyph } from "@ars/types";
import Fuse from "fuse.js";
import Keyv from "keyv";
import pMemoize from "p-memoize";

const cache = new Keyv<Record<string, unknown>>({ ttl: 3_600_000 });

export async function getGlyphs(): Promise<Record<string, ExportedGlyph>> {
  const cached = await cache.get("glyphs");
  if (cached) return cached as Record<string, ExportedGlyph>;

  const res = await fetch(getGlyphsUrl());
  const data = await res.json() as Record<string, ExportedGlyph>;
  await cache.set("glyphs", data);
  return data;
}

export async function getLang(): Promise<Record<string, string>> {
  const cached = await cache.get("lang");
  if (cached) return cached as Record<string, string>;

  const res = await fetch(getLangUrl());
  const data = await res.json() as Record<string, string>;
  await cache.set("lang", data);
  return data;
}

const buildFuseIndex = pMemoize(
  async (glyphs: Record<string, ExportedGlyph>) => {
    const entries = Object.entries(glyphs) as [string, ExportedGlyph][];
    return { entries, fuse: new Fuse(entries, { keys: ["1.name", "0"], threshold: 0.4 }) };
  }
);

export async function searchGlyphs(
  query: string,
  limit = 25,
): Promise<[string, ExportedGlyph][]> {
  const glyphs = await getGlyphs();
  const { entries, fuse } = await buildFuseIndex(glyphs);

  if (!query) return entries.slice(0, limit);
  return fuse.search(query, { limit }).map((r) => r.item);
}
