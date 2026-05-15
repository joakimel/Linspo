# Linspo

**Personlig faglig kurator og læringsassistent.**

Linspo henter relevant innhold basert på brukerens interesser, prioriterer faglig verdi over clickbait, og gjør passiv konsumering om til aktiv læring.

## Status

🟢 **Lokal MVP fungerer.** Pipeline kjører end-to-end: HackerNews → Gemini 2.5 Flash → Supabase → forside. Strikt MVP — én bruker (Joakim), uten auth, kun HackerNews. Deploy til Cloudflare Pages gjenstår.

Se `CLAUDE.md` for full prosjektkontekst, `02-documentation/decisions/ADR-001-*` for tech-stack-beslutninger, og `02-documentation/Linspo_Outline_og_Konseptplan.md` for fasebeskrivelse.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres) · Gemini 2.5 Flash · Cloudflare Pages (planlagt) · GitHub Actions (cron)

## Kjøre lokalt

```bash
npm install
cp .env.example .env.local
# Fyll inn SUPABASE_SECRET_KEY og GEMINI_API_KEY i .env.local
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

### Manuell trigger av cron-jobben

```bash
source .env.local
curl -X POST http://localhost:3000/api/cron/fetch-content \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Kodestruktur

```
app/                          Next.js App Router
  api/cron/fetch-content/     POST-endepunkt som henter HN → Gemini → Supabase
  page.tsx                    Daglig feed (server-rendered)
components/                   Presenterende UI-komponenter
lib/
  ai/gemini.ts                Gemini Flash-wrapper med JSON-output
  content/hackernews.ts       HN Algolia API-klient
  content/fetch-pipeline.ts   Orchestrerer: HN → AI → DB
  types.ts                    Delte TypeScript-typer
utils/supabase/
  server.ts                   Server-klient (publishable key, read-only)
  admin.ts                    Admin-klient (secret key, kun cron)
supabase/migrations/          SQL-migrasjoner
```

## Dokumentasjon

Konsept og planlegging ligger i `01-research/` til `06-dev/`. Se rot-mappens README-er for innholdet i hver.
