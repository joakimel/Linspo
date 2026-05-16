# Linspo — Claude Code briefing

Personlig faglig kurator og læringsassistent. PWA som henter kuratert innhold daglig, lager AI-sammendrag, og lar brukeren markere lest + gi 3-veis feedback. Eier: Joakim Eldén.

## Status (2026-05-16)

🟢 **SOLO-MVP er deployet og kjører i produksjon.**

- Live på `https://linspo.joakim-m-elden.workers.dev`
- Daglig cron-jobb (07:00 norsk tid) henter automatisk nye artikler
- Feedback-system med "marker som lest", 3-veis reaksjoner, tekst-kommentar
- /arkiv-side med stats og leste artikler
- /privacy-side med personvernerklæring

**Neste fase (om 1-2 uker):** Analyser feedback-data, bygg AI-vekting basert på mønstre. Deretter Fase 2 (auth, onboarding, flere brukere).

## Hva som er bygget

```
app/
  page.tsx                              Forside — dagens feed (force-dynamic)
  arkiv/page.tsx                        Arkiv — leste artikler + stats
  privacy/page.tsx                      Personvernerklæring
  layout.tsx                            Root layout (Geist font, norsk lang)
  globals.css                           Tailwind v4 + dark mode
  api/cron/fetch-content/route.ts       Manuell cron-trigger via HTTP (Bearer auth)
  api/articles/[id]/read/route.ts       POST = marker lest, DELETE = angre
  api/articles/[id]/feedback/route.ts   POST = upsert reaksjon+note, DELETE = slett

components/
  ArticleCard.tsx                       Server — viser kort, har "archive"-modus
  ArticleActions.tsx                    Client ("use client") — reaksjons-UI + lest-knapp

lib/
  ai/gemini.ts                          Gemini 2.5 Flash Lite wrapper, anti-fabrikasjon
  content/
    fetch-pipeline.ts                   Orchestrerer: kilder → extract → AI → DB
    sources.ts                          Aggregator (HN topic-søk + 8 RSS-feeder, interleavet)
    hackernews.ts                       HN Algolia, 8 topic-søk parallelt
    rss.ts                              Generisk RSS/Atom-parser + keywordFilter
    extract.ts                          og:description / meta description / <p>-fallback
    content-hash.ts                     SHA-256 for dedupe
    discovery/                          Generelt kilde-oppdagelses-system (Fase 2-fundament)
      index.ts, cli.ts, rank.ts, verify.ts, types.ts
      manual.ts, manual-cli.ts          Validering for brukerlagte kilder
      paywall.ts                        Paywall-deteksjon
      strategies/                       6 strategier (wikipedia, llm-suggest, mastodon,
                                        reddit, awesome-lists, hn-algolia)
  date.ts                               Norske dato-hjelpere (isoWeekNumber, formatXxx)
  types.ts                              Article, ArticleWithFeedback, getFeedback() helper

scripts/
  run-cron.ts                           Standalone Node-script for GitHub Actions cron

utils/supabase/
  server.ts                             Read-only klient (publishable key)
  admin.ts                              Skrive-klient (secret key)

supabase/migrations/
  0001_initial_schema.sql               articles + RLS
  0002_feedback_and_read_state.sql      read_at + article_feedback

.github/workflows/
  daily-fetch.yml                       GitHub Actions cron, Node 22, 05:00 UTC

open-next.config.ts                     OpenNext Cloudflare adapter
wrangler.jsonc                          Cloudflare Worker config (nodejs_compat)
public/logo.svg                         Linspo wordmark
```

## Vedtatt stack

- **Frontend:** Next.js 16.2.6 (App Router, Turbopack) + TypeScript + Tailwind v4
- **Hosting:** Cloudflare Worker via `@opennextjs/cloudflare`
- **DB:** Supabase (Postgres) i `eu-central-1` (Frankfurt)
- **AI:** Gemini 2.5 Flash Lite (15 RPM, 1000 RPD free tier)
- **Cron:** GitHub Actions Node 22 (ikke Cloudflare-endepunkt — Workers har 30s-timeout)

Detaljerte beslutninger: ADR-001 til ADR-005 i `02-documentation/decisions/`.

## Innholdskilder (per 2026-05-16)

Hardkodede kilder i SOLO-MVP (`lib/content/sources.ts`). Brukerlagte kilder + discovery-systemet aktiveres i Fase 2.

| Kilde | Type | Hva |
|---|---|---|
| HackerNews | Algolia API, 8 topic-søk | UX, design systems, Claude Code, Anthropic, Steam Deck, MSI Claw, ROG Ally, handheld gaming |
| Smashing Magazine | RSS | UX/UI/frontend |
| UX Collective (uxdesign.cc) | RSS | UX-metodikk |
| Nielsen Norman Group | RSS | Brukerinnsikt-research |
| Retro Handhelds | RSS | Håndholdte spillkonsoller |
| Liliputing | RSS | Håndholdte, mini-PCer |
| Tom's Hardware | RSS + keywordFilter | Bredt tech, filtrert på handheld-emner |
| Gaming On Linux | RSS | Linux + Steam Deck gaming |
| The Verge Tech | RSS | Bredt tech inkl. AI/handhelds |
| The Verge Gaming | RSS | Gaming-nyheter |

## Kritiske prinsipper

- **Språk:** Norsk i UI, README-er, ADR-er, commit-meldinger. Engelsk i kode-identifikatorer.
- **Fargeblindhet:** Joakim er fargeblind. ALDRI rød/grønn som eneste distinktor — kombiner med form/ikon/tekst. Streak-/aksent-farger: indigo.
- **Kostnadsmål:** $0/mnd. Holder Supabase, Gemini, Cloudflare, GitHub Actions innenfor free tier.
- **Personvern:** Supabase i EU-region. DPA må sjekkes med Google (Gemini) før Fase 2.
- **Sikkerhet:** RLS på alle Supabase-tabeller. Secret keys kun i `.env.local` + Cloudflare/GitHub secrets.
- **AI-output-validering:** Pipeline har anti-fabrikasjons-prompt + content extraction. Sett `learning_value >= 4` som forside-filter mot AI-feilvurderinger.

## Kjøre lokalt

```bash
npm install
cp .env.example .env.local
# Fyll inn SUPABASE_SECRET_KEY og GEMINI_API_KEY

npm run dev                            # dev server på localhost:3000
npx tsc --noEmit                       # type-check
npm run build && npx opennextjs-cloudflare build  # full produksjons-build
npx tsx scripts/run-cron.ts            # kjør pipeline lokalt (henter+lagrer artikler)

# Discovery-CLI (Fase 2-fundament, ikke aktivt i SOLO-MVP):
npx tsx lib/content/discovery/cli.ts "topic"
npx tsx lib/content/discovery/manual-cli.ts <url>
```

## Deployment

- **Cloudflare:** Auto-deploys ved push til `main` via Workers Builds-integrasjon. URL: `https://linspo.joakim-m-elden.workers.dev`
- **Cron:** GitHub Actions kjører `.github/workflows/daily-fetch.yml` automatisk hver morgen kl. 05:00 UTC, eller manuelt via Actions-fanen.

## Det som UTSETTES (post-MVP, Fase 2+)

- Auth (Supabase Auth, Google OAuth)
- Onboarding med interesse-velger og discovery-integrasjon
- Brukerlagte kilder (form i UI, schema for `user_topics`/`user_topic_sources`)
- AI-vekting basert på feedback-data (kommer etter 1-2 uker med ekte data)
- Ukentlig digest via e-post (Resend)
- PWA-installasjon + Serwist
- UptimeRobot keep-alive

## Neste konkrete steg

Joakim bruker SOLO-MVP-en i 1-2 uker, gir feedback naturlig. Etter det:
1. Analyser feedback-data i Supabase SQL Editor
2. Identifiser mønstre (kilder/tags som scorer høyt/lavt, prompt-treff vs. miss)
3. Skriv ADR-006 for valgt vektings-strategi
4. Implementer i `fetch-pipeline.ts` (sannsynligvis i `lib/content/sources.ts` for vekting)
