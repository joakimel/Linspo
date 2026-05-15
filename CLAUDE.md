# Linspo — Claude Code briefing

Personlig faglig kurator og læringsassistent. PWA som henter kuratert innhold daglig, lager AI-sammendrag, foreslår læringsoppgaver og leverer ukentlig digest. Eier: Joakim Eldén.

## Status

Research og konsept er **ferdig**. Tech stack er **vedtatt**. Neste steg er å scaffolde MVP.

## Vedtatt stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind v4
- **PWA:** Serwist
- **Backend:** Next.js API Routes (serverless)
- **DB + Auth:** Supabase (Postgres), region `eu-central-1` (Frankfurt)
- **AI:** Gemini 2.5 Flash (primær), Groq (fallback)
- **Cron:** GitHub Actions
- **Hosting:** Cloudflare Pages
- **E-post:** Resend.com

Full arkitektur og databaseskjema: `06-dev/architecture_proposal.md`.
MVP-spec og fasebeskrivelse: `02-documentation/Linspo_Outline_og_Konseptplan.md`.

## Mappestruktur

```
01-research/       — Research, konkurranseanalyse, markedsinnsikt
02-documentation/  — Outline, konseptplan, ADR-er (kommer)
03-design/         — UX, interaksjon, visuelle valg
04-planning/       — Roadmap
05-resources/      — Referanser, inspirasjon
06-dev/            — Teknisk dokumentasjon (IKKE koden — den kommer i rot)
```

**Når Next.js-appen scaffoldes skal den ligge i ROT** (`app/`, `components/`, `lib/`, `package.json` osv.). Ikke inne i `06-dev/`. Cloudflare Pages og verktøykjede forventer kode i rot.

## Kritiske prinsipper

- **Språk:** Norsk i konsept-, produkt- og dokumentasjonstekst. Engelsk i kode og tekniske identifikatorer.
- **Fargeblindhet:** Joakim er fargeblind. Bruk ALDRI rød/grønn som eneste distinktor — kombiner alltid med form, ikon eller tekst. Streak-farger: indigo/blå.
- **Kostnadsmål:** $0/mnd i MVP-fasen. Hold deg innenfor gratis-tier på Supabase, Gemini, Cloudflare osv.
- **Personvern:** Supabase i EU-region. DPA må sjekkes med Supabase og Google før produksjonsbruk.
- **Sikkerhet:** RLS aktivert på alle Supabase-tabeller. `CRON_SECRET` som env, aldri hardkodet. `.env.local` i `.gitignore`.

## Det vi IKKE skal gjøre (ennå)

- Microservices, Kubernetes, event sourcing — monolitt er riktig nå.
- Push-notifikasjoner på iOS i EU/EØS (DMA-begrensning) — bruk e-post i stedet.
- Leaderboards — feil kontekst for faglig læring.
- Skalere arkitektur før 500 aktive brukere.

## Byggrekkefølge (MVP)

1. Supabase-prosjekt i `eu-central-1`, tabeller, RLS, Auth
2. `npx create-next-app@latest` i rot (ikke i `06-dev/`)
3. Serwist + Supabase-klient
4. HackerNews Algolia API som første innholdskilde
5. Gemini Flash for sammendrag
6. Enkel kortbasert feed-visning
7. GitHub Actions cron `0 5 * * *`
8. Cloudflare Pages deploy + UptimeRobot for keep-alive

Mer detaljer i outline-dokumentet under `02-documentation/`.
