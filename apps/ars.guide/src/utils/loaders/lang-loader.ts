import type { Loader } from "astro/loaders";
import {
  fetchJson,
  fetchManifestFile,
  getAssetManifest,
  type LangManifest,
} from "./asset-manifest";

export function langLoader(locale = "en_us") {
  return {
    name: "lang-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const manifest = await getAssetManifest();
      const langManifest = await fetchManifestFile<LangManifest>(manifest.lang);
      const langPath = langManifest[locale];
      if (!langPath) {
        throw new Error(`Missing ${locale} in language manifest`);
      }

      const body = await fetchJson<Record<string, string>>(langPath);

      for (const [id, str] of Object.entries(body) as [string, string][]) {
        const data = await parseData({
          id,
          data: {
            value: str,
          },
        });
        store.set({
          id,
          data,
        });
      }
    },
  } satisfies Loader;
}
