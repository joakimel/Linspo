# Linspo

**Personlig faglig kurator og læringsassistent.**

Linspo henter relevant innhold basert på brukerens interesser, prioriterer faglig verdi over clickbait, og gjør passiv konsumering om til aktiv læring.

## Status

🟢 **SOLO-MVP deployet** (2026-05-16) — live på `https://linspo.joakim-m-elden.workers.dev`. Joakim som eneste bruker, daglig automatisk innhenting, lest-status og 3-veis feedback på plass. Fase 2 (auth + flere brukere) kommer etter 1-2 ukers bruk og analyse av feedback-data.

Se `CLAUDE.md` for full prosjektkontekst, `02-documentation/decisions/` for alle ADR-er, og `02-documentation/Linspo_Outline_og_Konseptplan.md` for opprinnelig fasebeskrivelse.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, EU) · Gemini 2.5 Flash Lite · Cloudflare Worker via OpenNext · GitHub Actions cron

## Kjøre lokalt

```bash
npm install
cp .env.example .env.local
# Fyll inn SUPABASE_SECRET_KEY og GEMINI_API_KEY i .env.local

npm run dev                            # dev server på localhost:3000
npx tsc --noEmit                       # type-check
npx tsx scripts/run-cron.ts            # kjør pipeline lokalt
```

## Kodestruktur

```
app/                                 Next.js App Router
  page.tsx                           Daglig feed (force-dynamic)
  arkiv/page.tsx                     Leste artikler + stats
  privacy/page.tsx                   Personvernerklæring
  api/articles/[id]/{read,feedback}  Bruker-aksjoner
  api/cron/fetch-content             Manuell cron-trigger
components/
  ArticleCard.tsx                    Server-komponent
  ArticleActions.tsx                 Client — reaksjoner + lest-knapp
lib/
  ai/gemini.ts                       Gemini-wrapper
  content/                           Pipeline (sources, extract, fetch-pipeline)
  content/discovery/                 Kilde-oppdagelses-system + paywall-detector
  date.ts, types.ts
scripts/run-cron.ts                  Standalone Node-cron
utils/supabase/                      Server- og admin-klienter
supabase/migrations/                 SQL-migrasjoner
.github/workflows/daily-fetch.yml    GitHub Actions cron
```

## Dokumentasjon

| Mappe | Innhold |
|---|---|
| `01-research/` | Markedsanalyse, konkurrentanalyse, agentrapporter om kilder + AI-bruk |
| `02-documentation/` | Outline, konseptplan, ADR-001 til ADR-005 |
| `03-design/` | UX-anbefalinger, interaksjonsmønstre, visuelle valg |
| `04-planning/` | Roadmap |
| `05-resources/` | Referanser og inspirasjon |
| `06-dev/` | Teknisk dokumentasjon: arkitektur, infra, AI, gotchas |
