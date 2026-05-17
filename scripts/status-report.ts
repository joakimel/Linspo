/**
 * status-report.ts — Skriver ut en bruksrapport for MVP-en.
 *
 * Kjør lokalt: `npx tsx scripts/status-report.ts`
 *
 * Henter alle artikler + feedback fra Supabase og krysstabulerer:
 *   - Antall artikler per dag / per kilde
 *   - Leserate
 *   - Reaksjons-fordeling per kilde, per tag, per difficulty
 *   - Alle frie tekst-kommentarer (gull til AI-vekting senere)
 *
 * Trenger SUPABASE_SECRET_KEY i .env.local (eller env).
 */

import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;

if (!URL || !KEY) {
  console.error("Mangler NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SECRET_KEY");
  process.exit(1);
}

type Article = {
  id: string;
  source: string;
  title: string;
  tags: string[] | null;
  difficulty: string | null;
  learning_value: number;
  published_at: string;
  read_at: string | null;
};

type Feedback = {
  article_id: string;
  reaction: "positive" | "neutral" | "negative";
  note: string | null;
  updated_at: string;
};

async function get<T>(pathPart: string): Promise<T> {
  const res = await fetch(`${URL}/rest/v1/${pathPart}`, {
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

function count<T>(items: T[], key: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return m;
}

function pad(s: string | number, w: number) {
  return String(s).padEnd(w);
}

async function main() {
  const arts = await get<Article[]>(
    "articles?select=id,source,title,tags,difficulty,learning_value,published_at,read_at",
  );
  const fbs = await get<Feedback[]>(
    "article_feedback?select=article_id,reaction,note,updated_at",
  );
  const fbByAid = new Map(fbs.map((f) => [f.article_id, f]));

  console.log(`\n=== STATUS ${new Date().toISOString().slice(0, 10)} ===`);
  console.log(`Artikler totalt: ${arts.length}`);
  const read = arts.filter((a) => a.read_at).length;
  console.log(
    `Leste: ${read} (${arts.length ? Math.round((100 * read) / arts.length) : 0}%)`,
  );
  const lv4 = arts.filter((a) => a.learning_value >= 4).length;
  console.log(`LV>=4 (forside-kvalifisert): ${lv4}/${arts.length}`);
  console.log(`Feedback-rader: ${fbs.length}`);
  console.log(`Med kommentar: ${fbs.filter((f) => f.note).length}\n`);

  console.log("=== ARTIKLER PER DAG ===");
  const perDay = count(arts, (a) => a.published_at.slice(0, 10));
  [...perDay.entries()]
    .sort()
    .forEach(([d, n]) => console.log(`  ${d}: ${n}`));

  console.log("\n=== KILDE × REAKSJON (av artikler med feedback) ===");
  console.log(`${pad("Kilde", 18)} ${pad("pos", 5)}${pad("neu", 5)}${pad("neg", 5)}totalt`);
  const sourceTotals = count(arts, (a) => a.source);
  const sourceReact = new Map<string, Record<string, number>>();
  for (const a of arts) {
    const f = fbByAid.get(a.id);
    if (!f) continue;
    const r = sourceReact.get(a.source) ?? { positive: 0, neutral: 0, negative: 0 };
    r[f.reaction]++;
    sourceReact.set(a.source, r);
  }
  [...sourceTotals.keys()].sort().forEach((src) => {
    const r = sourceReact.get(src) ?? { positive: 0, neutral: 0, negative: 0 };
    console.log(
      `${pad(src, 18)} ${pad(r.positive, 5)}${pad(r.neutral, 5)}${pad(r.negative, 5)}${sourceTotals.get(src)}`,
    );
  });

  console.log("\n=== TAG × REAKSJON (sortert på pos − neg/neu) ===");
  const tagPos = new Map<string, number>();
  const tagOther = new Map<string, number>();
  for (const a of arts) {
    const f = fbByAid.get(a.id);
    if (!f) continue;
    for (const t of a.tags ?? []) {
      if (f.reaction === "positive") tagPos.set(t, (tagPos.get(t) ?? 0) + 1);
      else tagOther.set(t, (tagOther.get(t) ?? 0) + 1);
    }
  }
  const allTags = new Set([...tagPos.keys(), ...tagOther.keys()]);
  const tagRows = [...allTags]
    .map((t) => ({ t, p: tagPos.get(t) ?? 0, n: tagOther.get(t) ?? 0 }))
    .sort((a, b) => b.p - b.n - (a.p - a.n) || b.p - a.p);
  console.log(`${pad("tag", 25)} ${pad("pos", 5)}neu/neg`);
  console.log("-- topp --");
  tagRows.slice(0, 12).forEach((r) => console.log(`${pad(r.t, 25)} ${pad(r.p, 5)}${r.n}`));
  console.log("-- bunn --");
  tagRows.slice(-10).forEach((r) => console.log(`${pad(r.t, 25)} ${pad(r.p, 5)}${r.n}`));

  console.log("\n=== DIFFICULTY × REAKSJON ===");
  const diffReact = new Map<string, Record<string, number>>();
  for (const a of arts) {
    const f = fbByAid.get(a.id);
    if (!f) continue;
    const d = a.difficulty ?? "?";
    const r = diffReact.get(d) ?? { positive: 0, neutral: 0, negative: 0 };
    r[f.reaction]++;
    diffReact.set(d, r);
  }
  for (const [d, r] of diffReact) {
    console.log(`  ${pad(d, 14)} pos:${r.positive}  neu:${r.neutral}  neg:${r.negative}`);
  }

  console.log("\n=== ALLE TEKST-KOMMENTARER (kronologisk) ===");
  const artById = new Map(arts.map((a) => [a.id, a]));
  const notes = fbs
    .filter((f) => f.note)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  for (const f of notes) {
    const a = artById.get(f.article_id);
    const flag = f.reaction === "positive" ? "+" : f.reaction === "negative" ? "-" : "~";
    console.log(`\n  [${flag}] ${a?.source ?? "?"} — "${a?.title ?? "?"}"`);
    console.log(`      ${f.note}`);
  }
  console.log();
}

main().catch((err) => {
  console.error("Feil:", err);
  process.exit(2);
});
