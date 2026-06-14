import Keyv from "keyv";
import type {
  PagefindInstance,
  PagefindResultData,
} from "../types/pagefind.js";

const BASE_URL = "https://ars.guide";
const cache = new Keyv<PagefindInstance>({ ttl: 3_600_000 });

async function getPagefind(): Promise<PagefindInstance> {
  const cached = await cache.get("pagefind");
  if (cached) return cached;

  const pf: PagefindInstance = await import(`${BASE_URL}/pagefind/pagefind.js`);
  await pf.init();
  await cache.set("pagefind", pf);
  return pf;
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
