/**
 * index.ts — Hoved-orkestrering av kilde-oppdagelses-systemet for Linspo.
 *
 * Kjører alle strategier parallelt og merger resultater.
 * RSS-verifisering gjøres på topp-kandidatene etter dedup/ranking.
 */

import type { DiscoveredSource, DiscoveryMethod, DiscoveryResult, StrategyResult } from "./types.js";
import { discoverViaWikipedia } from "./strategies/wikipedia.js";
import { discoverViaLlm } from "./strategies/llm-suggest.js";
import { discoverViaMastodon } from "./strategies/mastodon.js";
import { discoverViaReddit } from "./strategies/reddit.js";
import { discoverViaAwesomeLists } from "./strategies/awesome-lists.js";
import { discoverViaHnAlgolia } from "./strategies/hn-algolia.js";
import { deduplicateAndRank } from "./rank.js";
import { verifyRssBatch } from "./verify.js";

export type { DiscoveredSource, DiscoveryResult, DiscoveryMethod };

export interface DiscoveryOptions {
  /** Strategier å hoppe over (for testing/feilsøking) */
  skipStrategies?: DiscoveryMethod[];
  /** Maksimalt antall kandidater å returnere (standard: 30) */
  maxResults?: number;
  /** Verifiser RSS for topp-kandidater (standard: true) */
  verifyRss?: boolean;
  /** Antall kandidater å verifisere RSS for (standard: 20) */
  verifyTopN?: number;
}

type StrategyFn = (topic: string) => Promise<StrategyResult>;

// "manual" er ikke en oppdagelses-strategi — det er metoden brukeren bruker når
// de legger til en kilde selv. Inkludert i DiscoveryMethod-typen for å spore
// opprinnelse i database, men ikke kjørbar her.
const STRATEGIES: Record<Exclude<DiscoveryMethod, "manual">, StrategyFn> = {
  wikipedia: discoverViaWikipedia,
  "llm-suggest": discoverViaLlm,
  mastodon: discoverViaMastodon,
  reddit: discoverViaReddit,
  "awesome-lists": discoverViaAwesomeLists,
  "hn-algolia": discoverViaHnAlgolia,
};

/**
 * Oppdager kilde-kandidater for et gitt emne.
 *
 * @param topic   Emne-streng (norsk eller engelsk)
 * @param options Konfigurasjon for hvilke strategier som kjøres
 * @returns       DiscoveryResult med rangerte kandidater
 */
export async function discoverSources(
  topic: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const {
    skipStrategies = [],
    maxResults = 30,
    verifyRss: shouldVerify = true,
    verifyTopN = 20,
  } = options;

  const startTime = Date.now();

  // Bygg liste over strategier som skal kjøres
  const activeStrategies = (Object.keys(STRATEGIES) as Array<Exclude<DiscoveryMethod, "manual">>).filter(
    (method) => !skipStrategies.includes(method)
  );

  // Kjør alle strategier parallelt
  const strategyPromises = activeStrategies.map(async (method): Promise<StrategyResult> => {
    try {
      return await STRATEGIES[method](topic);
    } catch (err) {
      return {
        method,
        sources: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const results = await Promise.allSettled(strategyPromises);

  // Samle resultater
  const allSources: DiscoveredSource[] = [];
  const strategiesErrored: Record<DiscoveryMethod, string> = {} as Record<DiscoveryMethod, string>;

  results.forEach((result, idx) => {
    const method = activeStrategies[idx];
    if (result.status === "rejected") {
      strategiesErrored[method] = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
      return;
    }
    if (result.value.error) {
      strategiesErrored[method] = result.value.error;
    }
    allSources.push(...result.value.sources);
  });

  // Dedupliser og ranger
  const ranked = deduplicateAndRank(allSources, maxResults * 2);

  // Verifiser RSS for topp-N kandidater
  let verified = ranked;

  if (shouldVerify && ranked.length > 0) {
    const toVerify = ranked.slice(0, verifyTopN);
    const urlsToVerify: string[] = [];

    for (const source of toVerify) {
      // Hvis vi allerede har en rssUrl fra en strategi, verifiser den
      // Ellers prøv å finne RSS fra hoved-URL
      urlsToVerify.push(source.rssUrl ?? source.url);
    }

    const verificationResults = await verifyRssBatch(urlsToVerify, 5);

    verified = ranked.map((source, idx) => {
      if (idx >= verifyTopN) return source;

      const checkedUrl = source.rssUrl ?? source.url;
      const verification = verificationResults.get(checkedUrl);

      if (!verification) return source;

      return {
        ...source,
        rssUrl: verification.rssUrl ?? source.rssUrl,
        // Oppdater konfidens basert på verifisering
        confidence: verification.hasRss
          ? Math.min(1.0, source.confidence + 0.2)
          : Math.max(0.0, source.confidence - 0.1),
        title: verification.feedTitle || source.title,
      };
    });
  }

  // Final ranking etter verifisering
  const finalSources = deduplicateAndRank(verified, maxResults);

  return {
    topic,
    sources: finalSources,
    durationMs: Date.now() - startTime,
    strategiesUsed: activeStrategies,
    strategiesErrored,
  };
}
