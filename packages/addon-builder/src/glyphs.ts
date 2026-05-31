import { parseResourceLocation, stripGlyphPrefix } from "./resource-location";
import type { GlyphAsset, Options } from "./types";
import { getRenderBaseUrl } from "./urls";

export const getCanonicalGlyph = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized.includes(":")) return undefined;

  const { namespace, path } = parseResourceLocation(normalized);
  return `${namespace}:${stripGlyphPrefix(path)}`;
};

export const getGlyphRenderUrl = (glyph: GlyphAsset, options?: Options) => {
  const { namespace, path } = parseResourceLocation(glyph.registryName);
  const extension = glyph.animated ? "webp" : "png";

  return `${getRenderBaseUrl("item", options)}/${namespace}/${path}.${extension}`;
};
