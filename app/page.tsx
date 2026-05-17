import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleWithFeedback } from "@/lib/types";
import { formatFullDateNb, isoWeekNumber } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const now = new Date();
  const week = isoWeekNumber(now);
  const dateLabel = formatFullDateNb(now);
  const limit = Number(process.env.LINSPO_DAILY_LIMIT) || 20;

  const { data: articles, error } = await supabase
    .from("articles")
    .select("*, feedback:article_feedback(*)")
    .eq("ai_processed", true)
    .gte("learning_value", 4)
    .is("read_at", null)
    .order("fetched_at", { ascending: false })
    .order("learning_value", { ascending: false })
    .limit(limit);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Uke {week} · {dateLabel}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Linspo"
              className="mt-2 h-12 w-auto dark:invert"
            />
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Linspo: just your interest, no distractions.
            </p>
          </div>
          <Link
            href="/arkiv"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Arkiv
          </Link>
        </div>
      </header>

      {error ? (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Klarte ikke å hente artikler: {error.message}
        </p>
      ) : !articles || articles.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ingen uleste artikler. Cron-jobben kjører automatisk hver morgen kl. 07:00.
        </p>
      ) : (
        <ul className="space-y-6">
          {(articles as ArticleWithFeedback[]).map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
