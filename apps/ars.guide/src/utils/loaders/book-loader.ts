import {
  getArchiveUrl,
  getItemRenderExtensions,
  getItemRenderUrl,
  getNamespace,
  getPath,
  stripGlyphPrefix,
  type ItemRenderExtension,
} from "@ars/addon-builder";
import type { Loader } from "astro/loaders";
import { fromBuffer, type Entry, type ZipFile } from "yauzl";

const WIKI_PATH_MARKER = "/output/wiki/";
const DATA_RECIPE_PATH_PATTERN = /\/output\/data\/([^/]+)\/recipe\/(.+)\.json$/;

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

interface LoadedZipEntry {
  pathName: string;
  contents?: Buffer;
}

const textDecoder = new TextDecoder();

const slugifyId = (id: string) => stripGlyphPrefix(getPath(id));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const withRecipeIconUrls = (
  value: unknown,
  renderExtensions: Map<string, ItemRenderExtension>,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => withRecipeIconUrls(item, renderExtensions));
  }

  if (!isRecord(value)) return value;

  const item = typeof value.item === "string" ? value.item : undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const mapped = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      withRecipeIconUrls(child, renderExtensions),
    ]),
  );
  const iconItem = item ?? id;

  return {
    ...mapped,
    ...(iconItem
      ? { iconUrl: getItemRenderUrl(iconItem, renderExtensions) }
      : {}),
  };
};

const getRecipeKeys = (page: Record<string, unknown>) =>
  Object.keys(page)
    .filter((key) => /^recipe_\d+$/.test(key))
    .sort(
      (a, b) =>
        Number(a.replace("recipe_", "")) - Number(b.replace("recipe_", "")),
    );

const withPageIconUrls = (
  pages: Record<string, unknown>[],
  renderExtensions: Map<string, ItemRenderExtension>,
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
              iconUrl: getItemRenderUrl(item.item, renderExtensions),
            },
          ];
        }),
    );

    return {
      ...page,
      ...itemEntries,
      ...(recipeData.length > 0 ? { recipeData } : {}),
      ...(icon ? { iconUrl: getItemRenderUrl(icon, renderExtensions) } : {}),
    };
  });

const getWikiInfo = (pathName: string) => {
  const markerIndex = pathName.indexOf(WIKI_PATH_MARKER);
  if (markerIndex < 0 || !pathName.endsWith(".json")) return null;

  const wikiPath = pathName.slice(markerIndex + WIKI_PATH_MARKER.length);
  const parts = wikiPath.split("/");
  if (parts.length !== 3) return null;

  const [namespace, kind] = parts;
  if (kind !== "categories" && kind !== "entries") return null;

  return {
    namespace,
    kind,
    wikiPath,
  };
};

const getRecipeInfo = (pathName: string) => {
  const match = pathName.match(DATA_RECIPE_PATH_PATTERN);
  if (!match) return null;

  const [, namespace, recipePath] = match as [string, string, string];
  return {
    namespace,
    recipePath,
    id: `${namespace}:${recipePath}`,
  };
};

const openZip = (buffer: Buffer) =>
  new Promise<ZipFile>((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true }, (error, zipFile) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(zipFile);
    });
  });

const readEntryContents = (zipFile: ZipFile, entry: Entry) =>
  new Promise<Buffer>((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.once("error", reject);
      stream.once("end", () => resolve(Buffer.concat(chunks)));
    });
  });

const readZipEntries = async (buffer: Buffer) => {
  const zipFile = await openZip(buffer);
  const entries: LoadedZipEntry[] = [];

  return new Promise<LoadedZipEntry[]>((resolve, reject) => {
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      zipFile.close();
      reject(error);
    };

    const continueReading = () => zipFile.readEntry();

    zipFile.once("error", fail);
    zipFile.once("end", () => {
      if (settled) return;
      settled = true;
      resolve(entries);
    });

    zipFile.on("entry", (entry: Entry) => {
      const pathName = entry.fileName;
      const shouldReadContents =
        getWikiInfo(pathName) !== null || getRecipeInfo(pathName) !== null;

      if (pathName.endsWith("/") || !shouldReadContents) {
        entries.push({ pathName });
        continueReading();
        return;
      }

      readEntryContents(zipFile, entry)
        .then((contents) => {
          entries.push({ pathName, contents });
          continueReading();
        })
        .catch(fail);
    });

    continueReading();
  });
};

const fetchZip = async () => {
  const response = await fetch(getArchiveUrl(), {
    headers: {
      Accept: "application/zip, application/octet-stream",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ArsAddonBuilder zip: ${response.status} ${response.statusText}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
};

export function bookLoader() {
  return {
    name: "book-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const zipBuffer = await fetchZip();
      const zipEntries = await readZipEntries(zipBuffer);
      const renderExtensions = getItemRenderExtensions(
        zipEntries.map((entry) => entry.pathName),
      );
      const recipeEntries = zipEntries
        .map((entry) => ({
          ...entry,
          info: getRecipeInfo(entry.pathName),
        }))
        .filter(
          (
            entry,
          ): entry is LoadedZipEntry & {
            contents: Buffer;
            info: NonNullable<ReturnType<typeof getRecipeInfo>>;
          } => entry.info !== null && entry.contents !== undefined,
        );
      const recipesById = new Map(
        recipeEntries.map(({ contents, info }) => [
          info.id,
          withRecipeIconUrls(
            JSON.parse(textDecoder.decode(contents)),
            renderExtensions,
          ),
        ]),
      );
      const wikiEntries = zipEntries
        .map((entry) => ({
          ...entry,
          info: getWikiInfo(entry.pathName),
        }))
        .filter(
          (
            entry,
          ): entry is LoadedZipEntry & {
            contents: Buffer;
            info: NonNullable<ReturnType<typeof getWikiInfo>>;
          } => entry.info !== null && entry.contents !== undefined,
        );

      for (const { contents, info } of wikiEntries) {
        const raw = JSON.parse(textDecoder.decode(contents)) as
          | RawBookCategory
          | RawBookEntry;
        const namespace = getNamespace(raw.id, info.namespace);

        if (info.kind === "categories") {
          const category = raw as RawBookCategory;
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
              sourcePath: info.wikiPath,
            },
          });

          store.set({ id, data });
          continue;
        }

        const bookEntry = raw as RawBookEntry;
        const entrySlug = slugifyId(bookEntry.id);
        const iconUrl = getItemRenderUrl(bookEntry.icon, renderExtensions);
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
              renderExtensions,
              recipesById,
            ),
            sourcePath: info.wikiPath,
          },
        });

        store.set({ id, data });
      }
    },
  } satisfies Loader;
}
