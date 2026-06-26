import type {
  PagefindInstance,
  PagefindResultData,
} from "../types/pagefind.js";

const BASE_URL = "https://ars.guide";
const TTL = 3_600_000;

// The Pagefind instance is a live module with methods, so it can't be stored in
// a serializing cache (e.g. Keyv) — serialization strips the functions. Memoize
// the import promise in module scope instead, expiring it after TTL so a fresh
// index gets imported and re-init'd.
let pagefind: Promise<PagefindInstance> | undefined;
let expiresAt = 0;

function getPagefind(): Promise<PagefindInstance> {
  if (!pagefind || Date.now() >= expiresAt) {
    expiresAt = Date.now() + TTL;
    pagefind = (async () => {
      const pf: PagefindInstance = await import(
        `${BASE_URL}/pagefind/pagefind.js?t=${Date.now()}`
      );
      await pf.init();
      return pf;
    })().catch((err) => {
      // Don't cache a failed import; allow the next call to retry.
      pagefind = undefined;
      expiresAt = 0;
      throw err;
    });
  }

  return pagefind;
}

export interface GuideResult {
  title: string;
  url: string;
  excerpt: string;
}

export async function searchGuide(
  query: string,
  category: string,
  version = "1.21.1",
  limit = 5,
): Promise<GuideResult[]> {
  const pf = await getPagefind();
  const response = await pf.search(query, {
    filters: { category, version },
  });

  const results: GuideResult[] = [];
  for (const result of response.results.slice(0, limit)) {
    const data = await result.data();
    results.push({
      title: data.meta.title ?? "Unknown",
      url: data.url,
      excerpt: data.excerpt,
    });
  }

  return results;
}

export function stripHighlight(excerpt: string): string {
  return excerpt
    .replace(/<\/?mark>/g, "**")
    .replace(/<[^>]*>/g, "")
    .trim();
}
