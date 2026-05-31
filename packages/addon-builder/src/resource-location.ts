export interface ResourceLocation {
  namespace: string;
  path: string;
  key: string;
}

export const parseResourceLocation = (
  location: string,
  fallbackNamespace = location,
): ResourceLocation => {
  const separatorIndex = location.indexOf(":");
  const namespace =
    separatorIndex >= 0 ? location.slice(0, separatorIndex) : fallbackNamespace;
  const path =
    separatorIndex >= 0 ? location.slice(separatorIndex + 1) : location;

  return {
    namespace,
    path,
    key: `${namespace}:${path}`,
  };
};

export const getNamespace = (location: string, fallback = location) =>
  parseResourceLocation(location, fallback).namespace;

export const getPath = (location: string) =>
  parseResourceLocation(location).path;

export const stripGlyphPrefix = (value: string) => value.replace(/^glyph_/, "");
