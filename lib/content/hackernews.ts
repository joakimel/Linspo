import type { FetchedArticle } from "@/lib/types";

const DEFAULT_TOPICS = [
  "UX design",
  "design systems",
  "Claude Code",
  "Anthropic Claude",
  "Steam Deck",
  "MSI Claw",
  "ROG Ally",
  "handheld gaming",
];

interface HNHit {
  objectID: string;
  url: string | null;
  title: string | null;
  author: string;
  points: number | null;
  story_text: string | null;
  created_at: string;
}

interface HNResponse {
  hits: HNHit[];
}

async function searchOneTopic(
  topic: string,
  options: { minPoints: number; sinceTimestamp: number; hitsPerTopic: number }
): Promise<FetchedArticle[]> {
  const url = new URL("https://hn.algolia.com/api/v1/search");
  url.searchParams.set("query", topic);
  url.searchParams.set("tags", "story");
  url.searchParams.set(
    "numericFilters",
    `points>${options.minPoints},created_at_i>${options.sinceTimestamp}`
  );
  url.searchParams.set("hitsPerPage", String(options.hitsPerTopic));

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Linspo/0.1" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as HNResponse;

    return data.hits
      .filter(
        (h): h is HNHit & { url: string; title: string } =>
          Boolean(h.url) && Boolean(h.title)
      )
      .map((h) => ({
        external_id: h.objectID,
        url: h.url,
        title: h.title,
        author: h.author || null,
        published_at: h.created_at,
        source: "hackernews",
        excerpt: h.story_text,
      }));
  } catch {
    return [];
  }
}

export async function fetchHackerNewsByTopics(
  options: {
    topics?: string[];
    minPoints?: number;
    daysBack?: number;
    hitsPerTopic?: number;
  } = {}
): Promise<FetchedArticle[]> {
  const topics = options.topics ?? DEFAULT_TOPICS;
  const minPoints = options.minPoints ?? 10;
  const daysBack = options.daysBack ?? 30;
  const hitsPerTopic = options.hitsPerTopic ?? 5;

  const sinceTimestamp = Math.floor((Date.now() - daysBack * 86400 * 1000) / 1000);

  const perTopicResults = await Promise.all(
    topics.map((t) => searchOneTopic(t, { minPoints, sinceTimestamp, hitsPerTopic }))
  );

  const seen = new Set<string>();
  const out: FetchedArticle[] = [];
  for (const arr of perTopicResults) {
    for (const article of arr) {
      if (!seen.has(article.url)) {
        seen.add(article.url);
        out.push(article);
      }
    }
  }
  return out;
}
