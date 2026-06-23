import Keyv from "keyv";

const CURSEFORGE_API = "https://api.curseforge.com/v1";
const REQUEST_TIMEOUT_MS = 5_000;

interface CurseForgeLinks {
  websiteUrl: string;
  issuesUrl: string | null;
  sourceUrl: string | null;
}

interface CurseForgeAuthor {
  name: string;
}

interface CurseForgeLogo {
  url: string;
}

interface LatestFilesIndex {
  gameVersion: string;
  fileId: number;
  releaseType: number;
}

interface CurseForgeData {
  name: string;
  summary: string;
  links: CurseForgeLinks;
  downloadCount: number;
  authors: CurseForgeAuthor[];
  logo: CurseForgeLogo | null;
  dateReleased: string;
  latestFilesIndexes: LatestFilesIndex[];
}

interface CurseForgeRoot {
  data: CurseForgeData;
}

export interface ModVersion {
  name: string;
  link: string;
}

export interface Mod {
  name: string;
  link: string;
  summary: string;
  author: string;
  logo: string | null;
  versions: ModVersion[];
  last_updated: Date;
  download_count: number;
  issues: string | null;
  source: string | null;
}

const RELEASE_TYPE_SUFFIX = ["", " (Beta)", " (Alpha)"];

function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;
  for (const item of items) {
    (groups[key(item)] ??= []).push(item);
  }
  return groups;
}

/**
 * For each game version, keep the progressively more stable files
 * (lower releaseType = more stable: 1 release, 2 beta, 3 alpha).
 */
const getVersions = (latestFilesIndexes: LatestFilesIndex[]): LatestFilesIndex[] => {
  const byGameVersion = groupBy(latestFilesIndexes, (v) => v.gameVersion);

  return Object.values(byGameVersion).flatMap((versions) =>
    versions.reduce<{ versions: LatestFilesIndex[]; mostStable: number }>(
      (acc, curr) => {
        if (acc.mostStable > curr.releaseType) {
          acc.versions.push(curr);
          acc.mostStable = curr.releaseType;
        }
        return acc;
      },
      { versions: [], mostStable: 10 },
    ).versions
  );
};

const cache = new Keyv<Mod>({ ttl: 3_600_000 });

async function fetchMod(cfId: string): Promise<Mod> {
  const apiKey = process.env.CURSEFORGE_API_KEY;
  if (!apiKey) {
    throw new Error("CURSEFORGE_API_KEY is not configured");
  }

  const res = await fetch(`${CURSEFORGE_API}/mods/${cfId}`, {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(
      `CurseForge API error for mod ${cfId}: ${res.status} ${res.statusText}`,
    );
  }

  const { data: mod } = (await res.json()) as CurseForgeRoot;

  const versions = getVersions(mod.latestFilesIndexes).map((file) => ({
    name: file.gameVersion + (RELEASE_TYPE_SUFFIX[file.releaseType - 1] ?? ""),
    link: `${mod.links.websiteUrl}/files/${file.fileId}`,
  }));

  return {
    name: mod.name,
    link: mod.links.websiteUrl,
    summary: mod.summary,
    author: mod.authors[0]?.name ?? "Unknown",
    logo: mod.logo?.url ?? null,
    versions,
    last_updated: new Date(mod.dateReleased),
    download_count: mod.downloadCount,
    issues: mod.links.issuesUrl || null,
    source: mod.links.sourceUrl || null,
  };
}

/** Returns the addon's live CurseForge data, or null if it could not be fetched. */
export async function getAddonMod(cfId: string): Promise<Mod | null> {
  const cached = await cache.get(cfId);
  if (cached) return cached;

  try {
    const mod = await fetchMod(cfId);
    await cache.set(cfId, mod);
    return mod;
  } catch (error) {
    console.error("Failed to fetch addon mod data", cfId, error);
    return null;
  }
}
