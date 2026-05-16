import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_REACTIONS = new Set(["positive", "neutral", "negative"]);

/**
 * Lagre eller oppdater feedback for en artikkel.
 * Body: { reaction: 'positive' | 'neutral' | 'negative', note?: string }
 *
 * UNIQUE-constraint på article_id betyr at upsert oppdaterer eksisterende rad.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.reaction !== "string" || !VALID_REACTIONS.has(body.reaction)) {
    return NextResponse.json(
      {
        error:
          "Mangler eller ugyldig 'reaction'. Må være 'positive', 'neutral' eller 'negative'.",
      },
      { status: 400 }
    );
  }

  const note =
    typeof body.note === "string" && body.note.trim().length > 0
      ? body.note.trim().slice(0, 2000)
      : null;

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("article_feedback")
    .upsert(
      {
        article_id: id,
        reaction: body.reaction,
        note,
      },
      { onConflict: "article_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Slett feedback (angre) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("article_feedback").delete().eq("article_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
