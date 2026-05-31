import type { GenericCollectionEntry } from "./sidebar";
import { getPublicSlug, getVersionFromEntry } from "./sidebar";

interface Path {
  collection: string;
  entry: GenericCollectionEntry;
}

export const getVersionedPath = ({ collection, entry }: Path) => {
  const version = getVersionFromEntry(entry);
  const slug = getPublicSlug(entry);

  return {
    params: {
      version,
      collection,
      slug: slug || undefined,
    },
    props: {
      entry,
    },
  };
};
