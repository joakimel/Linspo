/**
 * awesome-lists.ts — Søk GitHub etter awesome-{topic}-repos og parse README for lenker.
 *
 * Strategi:
 * 1. Søk GitHub API: /search/repositories?q=awesome+{topic}+in:name
 * 2. Hent README for topp 3 resultater
 * 3. Parse alle lenker fra README (markdown-format)
 * 4. Filtrer på domenekvalitet og returnerer kandidater
 *
 * GitHub gratis API: 60 req/time uten token (bruk GITHUB_TOKEN hvis tilgjengelig)
 */

import type { DiscoveredSource, StrategyResult } from "../types.js";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";

// Domener som typisk indikerer gode faglige ressurser
const HIGH_QUALITY_DOMAINS = new Set([
  "medium.com",
  "dev.to",
  "substack.com",
  "hashnode.com",
  "github.io",
  "gitlab.io",
]);

// Filtrer bort non-ressurs-lenker fra awesome-lists
const LINK_DOMAIN_BLOCKLIST = new Set([
  "github.com",
  "gitlab.com",
  "shields.io",
  "img.shields.io",
  "travis-ci.org",
  "circleci.com",
  "codecov.io",
  "badge.fury.io",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
]);

interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  default_branch: string;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getAuthToken(): string | null {
  return process.env.GITHUB_TOKEN ?? null;
}

async function searchAwesomeRepos(topic: string): Promise<GitHubRepo[]> {
  const cleanTopic = topic
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const queries = [
    `awesome-${cleanTopic}`,
    `awesome ${cleanTopic}`,
  ];

  const repos: GitHubRepo[] = [];
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (const q of queries.slice(0, 1)) {
    // Begrens til 1 søk for å spare rate limit
    const params = new URLSearchParams({
      q: `${q} in:name`,
      sort: "stars",
      order: "desc",
      per_page: "5",
    });

    try {
      const res = await fetch(`https://api.github.com/search/repositories?${params}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status === 403) {
        throw new Error("GitHub API rate limit nådd");
      }

      if (!res.ok) continue;

      const data = (await res.json()) as GitHubSearchResponse;
      repos.push(...(data.items ?? []));
    } catch (err) {
      if (err instanceof Error && err.message.includes("rate limit")) {
        throw err;
      }
    }
  }

  return repos;
}

async function fetchReadme(repo: GitHubRepo): Promise<string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github.raw",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Prøv standard README-stier
  const readmePaths = ["README.md", "readme.md", "Readme.md"];

  for (const readmePath of readmePaths) {
    const url = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${readmePath}`;
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return await res.text();
    } catch {
      continue;
    }
  }
  return "";
}

/** Parse markdown-lenker fra README */
function parseMarkdownLinks(
  markdown: string
): Array<{ url: string; title: string }> {
  const links: Array<{ url: string; title: string }> = [];

  // Standard markdown: [title](url)
  const markdownLinkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRe.exec(markdown)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();

    const domain = getDomain(url);
    if (!domain) continue;
    if (LINK_DOMAIN_BLOCKLIST.has(domain)) continue;
    // Filtrer bort rene bilde-lenker
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url)) continue;

    links.push({ url, title });
  }

  return links;
}

export async function discoverViaAwesomeLists(topic: string): Promise<StrategyResult> {
  const now = new Date().toISOString();

  let repos: GitHubRepo[];
  try {
    repos = await searchAwesomeRepos(topic);
  } catch (err) {
    return {
      method: "awesome-lists",
      sources: [],
      error: err instanceof Error ? err.message : "GitHub API-feil",
    };
  }

  if (repos.length === 0) {
    return {
      method: "awesome-lists",
      sources: [],
      error: `Ingen awesome-lists funnet for "${topic}"`,
    };
  }

  // Hent README for topp 3 repos
  const topRepos = repos
    .filter((r) => r.name.toLowerCase().includes("awesome"))
    .slice(0, 3);

  if (topRepos.length === 0) {
    topRepos.push(...repos.slice(0, 2));
  }

  const readmeResults = await Promise.allSettled(topRepos.map((r) => fetchReadme(r)));

  // Samle alle lenker
  const allLinks = new Map<string, { url: string; title: string; count: number }>();

  readmeResults.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const links = parseMarkdownLinks(result.value);
    for (const link of links) {
      const domain = getDomain(link.url);
      if (!domain) continue;
      const existing = allLinks.get(domain);
      if (existing) {
        existing.count++;
      } else {
        allLinks.set(domain, { ...link, count: 1 });
      }
    }
  });

  const sources: DiscoveredSource[] = [];

  for (const { url, title, count } of allLinks.values()) {
    const domain = getDomain(url);
    const isHighQuality = HIGH_QUALITY_DOMAINS.has(domain);

    // Konfidens basert på forekomst og domain-kvalitet
    let confidence = 0.35;
    if (count > 1) confidence += 0.1; // Nevnt i flere lister
    if (isHighQuality) confidence += 0.1;

    sources.push({
      url,
      rssUrl: null,
      method: "awesome-lists",
      title,
      description: `Funnet i awesome-list for "${topic}" (${count} forekomst${count > 1 ? "er" : ""})`,
      confidence: Math.min(0.7, confidence),
      discoveredAt: now,
    });
  }

  // Sorter etter konfidens og begrens
  sources.sort((a, b) => b.confidence - a.confidence);
  return { method: "awesome-lists", sources: sources.slice(0, 20) };
}
