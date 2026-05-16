/**
 * Typer for kilde-oppdagelses-systemet i Linspo.
 * Alle strategier returnerer DiscoveredSource[].
 */

export type DiscoveryMethod =
  | "wikipedia"
  | "llm-suggest"
  | "mastodon"
  | "reddit"
  | "awesome-lists"
  | "hn-algolia"
  | "manual";

export interface DiscoveredSource {
  /** Nettside-URL (kanonisk, uten trailing slash) */
  url: string;

  /** Direkte RSS/Atom-URL hvis verifisert, ellers null */
  rssUrl: string | null;

  /** Hvilken strategi oppdaget denne kilden */
  method: DiscoveryMethod;

  /** Menneskelesbart navn på kilden */
  title: string;

  /** Kort beskrivelse hvis tilgjengelig */
  description?: string;

  /**
   * Konfidens-score 0–1 for at dette er en relevant, høykvalitets kilde.
   * 1.0 = verifisert RSS + høy relevans, 0.0 = usikker spekulasjon.
   */
  confidence: number;

  /** Tidspunkt for oppdagelse */
  discoveredAt: string;

  /** Rådata fra LLM-begrunnelse, hvis relevant */
  llmRationale?: string;
}

export interface DiscoveryResult {
  topic: string;
  sources: DiscoveredSource[];
  durationMs: number;
  strategiesUsed: DiscoveryMethod[];
  strategiesErrored: Record<DiscoveryMethod, string>;
}

export interface StrategyResult {
  method: DiscoveryMethod;
  sources: DiscoveredSource[];
  error?: string;
}

/** Minimalt RSS-verifiserings-svar */
export interface RssVerificationResult {
  hasRss: boolean;
  rssUrl: string | null;
  feedTitle?: string;
}
