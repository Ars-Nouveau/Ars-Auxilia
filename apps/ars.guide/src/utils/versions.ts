import { getEntry } from "astro:content";

export type Version = string;
export type VersionedCollection = "docs" | "kubejs";
export type VersionAvailability = Record<VersionedCollection, boolean>;
export type VersionAvailabilityMap = Record<string, VersionAvailability>;

export const versionedCollections = [
  "docs",
  "kubejs",
] as const satisfies readonly VersionedCollection[];

const compareVersions = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export const getVersionAvailabilityMap =
  async (): Promise<VersionAvailabilityMap> => {
    const entry = await getEntry("versions", "versions");
    return entry?.data ?? {};
  };

export const getVersions = async () =>
  Object.keys(await getVersionAvailabilityMap()).toSorted(compareVersions);

export const getLatestVersion = async (): Promise<Version> => {
  const versions = await getVersions();
  const latest = versions.at(-1);
  if (!latest) throw new Error("No supported versions configured.");
  return latest;
};

export const getCollectionVersions = async (collection: VersionedCollection) =>
  Object.entries(await getVersionAvailabilityMap())
    .filter(([, availability]) => availability[collection])
    .map(([version]) => version)
    .toSorted(compareVersions);

export const isVersion = async (value: string | undefined): Promise<boolean> =>
  Boolean(value && (await getVersions()).includes(value));

export const isVersionSegment = (value: string | undefined): value is Version =>
  Boolean(value && /^\d+\.\d+\.\d+$/.test(value));

export const isVersionedCollection = (
  value: string | undefined,
): value is VersionedCollection =>
  versionedCollections.includes(value as VersionedCollection);
