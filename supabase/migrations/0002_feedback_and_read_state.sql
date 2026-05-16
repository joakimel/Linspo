-- Linspo migration 0002 — Lese-status og bruker-feedback
-- Kjøres i Supabase SQL Editor.

-- =========================================================================
-- 1. Lese-status på articles
-- =========================================================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_articles_read_at ON articles (read_at);

COMMENT ON COLUMN articles.read_at IS
  'Når brukeren markerte artikkelen som lest. NULL = uleest, går i feed.';

-- =========================================================================
-- 2. Feedback-tabell
-- =========================================================================

CREATE TABLE IF NOT EXISTS article_feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reaction     TEXT NOT NULL CHECK (reaction IN ('positive', 'neutral', 'negative')),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_feedback_article_id
  ON article_feedback (article_id);

CREATE INDEX IF NOT EXISTS idx_article_feedback_reaction
  ON article_feedback (reaction);

-- Trigger for å oppdatere updated_at automatisk
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_article_feedback_updated_at ON article_feedback;
CREATE TRIGGER trg_article_feedback_updated_at
  BEFORE UPDATE ON article_feedback
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =========================================================================
-- 3. RLS på feedback
-- =========================================================================

ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;

-- Lesing åpent for publishable key (frontend)
CREATE POLICY "Feedback is publicly readable"
  ON article_feedback FOR SELECT
  USING (TRUE);

-- INSERT/UPDATE/DELETE blokkert for publishable key.
-- Skriving skjer via secret key i API-routes (bypasser RLS).

COMMENT ON TABLE article_feedback IS
  'Brukerfeedback per artikkel: reaksjon (positiv/nøytral/negativ) + valgfri tekst-kommentar.';
