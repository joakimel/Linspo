const META_PATTERNS: RegExp[] = [
  /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
  /<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:description["']/i,
  /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
];

const USER_AGENT = "Linspo/0.1 (faglig kurator; +https://github.com/joakimel/Linspo)";

export async function extractArticleContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,no;q=0.8",
      },
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("html")) return null;

    const html = (await res.text()).slice(0, 500_000);

    for (const pattern of META_PATTERNS) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const text = decodeEntities(match[1]).trim();
        if (text.length >= 30) return text.slice(0, 2000);
      }
    }

    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = pRegex.exec(html)) !== null && paragraphs.length < 6) {
      const text = m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 80) paragraphs.push(decodeEntities(text));
    }

    const combined = paragraphs.join(" ").slice(0, 2000);
    return combined.length >= 80 ? combined : null;
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
