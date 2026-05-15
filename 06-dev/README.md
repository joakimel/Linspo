# Dev

Tekniske beslutninger, arkitektur og infrastrukturnotater.

> **Merk:** Selve Next.js-appen vil ligge på rotnivå av repoet (`app/`, `components/`, `package.json` osv.) når den scaffoldes. Denne mappen er for *teknisk dokumentasjon*, ikke kode.

## Innhold

- `architecture_proposal.md` — Komplett arkitektur, dataflyt og databaseskjema
- `pwa_architecture.md` — PWA-spesifikt (Serwist, service worker, offline)
- `hosting_and_infra.md` — Cloudflare Pages, GitHub Actions, Supabase-region
- `ai_integration.md` — Gemini Flash, prompts, fallback-strategi
- `gotchas_and_risks.md` — Kjente fallgruver og mitigeringer

## Vedtatt stack (MVP)

| Lag | Valg |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| PWA | Serwist |
| Database | Supabase (Postgres) — `eu-central-1` |
| Auth | Supabase Auth |
| AI | Gemini 2.5 Flash (primær), Groq (fallback) |
| Cron | GitHub Actions |
| Hosting | Cloudflare Pages |
| E-post | Resend.com |

**Estimert månedlig kostnad i MVP-fasen: $0**

Se `architecture_proposal.md` for detaljer og databaseskjema.

## ADR-er

Når arkitekturbeslutninger formaliseres, lag ADR-er under `02-documentation/decisions/`.
