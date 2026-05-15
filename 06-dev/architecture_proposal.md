# Konkret arkitekturforslag for Linspo

## Overordnet stack (anbefalt)

```
Frontend:    Next.js 16 (App Router) + TypeScript
PWA:         Serwist (service worker + offline-støtte)
Styling:     Tailwind CSS v4
Backend:     Next.js API Routes (serverless functions)
Database:    Supabase (PostgreSQL)
Auth:        Supabase Auth
AI:          Gemini 2.5 Flash (primær) + Groq (fallback)
Cron:        GitHub Actions (daglig) → Supabase Edge Functions (fremtid)
Hosting:     Cloudflare Pages (gratis, ubegrenset båndbredde)
Storage:     Supabase Storage (artikkelbilder)
```

**Estimert månedlig kostnad i MVP-fasen: $0**

---

## Systemkomponenter og dataflyt

```
┌─────────────────────────────────────────────────────────────────┐
│                        EKSTERN INNHOLD                          │
│  HackerNews API  │  Guardian API  │  DEV.to API  │  RSS-feeds  │
└────────────────────────────┬────────────────────────────────────┘
                             │ daglig (kl 05:00 UTC)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT FETCHER                              │
│              (GitHub Actions cron job)                          │
│  1. Hent nye artikler fra alle kilder                           │
│  2. Filtrer duplikater (URL-hash sjekk mot DB)                  │
│  3. Filtrer for kort innhold (<300 ord)                         │
│  4. Send til AI Summarizer                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI SUMMARIZER                                │
│              (Next.js API Route / Supabase Edge Function)       │
│  Input:  Artikkeltittel + innhold                               │
│  Model:  Gemini 2.5 Flash                                       │
│  Output: {summary, learning_value, tags, difficulty,           │
│           reading_time, key_takeaway}                           │
│  Lagres til: articles-tabell i Supabase                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                           │
│                                                                 │
│  articles          user_preferences    user_article_interactions│
│  ─────────         ────────────────    ───────────────────────  │
│  id                user_id             user_id                  │
│  url               topics[]            article_id               │
│  title             skill_level         read_at                  │
│  summary           feedback_history    reaction (👍/👎/skip)    │
│  learning_value    last_updated        saved                    │
│  tags[]                                                         │
│  difficulty        weekly_digests                               │
│  source            ──────────────                               │
│  published_at      id                                           │
│  fetched_at        user_id                                      │
│  content_hash      week_number                                  │
│                    articles[]                                   │
│                    tasks[]                                      │
│                    generated_at                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                USER PREFERENCE ENGINE                           │
│              (Next.js serverless function)                      │
│  Tar inn:  Brukerens topics, skill_level, feedback_history      │
│  Gjør:     Scorer alle nye artikler mot brukerens profil        │
│  Metode:   Vektet scoring (uten AI-kall – kun database-query)   │
│  Output:   Rangert liste med artikler for denne brukeren        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND (PWA)                       │
│                  Cloudflare Pages                               │
│                                                                 │
│  /              – Daglig feed (personalisert)                   │
│  /saved         – Lagrede artikler                              │
│  /digest        – Ukentlig oppsummering                         │
│  /settings      – Interesser, vanskelighetsgrad, emner          │
│  /onboarding    – Første gangs oppsett                          │
│                                                                 │
│  Service Worker (Serwist):                                      │
│  - Cache daily feed i 12 timer                                  │
│  - Offline-visning av siste feed                                │
│  - Background sync for lesestatus/feedback                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 WEEKLY DIGEST GENERATOR                         │
│           (GitHub Actions, hver søndag kl 08:00)               │
│  1. Hent alle artikler fra siste 7 dager                        │
│  2. Finn top 5 per bruker basert på læringsscore                │
│  3. Generer ukentlig sammendrag med AI                          │
│  4. Foreslå 1–2 oppgaver/refleksjoner for å forankre kunnskap   │
│  5. Lagre digest til DB + send e-post (via Resend.com gratis)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Databaseskjema (PostgreSQL / Supabase)

```sql
-- Artikler (deles mellom alle brukere)
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url             TEXT UNIQUE NOT NULL,
  content_hash    TEXT UNIQUE NOT NULL,  -- SHA-256 av innhold
  title           TEXT NOT NULL,
  summary         TEXT,                  -- AI-generert
  learning_value  INTEGER CHECK (learning_value BETWEEN 1 AND 10),
  tags            TEXT[],
  difficulty      TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  source          TEXT NOT NULL,         -- 'hackernews', 'guardian', 'devto', 'rss'
  author          TEXT,
  reading_time    INTEGER,               -- minutter
  key_takeaway    TEXT,                  -- AI-generert
  published_at    TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  ai_processed    BOOLEAN DEFAULT FALSE
);

-- Brukerpreferanser
CREATE TABLE user_preferences (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id),
  topics          TEXT[] DEFAULT '{}',  -- ['UX', 'AI', 'design systems', 'gaming']
  skill_level     TEXT DEFAULT 'intermediate',
  language        TEXT DEFAULT 'no',
  email_digest    BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Brukerinteraksjoner med artikler
CREATE TABLE user_article_interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  article_id  UUID REFERENCES articles(id),
  read_at     TIMESTAMPTZ,
  reaction    TEXT CHECK (reaction IN ('useful', 'irrelevant', 'clickbait', 'saved')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Ukentlige oppsummeringer
CREATE TABLE weekly_digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  week_number   INTEGER NOT NULL,        -- ISO uke-nummer
  year          INTEGER NOT NULL,
  article_ids   UUID[],
  summary       TEXT,                    -- AI-generert ukentlig sammendrag
  tasks         TEXT[],                  -- Foreslåtte oppgaver/refleksjoner
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number, year)
);
```

---

## Mappestruktur (Next.js)

```
linspo/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          – Auth-guard, navbar
│   │   ├── page.tsx            – Daglig feed
│   │   ├── saved/page.tsx
│   │   ├── digest/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── cron/
│   │   │   ├── fetch-content/route.ts    – Kalles av GitHub Actions
│   │   │   └── weekly-digest/route.ts
│   │   ├── articles/route.ts
│   │   ├── interactions/route.ts
│   │   └── preferences/route.ts
│   ├── layout.tsx
│   └── manifest.ts             – PWA-manifest
├── components/
│   ├── ArticleCard.tsx
│   ├── FeedList.tsx
│   ├── DigestView.tsx
│   └── PreferenceForm.tsx
├── lib/
│   ├── supabase.ts
│   ├── ai/
│   │   ├── gemini.ts
│   │   └── summarize.ts
│   ├── content/
│   │   ├── fetcher.ts
│   │   ├── rss.ts
│   │   └── sources/
│   │       ├── hackernews.ts
│   │       ├── guardian.ts
│   │       └── devto.ts
│   └── scoring/
│       └── personalize.ts
├── public/
│   ├── sw.js                   – Service worker (generert av Serwist)
│   ├── icon-192.png
│   └── icon-512.png
├── .github/
│   └── workflows/
│       ├── daily-fetch.yml
│       └── weekly-digest.yml
└── serwist.config.ts
```

---

## GitHub Actions – daglig innhenting

```yaml
# .github/workflows/daily-fetch.yml
name: Daily Content Fetch

on:
  schedule:
    - cron: '0 5 * * *'   # 05:00 UTC = 07:00 norsk tid
  workflow_dispatch:        # Mulig å kjøre manuelt

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger content fetch
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://linspo.app/api/cron/fetch-content
```

---

## Byggrekkefølge (hva bygges først)

### Fase 1 – MVP (2–4 uker)
Mål: Fungerende app for én bruker (Joakim selv)

1. **Supabase-prosjekt** – database, auth, tabeller
2. **Next.js-prosjekt** – grunnleggende oppsett, Tailwind, Serwist
3. **Én innholdskilde** – HackerNews API (enklest)
4. **AI-sammendrag** – Gemini Flash integration
5. **Enkel feed-visning** – liste med artikler + sammendrag
6. **GitHub Actions cron** – daglig henting
7. **Cloudflare Pages deploy** – oppe og kjørende

### Fase 2 – Personalisering (2–3 uker)
1. **Onboarding** – velg interesser og vanskelighetsgrad
2. **Flere innholdskilder** – Guardian, DEV.to, RSS-feeds
3. **Feedback-system** – 👍/👎/skip på artikler
4. **Personalisert scoring** – preferanse-basert rangering
5. **Lagringsfunksjon** – bookmark artikler

### Fase 3 – Digest og notifikasjoner (2–3 uker)
1. **Ukentlig digest** – AI-generert oppsummering
2. **E-postlevering** – Resend.com (3 000 gratis e-poster/mnd)
3. **Oppgaveforslag** – konkrete læringsaktiviteter
4. **PWA-manifest** – "Add to Home Screen"
5. **Push-notifikasjoner** – Android (iOS EU-begrensning gjør dette vanskelig)

### Fase 4 – Finjustering (løpende)
1. Bedre innholdskvalitet-filtrering
2. Feedback-loop til AI-prompt
3. Brukerstatistikk
4. Eventuelle betalende brukere

---

## Tredjepartsavhengigheter (komplett liste)

| Tjeneste | Formål | Gratis grense | Betalt |
|---------|--------|--------------|-------|
| Supabase | Database + Auth | 500 MB / 50k MAU | $25/mnd |
| Cloudflare Pages | Hosting | Ubegrenset BW | $5/mnd |
| GitHub Actions | Cron jobs | 2k min/mnd (privat) | Inkl. |
| Gemini Flash | AI-sammendrag | 1 500 req/dag | $0,15/1M tokens |
| Groq | Rask AI-fallback | ~30 RPM | Betalt tier |
| Guardian API | Nyhetsinnhold | 5 000 req/dag | Gratis |
| HN Algolia API | Tech-innhold | Ingen offisiell grense | Gratis |
| DEV.to API | Dev-innhold | 30 req/30 sek | Gratis |
| Resend.com | E-post (digest) | 3 000 e-poster/mnd | $20/mnd |

**Total månedlig kostnad i Fase 1–2: $0**
**Total månedlig kostnad i Fase 3 (med e-post): $0** (Resend gratis-tier)
