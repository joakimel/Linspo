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
npx tsx scripts/status-report.ts       # bruksrapport (artikler, feedback, kommentarer)
```

## Dev vs. produksjon

To Supabase-prosjekter og to git-branches holder utviklingsarbeidet separert fra MVP-en:

- **Produksjon** — branch `main`, URL `https://linspo.joakim-m-elden.workers.dev`, `Linspo-prod` Supabase-prosjekt, daglig cron via GitHub Actions kl. 07:00.
- **Dev** — branch `dev` (og andre non-main branches), `Linspo-dev` Supabase-prosjekt. Brukes lokalt (`npm run dev` → localhost:3000).

Cloudflare Workers Builds gir også preview-URL for `dev`-branchen automatisk, men den bruker fortsatt `Linspo-prod` (Workers Builds støtter ikke per-environment env-vars i nåværende UI). Preview-URL er derfor nyttig for å sjekke UI-endringer, ikke for å teste mot dev-data.

**Bytte mellom dev og prod lokalt:**

```bash
# Første gang: ta backup av .env.local som peker til prod
cp .env.local .env.local.prod

# Når du skal jobbe mot Linspo-dev:
# - Lim inn Linspo-dev sin URL + publishable + secret key i .env.local
git checkout dev
npm run dev                            # localhost:3000 mot Linspo-dev
npx tsx scripts/run-cron.ts            # seed Linspo-dev med artikler

# Tilbake til prod-tilkobling (sjeldent — typisk hvis du må kjøre noe manuelt mot prod):
cp .env.local.prod .env.local
```

Når dev-endringer er klare: merge `dev` → `main`. Cloudflare deployer prod automatisk.

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
