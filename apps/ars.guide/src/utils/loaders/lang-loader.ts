import { getLangUrl } from "@ars/addon-builder";
import type { Loader } from "astro/loaders";

export function langLoader() {
  return {
    name: "lang-loader",
    load: async ({ store, parseData }) => {
      const res = await fetch(getLangUrl());
      const body = (await res.json()) as Record<string, string>;

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
