# Linspo — Claude Code briefing

Personlig faglig kurator og læringsassistent. PWA som henter kuratert innhold daglig, lager AI-sammendrag, foreslår læringsoppgaver og leverer ukentlig digest. Eier: Joakim Eldén.

## Status (2026-05-15)

🟢 **Lokal MVP fungerer end-to-end.** HackerNews → Gemini 2.5 Flash → Supabase → forside med kuratert kortliste. ~17 artikler i basen, ingen rate-limit-feil.

**Gjenstår:** Deploy til Cloudflare Pages + GitHub Actions cron + UptimeRobot. Se Fase 6 i `bright-whistling-perlis`-planen og `ADR-001`.

## Hva som er bygget

```
app/api/cron/fetch-content/route.ts   POST-endepunkt, auth via CRON_SECRET
app/page.tsx                          Daglig feed (SSR, ISR revalidate=300)
components/ArticleCard.tsx            Kort med tittel, sammendrag, key takeaway, tags
lib/ai/gemini.ts                      Gemini-wrapper med JSON-output
lib/content/hackernews.ts             HN Algolia-fetcher
lib/content/fetch-pipeline.ts         HN → AI → Supabase med rate-limit-throttling
lib/content/content-hash.ts           SHA-256 for dedupe
lib/types.ts                          Article, AISummary
utils/supabase/server.ts              Read-only klient (publishable key)
utils/supabase/admin.ts               Skrive-klient (secret key, kun cron)
supabase/migrations/0001_*.sql        articles-tabell + RLS-policy
```

## Vedtatt stack

- **Frontend:** Next.js 16.2.6 (App Router, Turbopack) + TypeScript + Tailwind v4
- **DB + Auth:** Supabase (Postgres), region `eu-central-1` (Frankfurt)
- **AI:** Gemini 2.5 Flash (5 RPM gratis-tier → 13s throttle mellom kall)
- **Cron:** GitHub Actions (planlagt — se note om Cloudflare-timeout under)
- **Hosting:** Cloudflare Pages (planlagt)
- **E-post (Fase 3):** Resend.com

Full arkitektur og databaseskjema: `06-dev/architecture_proposal.md`.
ADR med begrunnelser for valgene: `02-documentation/decisions/ADR-001-mvp-tech-stack-og-scope.md`.
Outline: `02-documentation/Linspo_Outline_og_Konseptplan.md`.

## Mappestruktur

```
app/, components/, lib/, utils/  Next.js-koden (rot)
supabase/migrations/             SQL-migrasjoner
01-research/                     Research, konkurranseanalyse
02-documentation/                Outline + ADR-er
03-design/                       UX, interaksjon, visuelle valg
04-planning/                     Roadmap
05-resources/                    Referanser, inspirasjon
06-dev/                          Teknisk dokumentasjon (ikke kildekode)
```

## Kritiske prinsipper

- **Språk:** Norsk i UI, README-er, ADR-er, commit-meldinger. Engelsk i kode-identifikatorer.
- **Fargeblindhet:** Joakim er fargeblind. Bruk ALDRI rød/grønn som eneste distinktor — kombiner alltid med form, ikon eller tekst. Streak-/aksent-farger: indigo (`#4f46e5` / Tailwind `indigo-500`).
- **Kostnadsmål:** $0/mnd i MVP-fasen. Hold deg innenfor gratis-tier (Supabase, Gemini, Cloudflare, GitHub Actions).
- **Personvern:** Supabase i EU-region. DPA må sjekkes med Supabase og Google før produksjonsbruk.
- **Sikkerhet:** RLS aktivert på alle Supabase-tabeller. `CRON_SECRET`, `SUPABASE_SECRET_KEY` og `GEMINI_API_KEY` kun i `.env.local` (gitignored) og deploy-secrets.
- **Rate limit:** Gemini Flash gratis-tier er 5 RPM. Hvis du øker `maxToProcess` eller fjerner sleep, vil deler av batchen feile med 429.

## Det vi IKKE skal gjøre (ennå)

- Microservices, Kubernetes, event sourcing — monolitt er riktig nå.
- Push-notifikasjoner på iOS i EU/EØS (DMA-begrensning) — bruk e-post i stedet.
- Leaderboards — feil kontekst for faglig læring.
- Skalere arkitektur før 500 aktive brukere.

## Kjøre lokalt

```bash
npm install
cp .env.example .env.local
# Fyll inn SUPABASE_SECRET_KEY og GEMINI_API_KEY
npm run dev

# Trigge cron manuelt (henter ~10 nye artikler, tar ~2.5 min):
set -a && source .env.local && set +a
curl -X POST http://localhost:3000/api/cron/fetch-content \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Neste konkrete steg

Fase 6 i planen: **Deploy + produksjons-cron.** Spesielt: bestem om cron skal være GitHub Actions med Node-runner (anbefalt) eller chunked Cloudflare cron. Se `ADR-001 → Konsekvenser` for detaljer.
