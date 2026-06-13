import type { ExportedGlyph } from "@ars/types";
import type { Loader } from "astro/loaders";
import { fetchManifestFile, getAssetManifest } from "./asset-manifest";

export function glyphLoader() {
  return {
    name: "glyph-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const manifest = await getAssetManifest();
      const body = await fetchManifestFile<Record<string, ExportedGlyph>>(
        manifest.glyphs,
      );

      for (const [key, glyph] of Object.entries(body) as [
        string,
        ExportedGlyph,
      ][]) {
        const id = key.replace("glyph_", "");
        const data = await parseData({
          id,
          data: glyph,
        });
        store.set({
          id,
          data,
        });
      }
    },
  } satisfies Loader;
}
