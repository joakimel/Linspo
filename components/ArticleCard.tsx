import type { ArticleWithFeedback, ArticleFeedback } from "@/lib/types";
import { getFeedback } from "@/lib/types";
import { formatShortDateNb } from "@/lib/date";
import { ArticleActions } from "./ArticleActions";

interface Props {
  article: ArticleWithFeedback;
  /** Hvis true: vis feedback som read-only + lest-dato, ingen interaktive knapper */
  archive?: boolean;
}

const REACTION_ICON: Record<ArticleFeedback["reaction"], string> = {
  positive: "👍",
  neutral: "🤷",
  negative: "👎",
};

export function ArticleCard({ article, archive = false }: Props) {
  const feedback = getFeedback(article);

  return (
    <article className="rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <h2 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline">
          {article.title}
        </h2>

        {article.summary && (
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {article.summary}
          </p>
        )}

        {article.key_takeaway && (
          <p className="mt-3 border-l-2 border-indigo-500 pl-3 text-sm italic text-neutral-600 dark:text-neutral-400">
            {article.key_takeaway}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {article.published_at && (
            <span title="Publiseringsdato">
              Publisert {formatShortDateNb(new Date(article.published_at))}
            </span>
          )}

          {article.reading_time !== null && (
            <span>{article.reading_time} min lesetid</span>
          )}

          {article.difficulty && (
            <span className="uppercase tracking-wide">{article.difficulty}</span>
          )}

          {article.learning_value !== null && (
            <span aria-label={`Læringsverdi ${article.learning_value} av 10`}>
              Læringsverdi {article.learning_value}/10
            </span>
          )}
        </div>
      </a>

      {archive ? (
        <ArchiveFeedbackView article={article} feedback={feedback} />
      ) : (
        <ArticleActions
          articleId={article.id}
          initialReaction={feedback?.reaction ?? null}
          initialNote={feedback?.note ?? null}
        />
      )}
    </article>
  );
}

function ArchiveFeedbackView({
  article,
  feedback,
}: {
  article: ArticleWithFeedback;
  feedback: ArticleFeedback | null;
}) {
  const readDate = article.read_at
    ? new Date(article.read_at).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mt-4 border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {readDate && <span>Lest {readDate}</span>}
      {feedback && (
        <span className="ml-3">
          {REACTION_ICON[feedback.reaction]}
          {feedback.note && <span className="ml-2 italic">«{feedback.note}»</span>}
        </span>
      )}
    </div>
  );
}
