/**
 * rank.ts — Deduplikering og scoring av oppdagede kilde-kandidater.
 *
 * Dedup-logikk: normaliser URL (fjern trailing slash, www-prefix, http/https-varianter),
 * deretter velg beste kandidat per unik hostname.
 *
 * Scoring-faktorer (vektet):
 * - Har verifisert RSS-URL: +0.3
 * - Oppdaget av flere strategier: +0.1 per ekstra strategi (maks +0.3)
 * - LLM-foreslått: +0.15
 * - Høy basis-konfidens fra strategi: bidrar
 */

import type { DiscoveredSource } from "./types.js";

/** Normaliser en URL til kanonisk form for dedup */
function normalizeForDedup(url: string): string {
  try {
    const u = new URL(url);
    // Fjern www-prefix
    const host = u.hostname.replace(/^www\./, "");
    // Fjern trailing slash fra pathname
    const path = u.pathname.replace(/\/$/, "") || "";
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}

/** Beregn endelig konfidens-score for en (potensielt merged) kilde */
function computeScore(sources: DiscoveredSource[]): number {
  // Bruk høyeste basis-konfidens som utgangspunkt
  let base = Math.max(...sources.map((s) => s.confidence));

  // Har verifisert RSS?
  const hasRss = sources.some((s) => s.rssUrl !== null);
  if (hasRss) base = Math.min(1.0, base + 0.3);

  // Ekstra bonus for oppdagelse av flere strategier
  const uniqueMethods = new Set(sources.map((s) => s.method));
  const extraBonus = Math.min(0.3, (uniqueMethods.size - 1) * 0.1);
  base = Math.min(1.0, base + extraBonus);

  // LLM-forslag gir litt ekstra
  const hasLlm = sources.some((s) => s.method === "llm-suggest");
  if (hasLlm) base = Math.min(1.0, base + 0.05);

  return Math.round(base * 100) / 100;
}

/** Velg best kilde-data fra gruppen ved merge */
function mergeGroup(sources: DiscoveredSource[]): DiscoveredSource {
  // Foretrekk LLM-forslag for tittel/beskrivelse, ellers ta første
  const llmSource = sources.find((s) => s.method === "llm-suggest");
  const rssSource = sources.find((s) => s.rssUrl !== null);
  const primary = llmSource ?? rssSource ?? sources[0];

  const allMethods = [...new Set(sources.map((s) => s.method))];

  return {
    url: primary.url,
    rssUrl: rssSource?.rssUrl ?? null,
    // Saml alle brukte metoder i method-feltet — velg den med høyest konfidens som "primær"
    method: sources.reduce((a, b) => (a.confidence >= b.confidence ? a : b)).method,
    title: primary.title,
    description: primary.description ?? sources.find((s) => s.description)?.description,
    confidence: computeScore(sources),
    discoveredAt: primary.discoveredAt,
    llmRationale:
      llmSource?.llmRationale ?? sources.find((s) => s.llmRationale)?.llmRationale,
  };
}

/**
 * Dedupliser og ranger en liste med oppdagede kilder.
 *
 * @param sources   Rå liste fra alle strategier (kan ha duplikater)
 * @param maxResults Maks antall resultater å returnere (sortert høyest konfidens)
 */
export function deduplicateAndRank(
  sources: DiscoveredSource[],
  maxResults = 50
): DiscoveredSource[] {
  // Grupper etter normalisert URL
  const groups = new Map<string, DiscoveredSource[]>();

  for (const source of sources) {
    const key = normalizeForDedup(source.url);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(source);
  }

  // Merge hver gruppe
  const merged: DiscoveredSource[] = [];
  for (const group of groups.values()) {
    merged.push(mergeGroup(group));
  }

  // Sorter etter konfidens (høyest først)
  merged.sort((a, b) => b.confidence - a.confidence);

  return merged.slice(0, maxResults);
}
