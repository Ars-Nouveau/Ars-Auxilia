export interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: Record<string, string>;
  content: string;
  word_count: number;
  filters: Record<string, string[]>;
  sub_results: {
    title: string;
    url: string;
    excerpt: string;
  }[];
}

export interface PagefindResult {
  id: string;
  score: number;
  data: () => Promise<PagefindResultData>;
}

export interface PagefindSearchResponse {
  results: PagefindResult[];
  unfilteredResultCount: number;
  filters: Record<string, Record<string, number>>;
  totalFilters: Record<string, Record<string, number>>;
}

export interface PagefindSearchOptions {
  filters?: Record<string, string | string[]>;
  sort?: Record<string, "asc" | "desc">;
}

export interface PagefindInstance {
  init: (language?: string) => Promise<void>;
  search: (query: string, options?: PagefindSearchOptions) => Promise<PagefindSearchResponse>;
  debouncedSearch: (query: string, options?: PagefindSearchOptions, debounceMs?: number) => Promise<PagefindSearchResponse | null>;
  filters: () => Promise<Record<string, Record<string, number>>>;
  preload: (query: string) => void;
  options: (opts: Record<string, unknown>) => void;
}
