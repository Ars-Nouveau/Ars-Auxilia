import type { Version } from "./versions";

export const getOgPath = (
  version: Version,
  collection: string,
  slug: string,
) => {
  const safeVersion = `v${version.replaceAll(".", "-")}`;
  return [safeVersion, collection, slug].filter(Boolean).join("/");
};
