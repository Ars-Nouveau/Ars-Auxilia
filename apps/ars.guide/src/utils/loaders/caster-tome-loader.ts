import type { Loader } from "astro/loaders";
import { getEnv } from "../server/env";
import { createGitHubApp } from "../server/github-app";

const JS_DELIVR_URL =
  "https://cdn.jsdelivr.net/gh/baileyholl/ars-nouveau@main/";
const TOME_OWNER = "baileyholl";
const TOME_REPO = "Ars-Nouveau";
const TOME_PATH =
  "src/generated/resources/data/ars_nouveau/recipe/tomes";

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
  const env = getEnv();
  const app = createGitHubApp(env);

  const { data } = await app.octokit.rest.repos.getContent({
    owner: TOME_OWNER,
    repo: TOME_REPO,
    path: TOME_PATH,
  });

  if (!Array.isArray(data)) {
    throw new Error(
      "Failed to fetch caster tome list: GitHub API response was not an array.",
    );
  }

  return data.filter((entry) => entry.path.endsWith(".json"));
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
