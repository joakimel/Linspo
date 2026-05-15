import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { fetchAllSources } from "./sources";
import { extractArticleContent } from "./extract";
import { summarizeArticle } from "@/lib/ai/gemini";
import { contentHash } from "./content-hash";

export interface FetchPipelineResult {
  fetched: number;
  newArticles: number;
  extractionFailed: number;
  processed: number;
  inserted: number;
  lowQualitySkipped: number;
  errors: Array<{ title: string; error: string }>;
}

// gemini-2.5-flash-lite tillater 15 RPM → 4s minimum; vi bruker 5s buffer.
// Bytt til 13_000 hvis du går tilbake til "gemini-2.5-flash" (5 RPM).
const GEMINI_THROTTLE_MS = 5_000;
const MIN_CONTENT_LENGTH = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runFetchPipeline(
  options: { maxToProcess?: number } = {}
): Promise<FetchPipelineResult> {
  const maxToProcess = options.maxToProcess ?? 10;
  const supabase = createSupabaseAdminClient();

  const stories = await fetchAllSources();

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

  // Ta inn flere kandidater enn vi trenger — noen vil feile på extraction
  const candidatePool = newOnes.slice(0, maxToProcess * 2);

  // Parallell henting av innhold for de uten excerpt (eller med tynt excerpt)
  await Promise.all(
    candidatePool.map(async (a) => {
      if (!a.excerpt || a.excerpt.length < MIN_CONTENT_LENGTH) {
        const extracted = await extractArticleContent(a.url);
        if (extracted) a.excerpt = extracted;
      }
    })
  );

  const withContent = candidatePool.filter(
    (a) => a.excerpt && a.excerpt.length >= MIN_CONTENT_LENGTH
  );
  const toProcess = withContent.slice(0, maxToProcess);

  const errors: FetchPipelineResult["errors"] = [];
  let inserted = 0;
  let lowQualitySkipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    if (i > 0) await sleep(GEMINI_THROTTLE_MS);

    const article = toProcess[i];
    try {
      const ai = await summarizeArticle({
        title: article.title,
        url: article.url,
        content: article.excerpt ?? "",
      });

      // Hvis AI bekrefter at den ikke klarte verifisere, lagre med ai_processed=false
      // så vi ikke prøver igjen, men ikke vis i feeden
      if (ai.learning_value === 0) {
        await supabase.from("articles").insert({
          url: article.url,
          content_hash: article.content_hash,
          title: article.title,
          summary: ai.summary,
          tags: [],
          source: article.source,
          author: article.author,
          published_at: article.published_at,
          ai_processed: false,
        });
        lowQualitySkipped++;
        continue;
      }

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
    extractionFailed: candidatePool.length - withContent.length,
    processed: toProcess.length,
    inserted,
    lowQualitySkipped,
    errors,
  };
}
