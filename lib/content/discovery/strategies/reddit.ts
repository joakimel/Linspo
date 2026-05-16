/**
 * reddit.ts — Finn relevante subreddits for et emne via Reddit JSON API.
 *
 * Strategi:
 * 1. Bruk Reddit's subreddit search: GET /subreddits/search.json?q={topic}
 * 2. Filtrer på relevans og antall abonnenter
 * 3. Returner subreddit-URL + .rss-URL (Reddit støtter RSS på alle subreddits)
 *
 * Reddit RSS-format: https://www.reddit.com/r/{subreddit}/top.json?t=week
 * (Bruker JSON API, ikke RSS, som spesifisert i oppgaven)
 *
 * Merk: Reddit krever User-Agent, ingen autentisering for offentlige subs.
 */

import type { DiscoveredSource, StrategyResult } from "../types.js";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";
const MIN_SUBSCRIBERS = 1000; // Filtrer bort veldig små subreddits

interface RedditSubreddit {
  data: {
    display_name: string;
    title: string;
    public_description: string;
    subscribers: number;
    url: string;
    over18: boolean;
    lang: string;
  };
}

interface RedditSearchResponse {
  data: {
    children: RedditSubreddit[];
  };
}

async function searchSubreddits(query: string): Promise<RedditSubreddit[]> {
  const params = new URLSearchParams({
    q: query,
    type: "sr",
    limit: "10",
    sort: "relevance",
  });

  const url = `https://www.reddit.com/subreddits/search.json?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Reddit returnerer 429 ved rate-limiting
      if (res.status === 429) throw new Error("Reddit rate limit");
      return [];
    }

    const data = (await res.json()) as RedditSearchResponse;
    return data?.data?.children ?? [];
  } catch {
    return [];
  }
}

/** Bygg Reddit JSON feed URL (erstatter RSS der Reddit JSON er mer pålitelig) */
function buildRedditFeedUrl(subredditName: string): string {
  return `https://www.reddit.com/r/${subredditName}/top.json?t=week&limit=25`;
}

/** Reddit støtter også RSS — bruk dette som rssUrl */
function buildRedditRssUrl(subredditName: string): string {
  return `https://www.reddit.com/r/${subredditName}/top.rss?t=week`;
}

export async function discoverViaReddit(topic: string): Promise<StrategyResult> {
  const now = new Date().toISOString();

  // Norske emner: søk på engelsk i tillegg for bedre dekning
  const queries = [topic];
  const normalizedTopic = topic
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a");
  if (normalizedTopic !== topic.toLowerCase()) {
    queries.push(normalizedTopic);
  }

  const allSubreddits: RedditSubreddit[] = [];
  for (const q of queries) {
    const results = await searchSubreddits(q);
    allSubreddits.push(...results);
  }

  // Dedupliser og filtrer
  const seen = new Set<string>();
  const sources: DiscoveredSource[] = [];

  for (const sub of allSubreddits) {
    const name = sub.data.display_name;
    if (seen.has(name)) continue;
    seen.add(name);

    // Filtrer bort NSFW og for små subreddits
    if (sub.data.over18) continue;
    if (sub.data.subscribers < MIN_SUBSCRIBERS) continue;

    const rssUrl = buildRedditRssUrl(name);
    const confidence = calculateConfidence(sub.data.subscribers, topic, name, sub.data.title);

    sources.push({
      url: `https://www.reddit.com${sub.data.url}`,
      rssUrl,
      method: "reddit",
      title: `r/${name}`,
      description: sub.data.public_description?.slice(0, 200) || sub.data.title,
      confidence,
      discoveredAt: now,
    });
  }

  // Sorter etter konfidens
  sources.sort((a, b) => b.confidence - a.confidence);

  return { method: "reddit", sources: sources.slice(0, 8) };
}

function calculateConfidence(
  subscribers: number,
  topic: string,
  subredditName: string,
  title: string
): number {
  let score = 0.4; // Basis

  // Popularitet (logaritmisk skala)
  if (subscribers > 1_000_000) score += 0.15;
  else if (subscribers > 100_000) score += 0.1;
  else if (subscribers > 10_000) score += 0.05;

  // Navne-match
  const topicLower = topic.toLowerCase().replace(/\s+/g, "");
  const subLower = subredditName.toLowerCase();
  const titleLower = title.toLowerCase();

  if (subLower === topicLower || subLower.includes(topicLower)) {
    score += 0.2;
  } else if (titleLower.includes(topic.toLowerCase())) {
    score += 0.1;
  }

  return Math.min(0.85, Math.round(score * 100) / 100);
}
