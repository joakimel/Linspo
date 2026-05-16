/**
 * paywall.ts — Heuristisk paywall-deteksjon for kilder.
 *
 * Brukes ved manuell kildelegging (og som validering på LLM-foreslåtte kilder)
 * for å hindre at brukerens feed domineres av teaser-only items.
 *
 * Sjekkene er heuristiske — de gir false positives (paywall.com merket som fri)
 * og false negatives (free.com merket som paywall). Returnerer en konfidens-score
 * så UI kan skille mellom "definitivt paywall" og "muligens paywall".
 */

import { XMLParser } from "fast-xml-parser";

const USER_AGENT = "Linspo/0.1 (https://github.com/joakimel/Linspo)";
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Domener med kjent fullstendig paywall.
 * Sammenligning gjøres mot hostname uten leading "www.".
 */
const KNOWN_PAYWALL_DOMAINS: ReadonlySet<string> = new Set([
  "nytimes.com",
  "wsj.com",
  "ft.com",
  "theinformation.com",
  "economist.com",
  "bloomberg.com",
  "newyorker.com",
  "theatlantic.com",
  "harpers.org",
  "newscientist.com",
  "scientificamerican.com",
  "dn.no",          // norsk Dagens Næringsliv
  "morgenbladet.no",
  "klassekampen.no",
  "aftenposten.no", // delvis paywall, men strengt
]);

/**
 * Domener med delvis paywall (noe innhold gratis, noe ikke).
 * Behandles som "muligens paywall" — gir warning, ikke avvisning.
 */
const PARTIAL_PAYWALL_DOMAINS: ReadonlySet<string> = new Set([
  "medium.com",
  "wired.com",
  "stratechery.com",
  "platformer.news",
  "vg.no",
  "nrk.no",         // mest gratis, men noen artikler kun bak NRK Pluss
  "tu.no",
]);

export type PaywallSignalType =
  | "http_402"
  | "known_paywall_domain"
  | "partial_paywall_domain"
  | "teaser_only_feed"
  | "low_volume_feed"
  | "medium_locked_marker"
  | "substack_paid_marker"
  | "subscribe_call_to_action";

export type PaywallSeverity = "definite" | "likely" | "possible";

export interface PaywallSignal {
  type: PaywallSignalType;
  severity: PaywallSeverity;
  description: string;
}

export interface PaywallCheck {
  isPaywalled: boolean;
  /** 0.0 (ikke paywall) til 1.0 (definitivt paywall) */
  confidence: number;
  signals: PaywallSignal[];
  /** Kort summary egnet for UI */
  reason: string;
}

/**
 * Hovedfunksjon: gjør alle paywall-sjekker for en gitt URL.
 *
 * `feedUrl` brukes for RSS-content-analyser. Hvis ikke gitt, hentes hoved-URL-en.
 */
export async function checkPaywall(
  url: string,
  feedUrl?: string
): Promise<PaywallCheck> {
  const signals: PaywallSignal[] = [];

  // 1. Domene-sjekk
  let hostname = "";
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return {
      isPaywalled: false,
      confidence: 0,
      signals: [],
      reason: "Ugyldig URL — kan ikke sjekke paywall",
    };
  }

  if (KNOWN_PAYWALL_DOMAINS.has(hostname)) {
    signals.push({
      type: "known_paywall_domain",
      severity: "definite",
      description: `${hostname} er på listen over kjente paywall-domener`,
    });
  } else if (PARTIAL_PAYWALL_DOMAINS.has(hostname)) {
    signals.push({
      type: "partial_paywall_domain",
      severity: "possible",
      description: `${hostname} har delvis paywall — noe innhold er gratis, noe ikke`,
    });
  }

  // 2. HTTP-status-sjekk på selve URL-en
  const httpResult = await fetchUrl(url);
  if (httpResult.status === 402) {
    signals.push({
      type: "http_402",
      severity: "definite",
      description: "HTTP 402 Payment Required",
    });
  }

  // 3. Substack-sjekk (alle Substack-domener)
  if (hostname.endsWith(".substack.com")) {
    if (httpResult.body && /subscribe\s+to\s+read|paid\s+subscribers?\s+only/i.test(httpResult.body)) {
      signals.push({
        type: "substack_paid_marker",
        severity: "likely",
        description: "Substack-side viser 'Subscribe to read'-tekst",
      });
    }
  }

  // 4. RSS content-quality-analyse
  const rssTarget = feedUrl ?? (httpResult.body ? null : url);
  if (rssTarget || feedUrl) {
    const feedAnalysis = await analyzeFeedQuality(feedUrl ?? url);
    if (feedAnalysis.signals.length > 0) {
      signals.push(...feedAnalysis.signals);
    }
  }

  // Aggreger konfidens
  const hasDefinite = signals.some((s) => s.severity === "definite");
  const likelyCount = signals.filter((s) => s.severity === "likely").length;
  const possibleCount = signals.filter((s) => s.severity === "possible").length;

  let confidence = 0;
  if (hasDefinite) confidence = 1.0;
  else if (likelyCount >= 2) confidence = 0.85;
  else if (likelyCount === 1) confidence = 0.7;
  else if (possibleCount >= 2) confidence = 0.5;
  else if (possibleCount === 1) confidence = 0.3;

  const isPaywalled = confidence >= 0.5;

  const reason =
    signals.length === 0
      ? "Ingen paywall-indikatorer funnet"
      : signals.map((s) => s.description).join("; ");

  return { isPaywalled, confidence, signals, reason };
}

interface FetchResult {
  status: number;
  body: string;
  contentType: string;
}

async function fetchUrl(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    return { status: res.status, body: body.slice(0, 200_000), contentType };
  } catch {
    return { status: 0, body: "", contentType: "" };
  }
}

interface FeedAnalysis {
  signals: PaywallSignal[];
}

async function analyzeFeedQuality(feedUrl: string): Promise<FeedAnalysis> {
  const result = await fetchUrl(feedUrl);
  if (!result.body || result.status === 0) {
    return { signals: [] };
  }

  let parsed: unknown;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@",
      textNodeName: "_text",
      parseTagValue: false,
    });
    parsed = parser.parse(result.body);
  } catch {
    return { signals: [] };
  }

  const items = extractItems(parsed);
  if (items.length === 0) {
    return { signals: [] };
  }

  const signals: PaywallSignal[] = [];
  const sample = items.slice(0, Math.min(20, items.length));

  // 1. Sjekk for medium:isLockedContent
  const mediumLocked = sample.filter(
    (i) => i["medium:isLockedContent"] === "true" || i["medium:isLockedContent"] === true
  ).length;
  if (mediumLocked >= Math.ceil(sample.length * 0.5)) {
    signals.push({
      type: "medium_locked_marker",
      severity: "likely",
      description: `${mediumLocked}/${sample.length} items er markert som "membership only" på Medium`,
    });
  }

  // 2. Teaser-deteksjon: kort description + subscribe-CTA
  const teaserItems = sample.filter((item) => {
    const desc = stripHtml(textOf(item.description) || textOf(item["content:encoded"]) || "");
    const isShort = desc.length < 80;
    const hasSubscribeCta = /subscribe|sign\s*up|read\s+more.*subscribers?|kun\s+for\s+abonnenter|bli\s+abonnent/i.test(desc);
    return isShort || hasSubscribeCta;
  });

  if (teaserItems.length >= Math.ceil(sample.length * 0.8)) {
    signals.push({
      type: "teaser_only_feed",
      severity: "likely",
      description: `${teaserItems.length}/${sample.length} items har kort description (<80 tegn) eller subscribe-CTA — tyder på teaser-only feed`,
    });
  }

  // 3. Lav volum-sjekk (under 3 items totalt = mistenkelig)
  if (items.length < 3) {
    signals.push({
      type: "low_volume_feed",
      severity: "possible",
      description: `Bare ${items.length} items i feeden — kan være paywall som blokkerer eller en død blogg`,
    });
  }

  // 4. Sjekk for explicit subscribe-CTA i feed-tittel/beskrivelse
  const channelText = `${textOf(getChannel(parsed)?.title)} ${textOf(getChannel(parsed)?.description)}`;
  if (/paid\s+subscribers?|premium\s+only|members?\s+only\s+content/i.test(channelText)) {
    signals.push({
      type: "subscribe_call_to_action",
      severity: "likely",
      description: "Feed-tittel/beskrivelse indikerer betalt innhold",
    });
  }

  return { signals };
}

type AnyRecord = Record<string, unknown>;

function extractItems(parsed: unknown): AnyRecord[] {
  if (!parsed || typeof parsed !== "object") return [];
  const p = parsed as AnyRecord;

  // RSS 2.0: rss.channel.item
  const channelItems = getChannel(parsed)?.item;
  if (channelItems) {
    return (Array.isArray(channelItems) ? channelItems : [channelItems]) as AnyRecord[];
  }

  // Atom: feed.entry
  const feed = p.feed as AnyRecord | undefined;
  const entries = feed?.entry;
  if (entries) {
    return (Array.isArray(entries) ? entries : [entries]) as AnyRecord[];
  }

  return [];
}

function getChannel(parsed: unknown): AnyRecord | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as AnyRecord;
  const rss = p.rss as AnyRecord | undefined;
  const channel = rss?.channel;
  return channel && typeof channel === "object" ? (channel as AnyRecord) : null;
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const v = value as AnyRecord;
    if (typeof v._text === "string") return v._text;
    if (typeof v["#text"] === "string") return v["#text"];
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
