/**
 * wikipedia.ts — Oppdager eksterne lenker fra Wikipedia-artikkel om emnet.
 *
 * Strategi:
 * 1. Prøv norsk Wikipedia (no.wikipedia.org) for emnet
 * 2. Falle tilbake til engelsk Wikipedia (en.wikipedia.org)
 * 3. Hent eksterne lenker via MediaWiki API (prop=extlinks)
 * 4. Filtrer bort spam/irrelevante (wiki-lenker, sosiale medier uten RSS, etc.)
 * 5. Returner kandidater med lav-medium konfidens (verifisering gjøres av orkestrator)
 */

import type { DiscoveredSource, StrategyResult } from "../types.js";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";

const DOMAIN_BLOCKLIST = new Set([
  "amazon.com",
  "amazon.co.uk",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "linkedin.com",
  "google.com",
  "apple.com",
  "microsoft.com",
  "archive.org",
  "doi.org",
  "jstor.org",
  "springer.com",
  "wiley.com",
  "pubmed.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
]);

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isUsefulLink(url: string): boolean {
  const domain = getDomain(url);
  if (!domain) return false;
  if (DOMAIN_BLOCKLIST.has(domain)) return false;
  // Filtrer ut Wikipedia-interne lenker
  if (domain.includes("wikipedia.org") || domain.includes("wikimedia.org")) return false;
  // Filtrer ut rene bilde-URL-er
  if (/\.(jpg|jpeg|png|gif|svg|webp|pdf)$/i.test(url)) return false;
  return true;
}

async function searchWikipedia(
  topic: string,
  lang: "no" | "en"
): Promise<{ pageTitle: string; found: boolean }> {
  const encodedTopic = encodeURIComponent(topic);
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return { pageTitle: "", found: false };
    const data = (await res.json()) as { title?: string; type?: string };
    if (data.type === "disambiguation" || !data.title) return { pageTitle: "", found: false };
    return { pageTitle: data.title, found: true };
  } catch {
    return { pageTitle: "", found: false };
  }
}

async function fetchExternalLinks(
  pageTitle: string,
  lang: "no" | "en"
): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    prop: "extlinks",
    titles: pageTitle,
    format: "json",
    ellimit: "50",
    elprotocol: "https",
    origin: "*",
  });

  const url = `https://${lang}.wikipedia.org/w/api.php?${params}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { extlinks?: Array<{ "*": string }> }
        >;
      };
    };

    const pages = data?.query?.pages;
    if (!pages) return [];

    const links: string[] = [];
    for (const page of Object.values(pages)) {
      for (const link of page.extlinks ?? []) {
        const href = link["*"];
        if (href && isUsefulLink(href)) {
          links.push(href);
        }
      }
    }
    return links;
  } catch {
    return [];
  }
}

export async function discoverViaWikipedia(topic: string): Promise<StrategyResult> {
  const now = new Date().toISOString();

  // Prøv norsk Wikipedia først
  let lang: "no" | "en" = "no";
  let result = await searchWikipedia(topic, "no");

  if (!result.found) {
    lang = "en";
    result = await searchWikipedia(topic, "en");
  }

  if (!result.found) {
    // Prøv engelsk med oversatt søk (bare bruk engelsk emne)
    lang = "en";
    result = await searchWikipedia(topic.replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a"), "en");
  }

  if (!result.found) {
    return {
      method: "wikipedia",
      sources: [],
      error: `Fant ingen Wikipedia-artikkel for "${topic}"`,
    };
  }

  const links = await fetchExternalLinks(result.pageTitle, lang);

  // Dedupliser på domene — ikke ta mer enn 2 lenker per domene
  const domainCount = new Map<string, number>();
  const deduped: string[] = [];
  for (const link of links) {
    const domain = getDomain(link);
    const count = domainCount.get(domain) ?? 0;
    if (count < 2) {
      deduped.push(link);
      domainCount.set(domain, count + 1);
    }
  }

  const sources: DiscoveredSource[] = deduped.map((link) => ({
    url: link,
    rssUrl: null,
    method: "wikipedia" as const,
    title: getDomain(link),
    description: `Ekstern lenke fra Wikipedia-artikkelen "${result.pageTitle}" (${lang}.wikipedia.org)`,
    confidence: 0.35, // Lav basis — vi vet ikke at det er en feed-kilde
    discoveredAt: now,
  }));

  return { method: "wikipedia", sources };
}
