import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { fetchHackerNewsTopStories } from "./hackernews";
import { summarizeArticle } from "@/lib/ai/gemini";
import { contentHash } from "./content-hash";

export interface FetchPipelineResult {
  fetched: number;
  newArticles: number;
  processed: number;
  inserted: number;
  skipped: number;
  errors: Array<{ title: string; error: string }>;
}

// Gemini Flash free-tier er 5 RPM, så vi venter ~13s mellom kall.
const GEMINI_THROTTLE_MS = 13_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runFetchPipeline(
  options: { maxToProcess?: number } = {}
): Promise<FetchPipelineResult> {
  const maxToProcess = options.maxToProcess ?? 10;
  const supabase = createSupabaseAdminClient();

  const stories = await fetchHackerNewsTopStories({
    minPoints: 100,
    hoursBack: 48,
    hitsPerPage: 20,
  });

  const candidates = stories.map((s) => ({
    ...s,
    content_hash: contentHash(`${s.source}:${s.title}`),
  }));

  const urls = candidates.map((c) => c.url);
  const { data: existing, error: lookupError } = await supabase
    .from("articles")
    .select("url")
    .in("url", urls);

  if (lookupError) {
    throw new Error(`Supabase-lookup feilet: ${lookupError.message}`);
  }

  const existingUrls = new Set((existing ?? []).map((e) => e.url));
  const newOnes = candidates.filter((c) => !existingUrls.has(c.url));
  const toProcess = newOnes.slice(0, maxToProcess);

  const errors: FetchPipelineResult["errors"] = [];
  let inserted = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const article = toProcess[i];

    if (i > 0) await sleep(GEMINI_THROTTLE_MS);

    try {
      const content = article.excerpt ?? "";
      const ai = await summarizeArticle({
        title: article.title,
        content,
      });

      const { error } = await supabase.from("articles").insert({
        url: article.url,
        content_hash: article.content_hash,
        title: article.title,
        summary: ai.summary,
        learning_value: ai.learning_value,
        tags: ai.tags,
        difficulty: ai.difficulty,
        source: article.source,
        author: article.author,
        reading_time: ai.reading_time,
        key_takeaway: ai.key_takeaway,
        published_at: article.published_at,
        ai_processed: true,
      });

      if (error) throw new Error(error.message);
      inserted++;
    } catch (e) {
      errors.push({
        title: article.title,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    fetched: stories.length,
    newArticles: newOnes.length,
    processed: toProcess.length,
    inserted,
    skipped: newOnes.length - toProcess.length,
    errors,
  };
}
