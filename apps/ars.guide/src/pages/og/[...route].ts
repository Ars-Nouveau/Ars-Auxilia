import { getCollection } from "astro:content";
import { getItemRenderUrl } from "@ars/addon-builder";
import type { APIRoute, GetStaticPaths } from "astro";
import { getBookCategories, getBookEntries } from "../../utils/book";
import { getOgPath } from "../../utils/og";
import {
  createOgImageResponse,
  type OgPage,
} from "../../utils/og-image-response";
import {
  type GenericCollectionEntry,
  getPublicSlug,
  getVersionFromEntry,
} from "../../utils/sidebar";

export const prerender = true;

const collectionLabel: Record<string, string> = {
  docs: "Docs",
  kubejs: "KubeJS",
  spells: "Spells",
};

const getCoverPage = (): [string, OgPage] => ["cover.png", { style: "cover" }];

const getCollectionPages = async (): Promise<[string, OgPage][]> => {
  const [docs, kubejs, spells] = await Promise.all([
    getCollection("docs"),
    getCollection("kubejs"),
    getCollection("spells"),
  ]);

  const entries: GenericCollectionEntry[] = [...docs, ...kubejs, ...spells].filter(
    (entry) => entry.data.description?.trim() && entry.body?.trim(),
  );

  return entries.map((entry) => {
    const slug = getPublicSlug(entry);
    const route =
      entry.collection === "spells"
        ? [entry.collection, slug].filter(Boolean).join("/")
        : getOgPath(getVersionFromEntry(entry), entry.collection, slug);

    const page: OgPage = {
      style: "content",
      title: entry.data.title,
      description: entry.data.description,
      label: collectionLabel[entry.collection] ?? "Docs",
    };

    return [`${route}.png`, page];
  });
};

const getBookPages = async (): Promise<[string, OgPage][]> => {
  const [bookEntries, bookCategories] = await Promise.all([
    getBookEntries(),
    getBookCategories(),
  ]);

  const categoryById = new Map(bookCategories.map((cat) => [cat.data.id, cat]));

  const entryPages: [string, OgPage][] = bookEntries.map((entry) => [
    `book/${entry.data.slug}.png`,
    {
      style: "content",
      title: entry.data.title,
      label: "Book",
      iconUrl: entry.data.iconUrl ?? getItemRenderUrl(entry.data.icon),
      chapter: categoryById.get(entry.data.category)?.data.title,
    },
  ]);

  const categoryPages: [string, OgPage][] = bookCategories
    .filter((category) => category.data.parents.length > 0)
    .map((category) => [
      `book/${category.data.slug}.png`,
      { style: "content", title: category.data.title, label: "Book" },
    ]);

  return [...entryPages, ...categoryPages];
};

const getPages = async (): Promise<Record<string, OgPage>> => {
  const [collectionPages, bookPages] = await Promise.all([
    getCollectionPages(),
    getBookPages(),
  ]);
  return Object.fromEntries([getCoverPage(), ...collectionPages, ...bookPages]);
};

export const getStaticPaths: GetStaticPaths = async () =>
  Object.entries(await getPages()).map(([route, page]) => ({
    params: { route },
    props: { page },
  }));

export const GET: APIRoute = ({ props }) => createOgImageResponse(props.page);
