# ADR-004: SOLO-MVP deploy — OpenNext + Cloudflare Worker

**Dato:** 2026-05-16
**Status:** Godkjent

## Kontekst

ADR-001 fastslo Cloudflare Pages som hosting-mål. Da vi faktisk skulle deploye, oppdaget vi flere ting som måtte avgjøres:

1. **`@cloudflare/next-on-pages` støtter ikke Next.js 16.** Pakken begrenset til Next ≤15.5.2 per peer-dependency. Vi er på 16.2.6.
2. **Build-time env-variabler mangler i Cloudflare.** Forsiden (`app/page.tsx`) prøvde å hente data fra Supabase ved build-tid (via `revalidate=300` ISR). Build-runneren har ikke env-variablene.
3. **Node 20 mangler WebSocket.** GitHub Actions runner satt opp med Node 20 feilet fordi `@supabase/realtime-js` krever WebSocket-klient.

## Beslutning

### 1. Bytt til `@opennextjs/cloudflare`

Cloudflare har gått over til OpenNext-adapteren som den anbefalte veien for nyere Next.js-versjoner. Deploys som **Cloudflare Worker** (ikke Pages), men med assets-binding fungerer det effektivt som hosting for hele appen.

Filer som ble lagt til:
- `open-next.config.ts` — minimal config (`defineCloudflareConfig()`)
- `wrangler.jsonc` — Worker-config med:
  - `compatibility_date: "2025-03-01"`
  - `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`
  - `assets: { directory: ".open-next/assets", binding: "ASSETS", run_worker_first: true }`
  - `observability: { enabled: true }`

Build-kommando: `npm run build && npx opennextjs-cloudflare build`
Deploy-kommando: `npx wrangler deploy`

Cloudflare-dashbordets "Workers Builds" (Git-integrasjon, nytt 2025-2026) kobler `joakimel/Linspo` og kjører dette automatisk på push til `main`.

### 2. Force-dynamic på alle sider med DB-tilgang

`app/page.tsx` og `app/arkiv/page.tsx` har `export const dynamic = "force-dynamic"`. Disse rendres på hver request, ikke ved build. Env-variabler kreves kun ved runtime, hvor Cloudflare har dem.

Dette ofrer ISR-cacheing, men SOLO-MVP har trivielt trafikk og sidene er raske å rendre uansett.

### 3. GitHub Actions cron med Node 22

`scripts/run-cron.ts` er et selvstendig Node-script som kaller `runFetchPipeline()` direkte (ikke via Cloudflare-endepunkt). Dette unngår 30-sekund-grensen på Workers, og gir oss inntil 6 timer per kjøring på GitHub Actions free tier.

Workflow: `.github/workflows/daily-fetch.yml`
- Cron: `0 5 * * *` (05:00 UTC = 07:00 norsk tid)
- `workflow_dispatch` for manuell trigger
- Node 22 (Node 20 mangler native WebSocket — Supabase realtime-js krever den)
- `concurrency: daily-fetch` for å hindre parallelle kjøringer

GitHub Secrets brukt: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`.

Cloudflare-endepunktet `/api/cron/fetch-content` beholdes som manuell test-knapp, men er ikke det daglige driveren.

### 4. Privacy-side fra dag 1

`app/privacy/page.tsx` ble lagt til selv for SOLO-MVP. Selv om Linspo har én bruker, er det god praksis å ha policyen klar. Beskriver:
- Hvilke data samles inn (offentlig kuratert innhold + AI-sammendrag, ingen brukerdata)
- Tredjeparter (Supabase Frankfurt, Gemini, Cloudflare, UptimeRobot)
- Brukerrettigheter (når brukere kommer)

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| Downgrade Next.js til 15.5 for å bruke `@cloudflare/next-on-pages` | Mister Next.js 16-features (Turbopack-default, App Router-forbedringer); enklere å bytte adapter |
| Deploy til Vercel | ADR-001 forkastet pga. kommersiell-bruk-restriksjon i gratisplanen. Vi holder fast på Cloudflare for konsistens. |
| Cron via Cloudflare Pages-endepunkt med chunked-strategi | Mer kompleksitet (multiple cron triggers, state-mgmt for hvor man slapp). Node-runner i GitHub Actions er enklere. |
| Sette env-variabler som build-tid-variabler | Cloudflare Workers Builds skiller ikke alltid mellom build- og runtime-vars. Force-dynamic er sikrere. |
| Beholde Node 20 og installere `ws`-pakken manuelt | Node 22 er LTS og har native WebSocket. Færre avhengigheter er bedre. |

## Konsekvenser

**Positivt:**
- Appen er live på `https://linspo.joakim-m-elden.workers.dev`
- Daglig cron-jobb kjører automatisk fra GitHub Actions
- $0/mnd-budsjettet holder
- Vi er på moderne deployment-stack (OpenNext er den fremtidsrettede veien)

**Negativt / kompromisser:**
- ISR mistet på forsiden (alle requests rendres dynamisk) — ikke et reelt problem for SOLO-MVP
- To deploy-systemer (Cloudflare Worker + GitHub Actions) — mer mental overhead
- OpenNext er nyere/mindre dokumentert enn `next-on-pages` — kan ha edge-caser senere

**Avhengigheter framover:**
- UptimeRobot må settes opp manuelt for å holde Supabase våken (utstilt foreløpig — kommer)
- Når flere brukere kommer (Fase 2): vurdere om vi trenger Cloudflare-paid-plan for mer requests/dag
