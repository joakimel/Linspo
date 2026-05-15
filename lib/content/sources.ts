import type { FetchedArticle } from "@/lib/types";
import { fetchHackerNewsByTopics } from "./hackernews";
import { fetchRssFeed, type RssFeedConfig } from "./rss";

const RSS_FEEDS: RssFeedConfig[] = [
  // UX-fagstoff
  { url: "https://www.smashingmagazine.com/feed/", source: "smashing", maxItems: 8 },
  { url: "https://uxdesign.cc/feed", source: "uxdesign", maxItems: 8 },
  { url: "https://www.nngroup.com/feed/rss/", source: "nngroup", maxItems: 8 },

  // Håndholdte og gaming-PCer (Joakims spesifikke interesse)
  { url: "https://retrohandhelds.gg/feed/", source: "retrohandhelds", maxItems: 10 },
  { url: "https://liliputing.com/feed/", source: "liliputing", maxItems: 10 },
  {
    url: "https://www.tomshardware.com/feeds.xml",
    source: "tomshardware",
    maxItems: 30,
    // Tom's Hardware har bare én samlet feed — filtrér til handheld-relevant
    keywordFilter: [
      "handheld",
      "steam deck",
      "rog ally",
      "msi claw",
      "legion go",
      "ayaneo",
      "retroid",
      "ayn ",
    ],
  },

  // Linux-/Steam Deck-gaming
  { url: "https://www.gamingonlinux.com/article_rss.php", source: "gamingonlinux", maxItems: 10 },

  // Bredt tech (inkluderer ofte AI-/Claude-/gaming-nyheter)
  { url: "https://www.theverge.com/rss/tech/index.xml", source: "verge-tech", maxItems: 10 },
  { url: "https://www.theverge.com/rss/gaming/index.xml", source: "verge-gaming", maxItems: 10 },
];

export async function fetchAllSources(): Promise<FetchedArticle[]> {
  const [hnArticles, ...rssResults] = await Promise.all([
    fetchHackerNewsByTopics().catch(() => [] as FetchedArticle[]),
    ...RSS_FEEDS.map((cfg) =>
      fetchRssFeed(cfg).catch(() => [] as FetchedArticle[])
    ),
  ]);

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
