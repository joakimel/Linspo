/**
 * verify.ts — Verifiser at en URL har tilgjengelig RSS/Atom-feed.
 *
 * Strategi (i rekkefølge):
 * 1. Sjekk om URL-en selv er en feed (inneholder <rss> eller <feed>)
 * 2. Hent HTML og se etter <link rel="alternate" type="application/rss+xml">
 * 3. Prøv vanlige feed-stier (/feed, /rss, /rss.xml, /atom.xml, /feed.xml)
 */

import { XMLParser } from "fast-xml-parser";
import type { RssVerificationResult } from "./types.js";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";
const FETCH_TIMEOUT_MS = 10_000;

const COMMON_FEED_PATHS = [
  "/feed",
  "/rss",
  "/rss.xml",
  "/atom.xml",
  "/feed.xml",
  "/feeds/all.atom.xml",
  "/blog/feed",
  "/blog/rss.xml",
  "/index.xml",
];

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

async function safeFetch(
  url: string,
  accept = "text/html,application/xml,application/rss+xml,*/*"
): Promise<{ ok: boolean; text: string; contentType: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: accept,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, text: "", contentType: "" };
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    return { ok: true, text, contentType };
  } catch {
    return { ok: false, text: "", contentType: "" };
  }
}

function looksLikeFeed(text: string, contentType: string): boolean {
  if (
    contentType.includes("application/rss") ||
    contentType.includes("application/atom") ||
    contentType.includes("application/xml") ||
    contentType.includes("text/xml")
  ) {
    return text.includes("<rss") || text.includes("<feed") || text.includes("<channel");
  }
  // Sjekk innhold uansett content-type
  const trimmed = text.trimStart().slice(0, 500);
  return (
    trimmed.includes("<rss") ||
    trimmed.includes("<feed ") ||
    trimmed.includes("<channel>") ||
    trimmed.includes('xmlns="http://www.w3.org/2005/Atom"')
  );
}

/** Hent feed-tittel fra RSS/Atom XML */
function extractFeedTitle(xml: string): string | undefined {
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    return (
      parsed?.rss?.channel?.title ||
      parsed?.feed?.title ||
      undefined
    );
  } catch {
    return undefined;
  }
}

/** Hent RSS-URL fra HTML autodiscovery-tagger */
function extractRssFromHtml(html: string, baseUrl: string): string | null {
  // <link rel="alternate" type="application/rss+xml" href="...">
  // <link rel="alternate" type="application/atom+xml" href="...">
  const linkRe =
    /<link[^>]+(?:type="application\/(?:rss|atom)\+xml"|type='application\/(?:rss|atom)\+xml')[^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;

  const matches = html.match(linkRe) ?? [];
  for (const tag of matches) {
    const m = tag.match(hrefRe);
    if (m?.[1]) {
      const href = m[1].trim();
      if (href.startsWith("http")) return href;
      if (href.startsWith("/")) {
        try {
          const base = new URL(baseUrl);
          return `${base.protocol}//${base.host}${href}`;
        } catch {
          return href;
        }
      }
    }
  }
  return null;
}

/**
 * Verifiser at en URL har RSS.
 * Returnerer RssVerificationResult med rssUrl hvis funnet.
 */
export async function verifyRss(url: string): Promise<RssVerificationResult> {
  // 1. Sjekk om URL-en selv er en feed
  const direct = await safeFetch(
    url,
    "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*"
  );
  if (direct.ok && looksLikeFeed(direct.text, direct.contentType)) {
    return {
      hasRss: true,
      rssUrl: url,
      feedTitle: extractFeedTitle(direct.text),
    };
  }

  // 2. Hent HTML og sjekk autodiscovery
  if (direct.ok && direct.contentType.includes("text/html")) {
    const rssFromHtml = extractRssFromHtml(direct.text, url);
    if (rssFromHtml) {
      // Verifiser at funnet URL faktisk er en feed
      const feedCheck = await safeFetch(rssFromHtml);
      if (feedCheck.ok && looksLikeFeed(feedCheck.text, feedCheck.contentType)) {
        return {
          hasRss: true,
          rssUrl: rssFromHtml,
          feedTitle: extractFeedTitle(feedCheck.text),
        };
      }
    }
  }

  // 3. Prøv vanlige feed-stier
  const base = normalizeUrl(url);
  for (const path of COMMON_FEED_PATHS) {
    const candidate = `${base}${path}`;
    const res = await safeFetch(candidate);
    if (res.ok && looksLikeFeed(res.text, res.contentType)) {
      return {
        hasRss: true,
        rssUrl: candidate,
        feedTitle: extractFeedTitle(res.text),
      };
    }
  }

  return { hasRss: false, rssUrl: null };
}

/**
 * Batch-verifiser en liste med URL-er.
 * Returnerer map fra URL til RssVerificationResult.
 */
export async function verifyRssBatch(
  urls: string[],
  concurrency = 4
): Promise<Map<string, RssVerificationResult>> {
  const results = new Map<string, RssVerificationResult>();

  // Kjør i chunks for å ikke overbelaste
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map((u) => verifyRss(u)));
    settled.forEach((result, idx) => {
      const url = chunk[idx];
      if (result.status === "fulfilled") {
        results.set(url, result.value);
      } else {
        results.set(url, { hasRss: false, rssUrl: null });
      }
    });
  }

  return results;
}
