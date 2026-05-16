/**
 * hn-algolia.ts — Bruk Hacker News Algolia API for å finne relevante domener for emnet.
 *
 * Strategi:
 * 1. Søk HN Algolia API: https://hn.algolia.com/api/v1/search?query={topic}&tags=story
 * 2. Hent de 30-50 mest relevante historiene
 * 3. Tell forekomster per domene (external URL-er, ikke github/reddit/etc.)
 * 4. Domener som dukker opp flere ganger = sannsynlig god kilde
 * 5. Returner topp domener sortert etter forekomster
 *
 * HN Algolia er gratis og har ingen rate-limits for normal bruk.
 */

import type { DiscoveredSource, StrategyResult } from "../types.js";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";

const DOMAIN_BLOCKLIST = new Set([
  "github.com",
  "gitlab.com",
  "news.ycombinator.com",
  "reddit.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "medium.com", // For generisk — mange falske positiver
  "wikipedia.org",
  "stackoverflow.com",
  "arxiv.org",
  "amazon.com",
  "google.com",
]);

interface HnStory {
  url?: string;
  title?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
}

interface HnAlgoliaResponse {
  hits: HnStory[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function searchHnAlgolia(
  query: string,
  numericFilters = ""
): Promise<HnStory[]> {
  const params = new URLSearchParams({
    query,
    tags: "story",
    hitsPerPage: "50",
    ...(numericFilters ? { numericFilters } : {}),
  });

  const url = `https://hn.algolia.com/api/v1/search?${params}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as HnAlgoliaResponse;
    return data?.hits ?? [];
  } catch {
    return [];
  }
}

export async function discoverViaHnAlgolia(topic: string): Promise<StrategyResult> {
  const now = new Date().toISOString();

  // Kjør to søk: siste 6 måneder og siste 2 år for bedre dekning
  const sixMonthsAgo = Math.floor((Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) / 1000);
  const twoYearsAgo = Math.floor((Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) / 1000);

  const [recentHits, olderHits] = await Promise.all([
    searchHnAlgolia(topic, `created_at_i>${sixMonthsAgo}`),
    searchHnAlgolia(topic, `created_at_i>${twoYearsAgo},points>10`),
  ]);

  // Kombiner, nyere vektes mer
  const domainStats = new Map<
    string,
    { count: number; score: number; title: string; url: string }
  >();

  const processHits = (hits: HnStory[], weight: number) => {
    for (const hit of hits) {
      if (!hit.url) continue;
      const domain = getDomain(hit.url);
      if (!domain || DOMAIN_BLOCKLIST.has(domain)) continue;

      const points = (hit.points ?? 0) * weight;
      const existing = domainStats.get(domain);

      if (existing) {
        existing.count++;
        existing.score += points;
      } else {
        domainStats.set(domain, {
          count: 1,
          score: points,
          title: hit.title ?? domain,
          url: hit.url,
        });
      }
    }
  };

  processHits(recentHits, 1.5); // Nyere saker vektes 1.5x
  processHits(olderHits, 1.0);

  // Filtrer bort domener med bare 1 forekomst (for mye støy)
  const candidates = [...domainStats.entries()]
    .filter(([, stats]) => stats.count >= 1)
    .sort(([, a], [, b]) => b.score * b.count - a.score * a.count);

  const sources: DiscoveredSource[] = candidates
    .slice(0, 15)
    .map(([domain, stats]) => {
      let confidence = 0.35;
      if (stats.count >= 3) confidence += 0.15;
      else if (stats.count >= 2) confidence += 0.08;
      if (stats.score > 100) confidence += 0.1;

      return {
        url: `https://${domain}`,
        rssUrl: null,
        method: "hn-algolia" as const,
        title: stats.title?.replace(/\s*[-|].*$/, "").trim() || domain,
        description: `Opptrådt ${stats.count} gang${stats.count > 1 ? "er" : ""} på Hacker News for "${topic}"`,
        confidence: Math.min(0.75, confidence),
        discoveredAt: now,
      };
    });

  return { method: "hn-algolia", sources };
}
