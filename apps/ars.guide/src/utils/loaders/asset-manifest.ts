import { getAssetManifestUrl, getOutputUrl } from "@ars/addon-builder";
import pMemoize from "p-memoize";

export interface AssetManifest {
  version: number;
  generatedAt: string;
  book: string;
  projects: string;
  recipes: string;
  renders: string;
  tags: string;
  glyphs: string;
  lang: string;
  tomes: string;
}

export type BookManifest = {
  categories: string[];
  entries: string[];
};

export type RecipeManifest = Record<string, string>;

export type RenderManifest = {
  entity?: Record<string, string>;
  item?: Record<string, string>;
};

export type TagsManifest = Record<string, Record<string, string>>;
export type LangManifest = Record<string, string>;

export const fetchJson = async <T>(pathOrUrl: string): Promise<T> => {
  const url = /^https?:\/\//.test(pathOrUrl)
    ? pathOrUrl
    : getOutputUrl(pathOrUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
};

export const getAssetManifest = pMemoize(() =>
  fetchJson<AssetManifest>(getAssetManifestUrl()),
);

export const fetchManifestFile = async <T>(path: string): Promise<T> =>
  fetchJson<T>(path);

export const mapConcurrent = async <Input, Output>(
  inputs: readonly Input[],
  concurrency: number,
  mapper: (input: Input) => Promise<Output>,
): Promise<Output[]> => {
  const results = new Array<Output>(inputs.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, inputs.length) },
    async () => {
      while (nextIndex < inputs.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await mapper(inputs[index] as Input);
      }
    },
  );

  await Promise.all(workers);
  return results;
};
