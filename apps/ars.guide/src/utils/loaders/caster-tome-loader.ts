import type { Loader } from "astro/loaders";

const JS_DELIVR_URL =
  "https://cdn.jsdelivr.net/gh/baileyholl/ars-nouveau@main/";
const TOME_DIRECTORY_URL =
  "https://api.github.com/repos/baileyholl/Ars-Nouveau/contents/src/generated/resources/data/ars_nouveau/recipe/tomes/";

interface TomeListEntry {
  path: string;
}

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

const fetchTomeList = async () => {
  const response = await fetch(TOME_DIRECTORY_URL, {
    headers: {
      Accept: "application/vnd.github.text-match+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch caster tome list: ${response.status} ${response.statusText}`,
    );
  }

  const body = await response.json();

  if (!Array.isArray(body)) {
    throw new Error(
      "Failed to fetch caster tome list: GitHub API response was not an array.",
    );
  }

  return (body as TomeListEntry[]).filter((tome) =>
    tome.path.endsWith(".json"),
  );
};

const fetchTome = async (path: string) => {
  const response = await fetch(`${JS_DELIVR_URL}${path}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch caster tome ${path}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<CasterTome>;
};

export function casterTomeLoader() {
  return {
    name: "caster-tome-loader",
    load: async ({ store, parseData }) => {
      store.clear();
      const tomeList = await fetchTomeList();

      for (const tomeEntry of tomeList) {
        const tome = await fetchTome(tomeEntry.path);
        if (tome.name.length <= 0) {
          console.warn(`${tomeEntry.path} has a 0-length name`);
          continue;
        }

        const id = getTomeId(tomeEntry.path);
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
