-- Linspo MVP — initial schema
-- Strikt MVP: kun articles-tabell, ingen brukerrelaterte tabeller (kommer i fase 2).
-- Skrevet for å kjøres i Supabase SQL Editor.

-- =========================================================================
-- Tabell: articles
-- Hovedtabell for kuratert innhold med AI-genererte sammendrag.
-- Deles mellom alle brukere (ingen user-relasjon i MVP).
-- =========================================================================
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url             TEXT UNIQUE NOT NULL,
  content_hash    TEXT UNIQUE NOT NULL,                 -- SHA-256 av tittel+kilde for dedupe
  title           TEXT NOT NULL,
  summary         TEXT,                                  -- AI-generert
  learning_value  INTEGER CHECK (learning_value BETWEEN 1 AND 10),
  tags            TEXT[] DEFAULT '{}',
  difficulty      TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  source          TEXT NOT NULL,                         -- 'hackernews', 'guardian', osv.
  author          TEXT,
  reading_time    INTEGER,                               -- minutter
  key_takeaway    TEXT,                                  -- AI-generert
  published_at    TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_processed    BOOLEAN NOT NULL DEFAULT FALSE
);

-- =========================================================================
-- Indekser
-- =========================================================================

-- Feed-spørring: siste artikler først
CREATE INDEX idx_articles_fetched_at ON articles (fetched_at DESC);

-- Personalisering (fremtidig): sortere på læringsverdi blant prosesserte
CREATE INDEX idx_articles_learning_value
  ON articles (learning_value DESC)
  WHERE ai_processed = TRUE;

-- =========================================================================
-- Row Level Security
-- =========================================================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Lesing: åpent for alle (publishable key i frontend)
CREATE POLICY "Articles are publicly readable"
  ON articles FOR SELECT
  USING (TRUE);

-- Ingen INSERT/UPDATE/DELETE-policy = blokkert via publishable key.
-- Cron-jobben bruker secret key som bypasser RLS, så den kan skrive fritt.

-- =========================================================================
-- Kommentarer (vises i Supabase Table Editor)
-- =========================================================================

COMMENT ON TABLE articles IS 'Kuratert innhold med AI-genererte sammendrag. Delt mellom alle brukere.';
COMMENT ON COLUMN articles.content_hash IS 'SHA-256 av tittel+kilde for å unngå duplikater på tvers av kilder.';
COMMENT ON COLUMN articles.learning_value IS 'AI-vurdert læringsverdi (1=lavt, 10=høyt).';
COMMENT ON COLUMN articles.ai_processed IS 'TRUE når AI har generert summary, tags, learning_value osv.';
