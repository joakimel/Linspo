export interface FetchedArticle {
  external_id: string;
  url: string;
  title: string;
  author: string;
  published_at: string;
  source: "hackernews";
  excerpt: string | null;
}

interface HNHit {
  objectID: string;
  url: string | null;
  title: string | null;
  author: string;
  points: number | null;
  story_text: string | null;
  created_at: string;
  num_comments: number | null;
}

interface HNResponse {
  hits: HNHit[];
}

export async function fetchHackerNewsTopStories(options: {
  minPoints?: number;
  hoursBack?: number;
  hitsPerPage?: number;
} = {}): Promise<FetchedArticle[]> {
  const minPoints = options.minPoints ?? 100;
  const hoursBack = options.hoursBack ?? 48;
  const hitsPerPage = options.hitsPerPage ?? 20;

  const sinceTimestamp = Math.floor((Date.now() - hoursBack * 3600 * 1000) / 1000);

  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  url.searchParams.set("tags", "story");
  url.searchParams.set(
    "numericFilters",
    `points>${minPoints},created_at_i>${sinceTimestamp}`
  );
  url.searchParams.set("hitsPerPage", String(hitsPerPage));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Linspo/0.1" },
  });

  if (!res.ok) {
    throw new Error(`HN Algolia API feilet: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as HNResponse;

  return data.hits
    .filter((hit): hit is HNHit & { url: string; title: string } =>
      Boolean(hit.url) && Boolean(hit.title)
    )
    .map((hit) => ({
      external_id: hit.objectID,
      url: hit.url,
      title: hit.title,
      author: hit.author,
      published_at: hit.created_at,
      source: "hackernews" as const,
      excerpt: hit.story_text,
    }));
}
