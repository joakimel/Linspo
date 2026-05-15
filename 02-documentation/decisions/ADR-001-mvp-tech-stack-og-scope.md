# ADR-001: MVP tech stack og scope

**Dato:** 2026-05-15
**Status:** Godkjent

## Kontekst

Forskning og konseptfase ga en helhetlig arkitekturanbefaling i `06-dev/architecture_proposal.md`, men flere konkrete valg måtte fattes før implementering kunne starte:

- Hvor strikt skal MVP være — én bruker uten auth, eller full Supabase Auth fra start?
- Hvilken package manager?
- Hvor i repoet skal Next.js-koden ligge?
- Hvordan håndtere AI-rate-limit i gratis-tier?

## Beslutning

**MVP-scope:** Strikt MVP — kun én bruker (Joakim selv), ingen auth, kun HackerNews som innholdskilde, ingen UI-polish. Hensikten er å lære fra reell bruk så raskt som mulig.

**Tech stack:**

| Lag | Valg | Versjon (2026-05-15) |
|---|---|---|
| Frontend | Next.js (App Router, Turbopack) + TypeScript | 16.2.6 |
| Styling | Tailwind CSS | 4.x via `@tailwindcss/postcss` |
| Database + Auth | Supabase (Postgres) i `eu-central-1` | — |
| AI | Gemini 2.5 Flash via `@google/generative-ai` | 0.24.x |
| Innholdskilde | HackerNews Algolia API | — |
| Package manager | npm | 11.x |
| Cron (planlagt) | GitHub Actions | — |
| Hosting (planlagt) | Cloudflare Pages | — |

**Repostruktur:** Next.js-koden bor i rot (`app/`, `lib/`, `components/`, `utils/`, `package.json`). Nummererte mapper (`01-research/`, `02-documentation/`, osv.) er ren dokumentasjon — ikke kode. `06-dev/` inneholder teknisk *dokumentasjon*, ikke kildekode.

**Rate-limit-strategi:** Gemini 2.5 Flash gratis-tier er **5 requests per minutt** (ikke 15 som først antatt). Pipeline sover 13 sekunder mellom AI-kall (`GEMINI_THROTTLE_MS`) og prosesserer maks 10 artikler per cron-kjøring (`maxToProcess`). Total kjøretid: ~2.5 minutter lokalt for 10 artikler.

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| MVP med Supabase Auth fra start | Mer kompleksitet før vi ser noe fungere. Auth kan legges til senere uten omarbeid på `articles`-tabellen. |
| SvelteKit eller Remix | Mindre community, vanskeligere å finne svar/hjelp underveis. |
| Bun som package manager | Nyere verktøy med flere edge-cases. npm er trygt valg for første prosjekt. |
| Next.js-koden i `06-dev/linspo/` | Cloudflare Pages og verktøykjeden forventer kode i rot. Subfolder-deploy gir unødvendig kompleksitet. |
| Hoppe over rate-limit-håndtering | Reell test viste 13 av 20 artikler feilet med 429-feil uten throttling. Uakseptabelt. |
| Bytte til mindre Gemini-modell (Flash Lite) | Lavere sammendragskvalitet. Sleep-løsning gir oss både kvalitet og gratis-tier. |

## Konsekvenser

**Positivt:**
- Lokal MVP funksjonell etter én økt (2026-05-15)
- Klart deploy-spor mot Fase 6
- Rate-limit-løsning holder oss innenfor $0/mnd-målet

**Negativt / utestående:**
- 2.5 minutters cron-kjøring **overskrider Cloudflare Workers 30s timeout**. Må løses i Fase 6, sannsynligvis ved å flytte tunge jobben til GitHub Actions-runner (Node, ingen tidsgrense) som kaller Supabase og Gemini direkte, ikke via en serverless route på Cloudflare.
- Maks 10 artikler per kjøring betyr at vi må kjøre cron 2-3 ganger ved oppstart, eller justere `maxToProcess` opp i deployet versjon hvis vi flytter til GitHub Actions.
- Ingen auth betyr en liten refaktor på data-laget når brukere kommer (Fase 2 i outline). `articles` deles fortsatt mellom alle brukere, så endringen blir minimal.

**Avhengigheter framover:**
- Når Fase 2 (personalisering) starter: legg til `user_preferences`, `user_article_interactions`, koble Supabase Auth.
- Når Fase 6 (deploy) starter: bestem endelig cron-arkitektur (GitHub Actions med Node-runner anbefales).
