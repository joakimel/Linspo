/**
 * mastodon.ts — Konverter emnet til Mastodon-hashtag-RSS på tvers av instanser.
 *
 * Strategi:
 * - Konverter emne til CamelCase-hashtag og rene ord
 * - Sjekk 6 store Mastodon-instanser: URL-format er https://{instance}/tags/{hashtag}.rss
 * - For tekniske emner: sjekk spesialiserte instanser (fosstodon.org, hachyderm.io)
 * - Returner instanser som svarer med gyldig RSS
 *
 * Mastodon RSS-format: https://mastodon.social/tags/uxdesign.rss
 */

import type { DiscoveredSource, StrategyResult } from "../types.js";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";

// Instanser å sjekke — balansert mellom størrelse og nisje-relevans
const MASTODON_INSTANCES = [
  "mastodon.social",
  "fosstodon.org",      // Teknologi/open-source
  "hachyderm.io",       // Teknologi/software
  "infosec.exchange",   // Sikkerhet
  "sciences.social",    // Akademisk/vitenskap
  "norges.social",      // Norsk
  "snabelen.no",        // Norsk
];

/** Konverter emne til Mastodon-hashtag (fjern spaces, norske tegn, lage camelCase) */
function topicToHashtag(topic: string): string[] {
  const variants: string[] = [];

  // Normaliser grunnleggende
  const clean = topic
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return [];

  // Variant 1: alt sammen uten mellomrom
  variants.push(words.join(""));

  // Variant 2: CamelCase
  if (words.length > 1) {
    const camel = words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    variants.push(camel);
  }

  // Variant 3: bare første ord (nyttig for korte emner)
  if (words[0].length > 3) {
    variants.push(words[0]);
  }

  // Variant 4: Kombiner siste to ord hvis det er et langt emne
  if (words.length >= 3) {
    variants.push(words[words.length - 2] + words[words.length - 1]);
  }

  // Dedupliser
  return [...new Set(variants)];
}

async function checkMastodonHashtag(
  instance: string,
  hashtag: string
): Promise<{ rssUrl: string; hasContent: boolean } | null> {
  const rssUrl = `https://${instance}/tags/${hashtag}.rss`;

  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(6_000),
      redirect: "follow",
    });

    if (!res.ok) return null;

    const text = await res.text();
    // Sjekk at det faktisk er en feed med innhold
    const hasItems = text.includes("<item>") || text.includes("<entry>");
    if (!text.includes("<rss") && !text.includes("<feed")) return null;

    return { rssUrl, hasContent: hasItems };
  } catch {
    return null;
  }
}

export async function discoverViaMastodon(topic: string): Promise<StrategyResult> {
  const now = new Date().toISOString();
  const hashtags = topicToHashtag(topic);

  if (hashtags.length === 0) {
    return { method: "mastodon", sources: [], error: "Kunne ikke lage hashtag fra emne" };
  }

  // Test alle kombinasjoner av instanser og hashtags parallelt
  const checks: Array<{
    instance: string;
    hashtag: string;
    promise: Promise<{ rssUrl: string; hasContent: boolean } | null>;
  }> = [];

  for (const instance of MASTODON_INSTANCES) {
    for (const hashtag of hashtags.slice(0, 2)) {
      // Begrens til 2 hashtag-varianter per instans
      checks.push({
        instance,
        hashtag,
        promise: checkMastodonHashtag(instance, hashtag),
      });
    }
  }

  const results = await Promise.allSettled(checks.map((c) => c.promise));

  const sources: DiscoveredSource[] = [];
  const seenRssUrls = new Set<string>();

  results.forEach((result, idx) => {
    if (result.status !== "fulfilled" || !result.value) return;
    const { rssUrl, hasContent } = result.value;
    if (seenRssUrls.has(rssUrl)) return;
    seenRssUrls.add(rssUrl);

    const { instance, hashtag } = checks[idx];
    sources.push({
      url: `https://${instance}/tags/${hashtag}`,
      rssUrl,
      method: "mastodon",
      title: `#${hashtag} på ${instance}`,
      description: `Mastodon-hashtag #${hashtag} på instansen ${instance}`,
      // Konfidens avhenger av om det er innhold
      confidence: hasContent ? 0.45 : 0.2,
      discoveredAt: now,
    });
  });

  return { method: "mastodon", sources };
}
