import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleWithFeedback } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arkiv — Linspo",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface ArchiveStats {
  total: number;
  thisWeek: number;
  positive: number;
  neutral: number;
  negative: number;
  withoutFeedback: number;
  avgLearningValue: number | null;
}

function buildStats(articles: ArticleWithFeedback[]): ArchiveStats {
  const now = Date.now();
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let withoutFeedback = 0;
  let thisWeek = 0;
  let lvSum = 0;
  let lvCount = 0;

  for (const a of articles) {
    if (a.read_at && now - new Date(a.read_at).getTime() < WEEK_MS) thisWeek++;

    if (a.learning_value !== null) {
      lvSum += a.learning_value;
      lvCount++;
    }

    const fb = Array.isArray(a.feedback) ? a.feedback[0] : null;
    if (!fb) withoutFeedback++;
    else if (fb.reaction === "positive") positive++;
    else if (fb.reaction === "neutral") neutral++;
    else if (fb.reaction === "negative") negative++;
  }

  return {
    total: articles.length,
    thisWeek,
    positive,
    neutral,
    negative,
    withoutFeedback,
    avgLearningValue: lvCount > 0 ? lvSum / lvCount : null,
  };
}

export default async function ArkivPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, feedback:article_feedback(*)")
    .eq("ai_processed", true)
    .not("read_at", "is", null)
    .order("read_at", { ascending: false })
    .limit(100);

  const articles = (data ?? []) as ArticleWithFeedback[];
  const stats = buildStats(articles);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Tilbake til feed
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Arkiv</h1>
      </header>

      {error ? (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Klarte ikke å hente arkivet: {error.message}
        </p>
      ) : (
        <>
          <section className="mb-8 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBlock label="Lest totalt" value={String(stats.total)} />
              <StatBlock label="Denne uka" value={String(stats.thisWeek)} />
              <StatBlock
                label="Snitt læringsverdi"
                value={
                  stats.avgLearningValue !== null
                    ? `${stats.avgLearningValue.toFixed(1)}/10`
                    : "—"
                }
              />
              <StatBlock
                label="Uten feedback"
                value={String(stats.withoutFeedback)}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <span>👍 {stats.positive}</span>
              <span>😐 {stats.neutral}</span>
              <span>👎 {stats.negative}</span>
            </div>
          </section>

          {articles.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Du har ikke lest noen artikler ennå. Marker en artikkel som lest i feeden
              for å begynne å bygge arkivet.
            </p>
          ) : (
            <ul className="space-y-6">
              {articles.map((article) => (
                <li key={article.id}>
                  <ArticleCard article={article} archive />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
