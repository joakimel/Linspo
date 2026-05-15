import { XMLParser } from "fast-xml-parser";
import type { FetchedArticle } from "@/lib/types";

const USER_AGENT = "Linspo/0.1 (faglig kurator; +https://github.com/joakimel/Linspo)";

export interface RssFeedConfig {
  url: string;
  source: string;
  maxItems?: number;
  // Hvis satt: bare ta vare på artikler hvor tittel eller excerpt inneholder
  // minst ett av disse nøkkelordene (case-insensitive). Brukes for å filtrere
  // brede feeder (f.eks. Tom's Hardware) ned til relevant innhold.
  keywordFilter?: string[];
}

export async function fetchRssFeed(config: RssFeedConfig): Promise<FetchedArticle[]> {
  const maxItems = config.maxItems ?? 10;

  try {
    const res = await fetch(config.url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
      },
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@",
      textNodeName: "_text",
      parseTagValue: false,
    });
    const parsed = parser.parse(xml);

    let items: FetchedArticle[] = [];

    // RSS 2.0
    const rssChannelItems = parsed?.rss?.channel?.item;
    if (rssChannelItems) {
      const raw = Array.isArray(rssChannelItems) ? rssChannelItems : [rssChannelItems];
      items = raw
        .map((item: unknown) => normalizeRssItem(item, config.source))
        .filter((a): a is FetchedArticle => a !== null);
    } else {
      // Atom
      const atomEntries = parsed?.feed?.entry;
      if (atomEntries) {
        const raw = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
        items = raw
          .map((item: unknown) => normalizeAtomEntry(item, config.source))
          .filter((a): a is FetchedArticle => a !== null);
      }
    }

    if (config.keywordFilter && config.keywordFilter.length > 0) {
      const filters = config.keywordFilter.map((k) => k.toLowerCase());
      items = items.filter((item) => {
        const haystack = `${item.title} ${item.excerpt ?? ""}`.toLowerCase();
        return filters.some((kw) => haystack.includes(kw));
      });
    }

    return items.slice(0, maxItems);
  } catch {
    return [];
  }
}

type AnyRecord = Record<string, unknown>;

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

function normalizeRssItem(item: unknown, source: string): FetchedArticle | null {
  if (typeof item !== "object" || item === null) return null;
  const it = item as AnyRecord;

  const title = textOf(it.title).trim();
  const link = textOf(it.link).trim();
  if (!title || !link) return null;

  const rawDescription = textOf(it.description) || textOf(it["content:encoded"]);
  const description = stripHtml(rawDescription);
  const author = textOf(it["dc:creator"]) || textOf(it.author) || null;
  const pubDate = textOf(it.pubDate) || textOf(it["dc:date"]) || null;
  const id = textOf(it.guid) || link;

  return {
    external_id: id,
    url: link,
    title,
    author: author || null,
    published_at: pubDate ? safeIsoDate(pubDate) : null,
    source,
    excerpt: description ? description.slice(0, 2000) : null,
  };
}

function normalizeAtomEntry(entry: unknown, source: string): FetchedArticle | null {
  if (typeof entry !== "object" || entry === null) return null;
  const e = entry as AnyRecord;

  const title = textOf(e.title).trim();

  let link = "";
  if (Array.isArray(e.link)) {
    const alt = e.link.find(
      (l) => typeof l === "object" && l !== null && (l as AnyRecord)["@rel"] !== "self"
    );
    if (alt && typeof alt === "object") link = String((alt as AnyRecord)["@href"] ?? "");
  } else if (typeof e.link === "object" && e.link !== null) {
    link = String((e.link as AnyRecord)["@href"] ?? "");
  } else if (typeof e.link === "string") {
    link = e.link;
  }
  if (!title || !link) return null;

  const summary = stripHtml(textOf(e.summary) || textOf(e.content));
  let author: string | null = null;
  if (typeof e.author === "object" && e.author !== null) {
    author = textOf((e.author as AnyRecord).name) || null;
  } else if (typeof e.author === "string") {
    author = e.author;
  }

  const pubDate = textOf(e.published) || textOf(e.updated) || null;
  const id = textOf(e.id) || link;

  return {
    external_id: id,
    url: link,
    title,
    author,
    published_at: pubDate ? safeIsoDate(pubDate) : null,
    source,
    excerpt: summary ? summary.slice(0, 2000) : null,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeIsoDate(raw: string): string | null {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}
