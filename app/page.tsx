import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import type { Article } from "@/lib/types";

export const revalidate = 300;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("ai_processed", true)
    .order("fetched_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Linspo</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Din daglige pakke med faglig innhold.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Klarte ikke å hente artikler: {error.message}
        </p>
      ) : !articles || articles.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ingen artikler ennå. Kjør cron-jobben manuelt eller vent til neste planlagte kjøring.
        </p>
      ) : (
        <ul className="space-y-6">
          {(articles as Article[]).map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
