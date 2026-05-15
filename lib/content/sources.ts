import type { FetchedArticle } from "@/lib/types";
import { fetchHackerNewsByTopics } from "./hackernews";
import { fetchRssFeed, type RssFeedConfig } from "./rss";

const RSS_FEEDS: RssFeedConfig[] = [
  // Reddit — topical communities (top of last week)
  { url: "https://www.reddit.com/r/UXDesign/top.rss?t=week", source: "reddit-uxdesign", maxItems: 8 },
  { url: "https://www.reddit.com/r/ClaudeAI/top.rss?t=week", source: "reddit-claudeai", maxItems: 8 },
  { url: "https://www.reddit.com/r/SteamDeck/top.rss?t=week", source: "reddit-steamdeck", maxItems: 5 },
  { url: "https://www.reddit.com/r/SBCGaming/top.rss?t=week", source: "reddit-sbcgaming", maxItems: 5 },
  { url: "https://www.reddit.com/r/handheldpcgaming/top.rss?t=week", source: "reddit-handheldpc", maxItems: 5 },

  // Pro gaming/tech outlets
  { url: "https://www.theverge.com/rss/gaming/index.xml", source: "verge-gaming", maxItems: 8 },
  { url: "https://www.polygon.com/rss/index.xml", source: "polygon", maxItems: 8 },
];

export async function fetchAllSources(): Promise<FetchedArticle[]> {
  const [hnArticles, ...rssResults] = await Promise.all([
    fetchHackerNewsByTopics().catch(() => [] as FetchedArticle[]),
    ...RSS_FEEDS.map((cfg) =>
      fetchRssFeed(cfg).catch(() => [] as FetchedArticle[])
    ),
  ]);

  // Interleave kildene så hver cron-kjøring får miks (i stedet for all HN først)
  const interleaved = interleaveArrays([hnArticles, ...rssResults]);

  const seen = new Set<string>();
  const out: FetchedArticle[] = [];
  for (const article of interleaved) {
    if (!article.url || seen.has(article.url)) continue;
    seen.add(article.url);
    out.push(article);
  }
  return out;
}

function interleaveArrays<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  const maxLen = arrays.reduce((m, a) => Math.max(m, a.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) result.push(arr[i]);
    }
  }
  return result;
}
