import type { Loader } from "astro/loaders";
import {
  fetchJson,
  fetchManifestFile,
  getAssetManifest,
  mapConcurrent,
} from "./asset-manifest";

export interface CasterTome {
  type: string;
  name: string;
  flavour_text: string;
  spell: string[];
  sound?: {
    sound?: {
      id: string;
    };
  };
  color: {
    r: number;
    g: number;
    b: number;
    id: string;
  };
}

const getTomeId = (path: string) =>
  path
    .split("/")
    .pop()
    ?.replace(/\.json$/, "") ?? path;

export function casterTomeLoader() {
  return {
    name: "caster-tome-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const manifest = await getAssetManifest();
      const tomePaths = await fetchManifestFile<string[]>(manifest.tomes);
      const tomes = await mapConcurrent(tomePaths, 8, async (tomePath) => ({
        path: tomePath,
        tome: await fetchJson<CasterTome>(tomePath),
      }));

      for (const { path, tome } of tomes) {
        if (tome.name.length <= 0) {
          console.warn(`${path} has a 0-length name`);
          continue;
        }

        const id = getTomeId(path);
        const data = await parseData({
          id,
          data: tome as unknown as Record<string, unknown>,
        });
        store.set({
          id,
          data,
        });
      }
    },
  } satisfies Loader;
}
