import {
  getItemRenderUrl,
  getNamespace,
  getPath,
  type ItemRenderLocation,
  stripGlyphPrefix,
} from "@ars/addon-builder";
import type { Loader } from "astro/loaders";
import {
  type BookManifest,
  fetchJson,
  fetchManifestFile,
  getAssetManifest,
  mapConcurrent,
  type RecipeManifest,
  type RenderManifest,
  type TagsManifest,
} from "./asset-manifest";

interface RawBookCategory {
  id: string;
  order?: number;
  parents?: string[];
  sub_categories?: string[];
  title: string;
}

interface RawBookEntry {
  id: string;
  order?: number;
  icon?: string;
  title: string;
  category: string;
  pages?: Record<string, unknown>[];
}

interface LoadedBookFile<T> {
  path: string;
  namespace: string;
  sourcePath: string;
  data: T;
}

const BOOK_PATH_PATTERN = /^wiki\/([^/]+)\/(categories|entries)\/(.+)\.json$/;

const slugifyId = (id: string) => stripGlyphPrefix(getPath(id));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeTagId = (tag: string) => tag.replace(/^#/, "");

const getBookPathInfo = (
  path: string,
  expectedKind: "categories" | "entries",
) => {
  const match = path.match(BOOK_PATH_PATTERN);
  if (!match) {
    throw new Error(`Unexpected book path in manifest: ${path}`);
  }

  const [, namespace, kind] = match as [string, string, string, string];
  if (kind !== expectedKind) {
    throw new Error(`Expected ${expectedKind} book path, got ${path}`);
  }

  return {
    namespace,
    sourcePath: path.replace(/^wiki\//, ""),
  };
};

const getItemRenderLocationsFromManifest = (manifest: RenderManifest) =>
  new Map<string, ItemRenderLocation>(Object.entries(manifest.item ?? {}));

const collectTags = (value: unknown, tags = new Set<string>()) => {
  if (Array.isArray(value)) {
    for (const item of value) collectTags(item, tags);
    return tags;
  }

  if (!isRecord(value)) return tags;

  const tag = typeof value.tag === "string" ? value.tag : undefined;
  if (tag) tags.add(normalizeTagId(tag));

  for (const child of Object.values(value)) collectTags(child, tags);
  return tags;
};

const withRecipeIconUrls = (
  value: unknown,
  renderLocations: ReadonlyMap<string, ItemRenderLocation>,
  tagsById: Map<string, string[]>,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      withRecipeIconUrls(item, renderLocations, tagsById),
    );
  }

  if (!isRecord(value)) return value;

  const item = typeof value.item === "string" ? value.item : undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const tag =
    typeof value.tag === "string" ? normalizeTagId(value.tag) : undefined;
  const mapped = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      withRecipeIconUrls(child, renderLocations, tagsById),
    ]),
  );
  const iconItem = item ?? id;

  const tagItems =
    tag && !iconItem
      ? (tagsById.get(tag) ?? []).map((tagItem) => ({
          item: tagItem,
          iconUrl: getItemRenderUrl(tagItem, renderLocations),
        }))
      : undefined;

  return {
    ...mapped,
    ...(iconItem
      ? { iconUrl: getItemRenderUrl(iconItem, renderLocations) }
      : {}),
    ...(tagItems && tagItems.length > 0 ? { tagItems } : {}),
  };
};

const getRecipeKeys = (page: Record<string, unknown>) =>
  Object.keys(page)
    .filter((key) => /^recipe_\d+$/.test(key))
    .sort(
      (a, b) =>
        Number(a.replace("recipe_", "")) - Number(b.replace("recipe_", "")),
    );

const getRecipeIds = (pages: Record<string, unknown>[]) =>
  pages.flatMap((page) =>
    getRecipeKeys(page)
      .map((key) =>
        typeof page[key] === "string" ? String(page[key]) : undefined,
      )
      .filter((id): id is string => id !== undefined),
  );

const withPageIconUrls = (
  pages: Record<string, unknown>[],
  renderLocations: ReadonlyMap<string, ItemRenderLocation>,
  recipesById: Map<string, unknown>,
) =>
  pages.map((page) => {
    const icon = typeof page.icon === "string" ? page.icon : undefined;
    const recipeData = getRecipeKeys(page)
      .map((key) =>
        typeof page[key] === "string" ? String(page[key]) : undefined,
      )
      .filter((id): id is string => id !== undefined)
      .map((id) => ({ id, recipe: recipesById.get(id) }));
    const itemEntries = Object.fromEntries(
      Object.entries(page)
        .filter(
          ([key, value]) =>
            /^item\d+$/.test(key) &&
            isRecord(value) &&
            typeof value.item === "string",
        )
        .map(([key, value]) => {
          const item = value as Record<string, unknown> & { item: string };
          return [
            key,
            {
              ...item,
              iconUrl: getItemRenderUrl(item.item, renderLocations),
            },
          ];
        }),
    );

    return {
      ...page,
      ...itemEntries,
      ...(recipeData.length > 0 ? { recipeData } : {}),
      ...(icon ? { iconUrl: getItemRenderUrl(icon, renderLocations) } : {}),
    };
  });

const fetchKnownJson = async <T>(
  id: string,
  manifest: Record<string, string>,
  kind: string,
): Promise<[string, T] | undefined> => {
  const path = manifest[id];
  if (!path) {
    console.warn(`Missing ${kind} in manifest: ${id}`);
    return undefined;
  }

  return [id, await fetchJson<T>(path)];
};

export function bookLoader() {
  return {
    name: "book-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const manifest = await getAssetManifest();
      const [bookManifest, recipeManifest, renderManifest, tagsManifest] =
        await Promise.all([
          fetchManifestFile<BookManifest>(manifest.book),
          fetchManifestFile<RecipeManifest>(manifest.recipes),
          fetchManifestFile<RenderManifest>(manifest.renders),
          fetchManifestFile<TagsManifest>(manifest.tags),
        ]);

      const renderLocations =
        getItemRenderLocationsFromManifest(renderManifest);
      const [categoryFiles, entryFiles] = await Promise.all([
        mapConcurrent(bookManifest.categories, 12, async (path) => {
          const info = getBookPathInfo(path, "categories");
          return {
            path,
            ...info,
            data: await fetchJson<RawBookCategory>(path),
          } satisfies LoadedBookFile<RawBookCategory>;
        }),
        mapConcurrent(bookManifest.entries, 12, async (path) => {
          const info = getBookPathInfo(path, "entries");
          return {
            path,
            ...info,
            data: await fetchJson<RawBookEntry>(path),
          } satisfies LoadedBookFile<RawBookEntry>;
        }),
      ]);

      const recipeIds = Array.from(
        new Set(
          entryFiles.flatMap(({ data }) => getRecipeIds(data.pages ?? [])),
        ),
      );
      const recipeEntries = (
        await mapConcurrent(recipeIds, 12, (id) =>
          fetchKnownJson<unknown>(id, recipeManifest, "recipe"),
        )
      ).filter((entry): entry is [string, unknown] => entry !== undefined);
      const rawRecipesById = new Map(recipeEntries);

      const tagManifest = tagsManifest.item ?? {};
      const tagIds = Array.from(
        new Set(
          recipeEntries.flatMap(([, recipe]) =>
            Array.from(collectTags(recipe)),
          ),
        ),
      );
      const tagEntries = (
        await mapConcurrent(tagIds, 12, (id) =>
          fetchKnownJson<string[]>(id, tagManifest, "item tag"),
        )
      ).filter((entry): entry is [string, string[]] => entry !== undefined);
      const tagsById = new Map(tagEntries);
      const recipesById = new Map(
        Array.from(rawRecipesById, ([id, recipe]) => [
          id,
          withRecipeIconUrls(recipe, renderLocations, tagsById),
        ]),
      );

      for (const {
        data: category,
        namespace: defaultNamespace,
        sourcePath,
      } of categoryFiles) {
        const namespace = getNamespace(category.id, defaultNamespace);
        const slug = slugifyId(category.id);
        const id = `category/${namespace}/${slug}`;
        const data = await parseData({
          id,
          data: {
            type: "category",
            id: category.id,
            namespace,
            slug,
            title: category.title,
            order: category.order ?? 0,
            parents: category.parents ?? [],
            subCategories: category.sub_categories ?? [],
            sourcePath,
          },
        });

        store.set({ id, data });
      }

      for (const {
        data: bookEntry,
        namespace: defaultNamespace,
        sourcePath,
      } of entryFiles) {
        const namespace = getNamespace(bookEntry.id, defaultNamespace);
        const entrySlug = slugifyId(bookEntry.id);
        const iconUrl = getItemRenderUrl(bookEntry.icon, renderLocations);
        const categorySlug = slugifyId(bookEntry.category);
        const id = `entry/${namespace}/${entrySlug}`;
        const data = await parseData({
          id,
          data: {
            type: "entry",
            id: bookEntry.id,
            namespace,
            slug: `${categorySlug}/${entrySlug}`,
            entrySlug,
            category: bookEntry.category,
            categorySlug,
            title: bookEntry.title,
            order: bookEntry.order ?? 0,
            icon: bookEntry.icon,
            iconUrl,
            pages: withPageIconUrls(
              bookEntry.pages ?? [],
              renderLocations,
              recipesById,
            ),
            sourcePath,
          },
        });

        store.set({ id, data });
      }
    },
  } satisfies Loader;
}
