import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import type { Article } from "@/lib/types";

// Force-dynamic så build ikke pre-renderer (env-variabler er ikke tilgjengelig
// ved build-tid i Cloudflare). Cloudflare/CDN-cacheing kan håndteres senere
// via response headers hvis vi vil.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("ai_processed", true)
    .gte("learning_value", 4)
    .order("fetched_at", { ascending: false })
    .order("learning_value", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Linspo"
          className="h-12 w-auto dark:invert"
        />
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
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
