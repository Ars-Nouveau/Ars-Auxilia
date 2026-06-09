import { env } from "cloudflare:workers";
import type { Loader } from "astro/loaders";

const TOME_PREFIX = "recipes/ars_nouveau/tomes/";

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

const getTomeId = (key: string) =>
  key
    .split("/")
    .pop()
    ?.replace(/\.json$/, "") ?? key;

export function casterTomeLoader() {
  return {
    name: "caster-tome-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const listed = await env.GEN_ASSETS.list({ prefix: TOME_PREFIX });
      const keys = listed.objects
        .map((obj) => obj.key)
        .filter((key) => key.endsWith(".json"));

      for (const key of keys) {
        const object = await env.GEN_ASSETS.get(key);
        if (!object) {
          console.warn(`${key} not found in R2`);
          continue;
        }

        const tome = (await object.json()) as CasterTome;
        if (tome.name.length <= 0) {
          console.warn(`${key} has a 0-length name`);
          continue;
        }

        const id = getTomeId(key);
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
