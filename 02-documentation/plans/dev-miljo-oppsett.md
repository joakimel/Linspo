# Plan: Dev-miljø med preview-deploys + egen Supabase

**Dato:** 2026-05-18
**Status:** Planlagt — ikke implementert ennå

## Kontekst

SOLO-MVP er live i produksjon og Joakim samler feedback-data daglig. Han vil bygge videre på prosjektet uten å risikere å forstyrre prod (verken UI for daglig bruk, eller feedback-dataene som senere skal drive AI-vekting). Valgt løsning: Cloudflare Workers Builds preview-deploys per branch + egen Supabase-instans for dev. Mål: trygt utviklingsmiljø med minimum oppsett, ingen kode-endringer i app-koden, og null risiko for å forurense prod-data.

## Tilnærming

Kodebasen leser env-variabler direkte fra `process.env.X` (ingen config-modul) og `wrangler.jsonc` har ingen environment-seksjon. Cloudflare Workers Builds støtter preview-deploys per branch out-of-the-box med separate "Preview"-env-variabler i dashboard — derfor trengs ingen kode- eller wrangler-endringer for selve preview-funksjonaliteten. Eneste "kode-arbeid" er en `dev`-branch og en valgfri lokal helper for å populere dev-DB.

GitHub Actions `schedule:` kjører kun på default branch (main), så daglig cron forblir trygt isolert til prod. cron-job.org bruker `{"ref": "main"}` — fortsetter å treffe prod uavhengig av at dev-branch eksisterer.

## Steg

### 1. Opprett dev-Supabase-instans (Supabase dashboard)

- Logg inn på supabase.com → New project
- Navn: `linspo-dev`, region: `eu-central-1` (Frankfurt, samme som prod for konsistens og personvern)
- Velg sterkt DB-passord, lagre i passordmanager
- Vent ~1 min på provisionering

### 2. Kjør migrations på dev-DB (Supabase SQL Editor)

- Åpne SQL Editor i nye `linspo-dev`-prosjektet
- Kjør `supabase/migrations/0001_initial_schema.sql` (kopier-lim hele filen)
- Kjør `supabase/migrations/0002_feedback_and_read_state.sql`
- Verifiser i Table Editor at `articles` og `article_feedback` finnes med korrekte kolonner

### 3. Hent dev-credentials fra Supabase

Fra Settings → API:

- Project URL → blir `NEXT_PUBLIC_SUPABASE_URL` for dev
- `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for dev
- `service_role` / secret key → `SUPABASE_SECRET_KEY` for dev

### 4. Aktiver preview-deploys i Cloudflare

- Workers & Pages dashboard → `linspo`-prosjektet → Settings → Builds & deployments
- Verifiser at "Production branch" er `main`
- Aktiver "Preview deployments" hvis ikke allerede på (skal være default på Workers Builds GitHub-integrasjon)
- Resultat: hver push til ikke-main-branch får sin egen preview-URL automatisk

### 5. Sett Preview-environment-variabler i Cloudflare

- Settings → Variables and Secrets → bytt fra "Production" til "Preview"
- Legg inn fire variabler (kun for Preview):
  - `NEXT_PUBLIC_SUPABASE_URL` → dev-Supabase URL
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → dev publishable key
  - `SUPABASE_SECRET_KEY` → dev secret key (marker som Secret/encrypted)
  - `GEMINI_API_KEY` → samme som prod (deler 1000 RPD-quota; lag egen senere hvis det blir trangt)
- Prod-variabler (allerede satt) endres ikke

### 6. Opprett dev-branch lokalt og push

```bash
git checkout -b dev
git push -u origin dev
```

Cloudflare Workers Builds detekterer pushen og bygger en preview-deploy. URL vises i dashboard og som GitHub deployment-status på commiten (typisk `<commit-hash>-linspo.<subdomain>.workers.dev`).

### 7. Populer dev-DB med noen artikler (valgfritt, men nyttig)

Dev-DB er tom etter steg 2 — preview-deployen vil rendere uten artikler. To enkle alternativer:

**A. Kjør cron lokalt mot dev-DB (anbefalt — gir 20+ ekte artikler)**

- Lag `.env.dev.local` (`.env*` er allerede i `.gitignore`):

  ```
  NEXT_PUBLIC_SUPABASE_URL=<dev-url>
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<dev-publishable>
  SUPABASE_SECRET_KEY=<dev-secret>
  GEMINI_API_KEY=<samme-som-prod>
  ```

- Kjør én gang for å fylle DB:

  ```bash
  set -a && source .env.dev.local && set +a && npx tsx scripts/run-cron.ts
  ```

- Husk: dette bruker ~50-100 Gemini-kall mot felles quota. Greit å gjøre én gang, ikke daglig.

**B. Hopp over — bare verifiser at UI loader og viser "ingen artikler"-tilstand**

Holder hvis du bare vil bekrefte at preview-deployen fungerer teknisk.

### 8. Verifiser end-to-end

- Åpne preview-URL i nettleseren
- Sjekk forsiden: viser artikler fra dev-DB (eller tom-tilstand)
- Åpne DevTools → Network → forsiden — sjekk at requests går til dev-Supabase URL, ikke prod
- Åpne prod-URL parallelt og bekreft at den fortsatt viser uendret prod-data
- Marker en artikkel som lest i dev → verifiser at den dukker opp i dev `articles.read_at` via Supabase Table Editor, og at prod-DB er urørt

## Kritiske filer (referanse — ingen endringer kreves)

| Fil | Status |
|---|---|
| `wrangler.jsonc` | Uendret — preview håndteres via CF dashboard, ikke wrangler-config |
| `utils/supabase/server.ts` | Uendret — leser `process.env.X` direkte |
| `utils/supabase/admin.ts` | Uendret — leser `process.env.X` direkte |
| `lib/ai/gemini.ts` | Uendret |
| `.github/workflows/daily-fetch.yml` | Uendret — `schedule:` kjører kun på default branch (main) |
| `.env.example` | Uendret |
| `.gitignore` | `.env*` allerede dekket |

## Konsekvenser og forbehold

- **Gemini-quota deles** mellom prod og dev. 1000 RPD holder lenge med kun én lokal populering av dev-DB. Lag egen AI-Studio-nøkkel hvis du begynner å eksperimentere med pipeline-endringer som krever mange test-kjøringer.
- **Dev-DB persisterer ikke prod-data** — feedback-analyse skal fortsatt gjøres mot prod-DB i SQL Editor.
- **PAT for cron-job.org** påvirkes ikke — den treffer kun `main`-branch via GitHub API.
- **Preview-URL er offentlig tilgjengelig** med mindre Cloudflare Access aktiveres. Tre alternativer: (a) leve med det siden det er ukjent URL, (b) aktiver Cloudflare Access for preview-deploys, (c) legg til en enkel "X-Linspo-Preview-Token"-header-sjekk senere. Anbefalt: (a) inntil videre.
- **Workflow:** Når en feature er klar, merge `dev` → `main`. Produksjon deployes automatisk via eksisterende Workers Builds-integrasjon.

## Verifisering — sjekkpunkt etter oppsett

1. Push en dummy-endring til `dev` (f.eks. endre en h1-tekst) → preview-URL viser endringen, prod gjør det ikke
2. Marker artikkel som lest i preview → kun dev `articles.read_at` endres
3. Slett dev-Supabase test-data via SQL Editor — bekreft at prod-data er urørt
4. (Etter første natt) Sjekk at cron-job.org fortsatt har trigget prod-fetch som vanlig
