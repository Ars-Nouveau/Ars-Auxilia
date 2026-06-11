import type { Loader } from "astro/loaders";
import {
  fetchJson,
  fetchManifestFile,
  getAssetManifest,
  mapConcurrent,
} from "./asset-manifest";

interface RawProject {
  mod_id: string;
  display_name: string;
  color: string;
  disabled: boolean;
  cf_id?: number;
  dependencies?: { cf_id: number; name: string }[];
}

export function projectLoader() {
  return {
    name: "project-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const manifest = await getAssetManifest();
      const projectPaths = await fetchManifestFile<string[]>(manifest.projects);
      const projects = await mapConcurrent(projectPaths, 8, (path) =>
        fetchJson<RawProject>(path),
      );

      for (const raw of projects) {
        if (raw.disabled || raw.cf_id == null || raw.dependencies == null) {
          continue;
        }

        const id = raw.mod_id;
        const data = await parseData({
          id,
          data: {
            mod_id: raw.mod_id,
            display_name: raw.display_name,
            color: raw.color,
            cf_id: raw.cf_id,
            dependencies: raw.dependencies,
          },
        });

        store.set({ id, data });
      }
    },
  } satisfies Loader;
}
