"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Reaction } from "@/lib/types";

interface Props {
  articleId: string;
  initialReaction: Reaction | null;
  initialNote: string | null;
}

const REACTIONS: Array<{ value: Reaction; label: string; aria: string }> = [
  { value: "positive", label: "👍 Bra", aria: "Positiv" },
  { value: "neutral", label: "🤷 OK", aria: "Nøytral" },
  { value: "negative", label: "👎 Dårlig", aria: "Negativ" },
];

export function ArticleActions({ articleId, initialReaction, initialNote }: Props) {
  const router = useRouter();
  const [reaction, setReaction] = useState<Reaction | null>(initialReaction);
  const [note, setNote] = useState(initialNote ?? "");
  const [showNoteInput, setShowNoteInput] = useState(Boolean(initialReaction));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function saveFeedback(newReaction: Reaction, currentNote: string) {
    setReaction(newReaction);
    setShowNoteInput(true);
    setError(null);

    const res = await fetch(`/api/articles/${articleId}/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reaction: newReaction, note: currentNote }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Kunne ikke lagre feedback");
      return;
    }
    setSavedAt(Date.now());
  }

  async function markAsRead() {
    setError(null);
    const res = await fetch(`/api/articles/${articleId}/read`, { method: "POST" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Kunne ikke markere som lest");
      return;
    }
    startTransition(() => router.refresh());
  }

  function handleNoteBlur() {
    if (!reaction) return;
    void saveFeedback(reaction, note);
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2">
        {REACTIONS.map((r) => {
          const active = reaction === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => void saveFeedback(r.value, note)}
              aria-label={r.aria}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-900 ring-2 ring-indigo-500 transition dark:bg-indigo-900 dark:text-indigo-100"
                  : "rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }
            >
              {r.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={markAsRead}
          disabled={isPending}
          className="ml-auto rounded-md border border-neutral-300 px-3 py-1 text-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {isPending ? "Lagrer…" : "Marker som lest"}
        </button>
      </div>

      {showNoteInput && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Hva tenker du om denne? (valgfritt)"
          rows={2}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        />
      )}

      {savedAt && !error && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Lagret ✓</p>
      )}

      {error && (
        <p className="text-xs text-amber-700 dark:text-amber-400">⚠ {error}</p>
      )}
    </div>
  );
}
