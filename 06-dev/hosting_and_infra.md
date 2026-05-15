# Hosting, database og infrastruktur for Linspo

## Hosting: Vercel vs Netlify vs Cloudflare Pages

### Vercel

**Free tier (Hobby):**
- 100 GB båndbredde/mnd
- 1 million serverless function-invocations/mnd
- Cron jobs: KUN én gang per dag (stor begrensning for Linspo!)
- **Forbud mot kommersiell bruk på gratis-plan** – krever $20/mnd Pro-plan for inntektsgenererende apper

**Pro ($20/mnd):**
- Ubegrenset serverless invocations
- Cron jobs opp til hvert minutt
- 100 GB inkludert, $0,15/GB overskudd

**Vurdering for Linspo:**
Vercel er best for Next.js-utvikling, men gratis-planen er for begrenset (kun daglig cron). Hobbyprosjekter uten inntekt kan bruke gratis-planen.

---

### Netlify

**Free tier:**
- 300 kreditter/mnd (migrert til kredittsystem september 2025)
- 1 bygge-minutt = 1 kreditt
- 1 000 function-invocations = 1 kreditt
- 1 GB båndbredde = 1 kreditt
- Ingen cron-job-støtte ut av boksen

**Pro ($20/mnd):**
- Ubegrensede teammedlemmer (Vercel tar betalt per bruker)

**Vurdering for Linspo:** Ikke optimalt. Kredittsystemet er uforutsigbart og cron-støtten mangler.

---

### Cloudflare Pages (Anbefalt!)

**Free tier:**
- **Ubegrenset båndbredde** (unikt blant de tre!)
- 500 bygg/mnd (ca. 16/dag)
- Workers: 100 000 requests/dag gratis
- Pages Functions (serverless): inkludert i Workers-kvoten

**Pro ($5/mnd):**
- 5 000 bygg/mnd
- 10 millioner Workers requests/mnd
- Team-støtte

**Vurdering for Linspo:** Klart vinneren for en personlig/liten app. Ubegrenset båndbredde er avgjørende for media-rikt innhold. Billigste alternativ ved skalering.

**Advarsel:** Cloudflare Pages støtter Next.js via `@cloudflare/next-on-pages`-adapter, men ikke alle Next.js-funksjoner er støttet (f.eks. noen edge runtime-features). Test grundig.

---

### Anbefalt hosting-strategi

**Fase 1 (MVP, 0–100 brukere):** Cloudflare Pages gratis
**Fase 2 (100–1 000 brukere):** Cloudflare Pages gratis (ubegrenset båndbredde hjelper)
**Fase 3 (1 000+ brukere):** Cloudflare Pages Pro ($5/mnd) eller Vercel Pro ($20/mnd) avhengig av behov

---

## Database: Supabase vs Firebase vs PocketBase vs Appwrite

### Supabase (Anbefalt!)

**Free tier:**
- 500 MB PostgreSQL-database
- 1 GB file storage
- 50 000 månedlige aktive brukere (autentisering)
- 500 000 Edge Function-invocations/mnd
- 5 GB database egress/mnd
- 200 concurrent realtime connections
- 2 millioner realtime meldinger/mnd
- **Advarsel:** Prosjekter uten aktivitet i 7 dager blir automatisk pauset

**Pro ($25/mnd):**
- 8 GB database
- 100 GB file storage
- 500 000 MAU

**Fordeler for Linspo:**
- PostgreSQL = ekte relasjonsdatabase, full SQL
- Innebygd autentisering (Auth) med sosiale OAuth-leverandører
- Supabase Edge Functions for cron-lignende background jobs
- Real-time subscriptions for live-oppdateringer
- God dokumentasjon og stort community
- Open source – kan self-hoste gratis på egen VPS

**Svakheter:**
- Pausefunksjon på gratis-planen er irriterende
- 500 MB database er lite hvis man cacher mye innhold

---

### Firebase

**Gratis tier:**
- Firestore: 1 GB lagring, 50 000 lese/dag, 20 000 skrive/dag
- Authentication: Ubegrenset

**Svakheter:**
- NoSQL (Firestore) er dårligere for Linspos strukturerte data
- Kostnadene skalerer uforutsigbart med lese/skrive-operasjoner
- Vendor lock-in til Google

**Konklusjon:** Ikke anbefalt for Linspo.

---

### PocketBase

**Pris:** Gratis (open source), kun VPS-kostnad ($5–7/mnd på Hetzner/DigitalOcean)

**Fordeler:**
- Én enkelt Go-binærfil – ekstremt enkelt å deploye
- SQLite database, Auth, file storage, realtime API – alt inkludert
- En VPS på $5/mnd kan håndtere titusener av brukere

**Svakheter:**
- SQLite = ingen horisontal skalering
- Ingen managed cloud – du er ansvarlig for backup, oppdateringer, sikkerhet
- Ikke egnet hvis appen vokser til å kreve høy tilgjengelighet

**Vurdering for Linspo:** Godt alternativ hvis Joakim vil holde kostnadene absolutt minimale og er komfortabel med server-administrasjon. Mer komplekst å sette opp enn Supabase.

---

### Appwrite

**Free tier (Cloud):**
- 75 000 MAU
- 2 GB storage
- 750 000 function-executions/mnd

**Vurdering:** Solid, men Supabase er mer populært i Next.js-miljøet og har bedre dokumentasjon.

---

### PostgreSQL vs SQLite

| Aspekt | PostgreSQL (Supabase) | SQLite (PocketBase) |
|--------|----------------------|---------------------|
| Gratis managed | Ja (Supabase free tier) | Nei (krever VPS) |
| Skalering | Horisontal (med Supabase Pro) | Kun vertikal |
| SQL-kompatibilitet | Full | God, men mangler noe |
| Samtidig skriving | Eksellent | Begrenset (WAL-modus hjelper) |
| Passer for Linspo | Ja – anbefalt | Ja for under 10k brukere |

**Anbefaling:** Start med Supabase (PostgreSQL). Det er det rette valget for en app som kan vokse.

---

## Autentisering

### Supabase Auth (Anbefalt)

**Pris:** Inkludert i Supabase gratis-plan (50 000 MAU)
**Støtter:** E-post/passord, Magic Link, Google, GitHub, Apple
**Fordeler:** Integrert med Supabase database – row level security (RLS) ut av boksen
**Ulemper:** Noe mer konfigurering enn Clerk

---

### Clerk

**Pris:** Gratis opp til 10 000 MAU, deretter $0,02/MAU
**Fordeler:** Enkelt å integrere med Next.js, ferdigbygde UI-komponenter
**Ulemper:** Dyrt ved skalering ($0,02/MAU vs Supabase Auth $0,00325/MAU etter fri-kvote)

**For 1 000 brukere:**
- Clerk: Gratis (under 10 000 MAU)
- Supabase Auth: Gratis (under 50 000 MAU)

**For 100 000 brukere:**
- Clerk: $1 800/mnd
- Supabase Auth: $162,50/mnd

---

### Auth.js v5 (NextAuth)

**Pris:** Gratis (open source)
**Ulemper:** Mer manuell oppsett, du håndterer database-sessions selv
**Brukstilfelle:** Hvis du IKKE bruker Supabase og vil ha full kontroll

**Anbefaling:** Bruk Supabase Auth. Det er inkludert, enkelt og skalerer godt.

---

## Cron Jobs for daglig innhentning

### Alternativ 1: GitHub Actions (Anbefalt for MVP)

**Pris:**
- Offentlige repos: Gratis, ubegrenset
- Private repos: 2 000 Linux-minutter/mnd på gratis-plan

**Begrensninger:**
- Korteste intervall: hvert 5. minutt (men 15 min anbefalt)
- Workflows deaktiveres automatisk etter 60 dagers inaktivitet (commits/PR/issues)
- En workflow på 2 min som kjører hvert 15. min = 5 760 min/mnd (over gratis-grensen for private repos)

**For Linspo:** Én daglig innhenting om natta tar ca. 5 min = 150 min/mnd. Godt innenfor gratis-grensen.

**Anbefalt strategi:**
```yaml
# .github/workflows/daily-fetch.yml
on:
  schedule:
    - cron: '0 5 * * *'  # Kl 05:00 UTC (07:00 norsk tid)
```

---

### Alternativ 2: Vercel Cron Jobs

**Free tier:** KUN én gang per dag
**Pro ($20/mnd):** Opp til hvert minutt

**For Linspo:** Gratis-planen er tilstrekkelig for daglig innhenting.

---

### Alternativ 3: Supabase Edge Functions med cron

**Pris:** 500 000 invocations/mnd gratis
**Fordel:** Alt på ett sted – innhenting og lagring i samme system
**Begrensning:** Supabase Cron er i beta per 2025, og Edge Functions har 150 sekunder maks kjøretid

**Anbefaling for Linspo:**
- **MVP:** GitHub Actions (offentlig repo = helt gratis, enkelt å sette opp)
- **Produksjon:** Supabase Edge Functions + Cron (når det er stabilt)

---

## CDN for bilder og media

### Cloudflare Images
- $5/mnd for 100 000 bilder
- Automatisk optimering og format-konvertering (WebP/AVIF)
- Global CDN inkludert

### Supabase Storage
- 1 GB gratis, $0,021/GB deretter
- Enkel å bruke hvis man allerede er på Supabase

### For MVP:
Bruk Supabase Storage for artikkelbanner-bilder (få bilder). Cloudflare Images er verdt det ved skalering.

---

## Edge Functions vs Serverless Functions

| Aspekt | Edge Functions | Serverless Functions |
|--------|---------------|---------------------|
| Kjøretid | V8 Isolates (~0ms cold start) | Node.js (~200-500ms cold start) |
| Begrensninger | Begrenset API-tilgang, ingen native Node | Full Node.js API |
| Passer til | Auth-sjekk, geo-routing, A/B-test | Kompleks logikk, AI-kall, DB-queries |
| Eksempler | Cloudflare Workers, Vercel Edge | Vercel Functions, Supabase Functions |

**For Linspo:**
- Edge: Autentiseringssjekk, caching
- Serverless: AI-kall, RSS-henting, database-operasjoner

---

## Realistiske kostnader ved ulik skala

| Brukere | Supabase | Hosting | AI-kall | Total/mnd |
|---------|----------|---------|---------|-----------|
| 0–100 | Gratis | Gratis (CF Pages) | Gratis | **$0** |
| 100–1 000 | Gratis | Gratis | Gratis | **$0** |
| 1 000–5 000 | Gratis | Gratis | ~$1 | **~$1** |
| 5 000–10 000 | $25 | $5 (CF Pro) | ~$3 | **~$33** |
| 10 000–50 000 | $25 | $5 | ~$10 | **~$40** |

Tallene forutsetter smart caching og batch-prosessering av AI-kall.

---

## Kildeliste
- [DevToolReviews: Vercel vs Netlify vs Cloudflare Pages 2026](https://www.devtoolreviews.com/reviews/vercel-vs-netlify-vs-cloudflare-pages-pricing-comparison-2026)
- [Supabase Pricing 2026](https://uibakery.io/blog/supabase-pricing)
- [Supadex: Supabase vs Firebase vs PocketBase 2025](https://www.supadex.app/blog/supabase-vs-firebase-vs-pocketbase-which-one-should-you-choose-in-2025)
- [DevToolReviews: Clerk vs Supabase Auth 2026](https://www.devtoolreviews.com/reviews/clerk-vs-auth0-vs-supabase-auth-2026)
- [GitHub Actions Billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Vercel Cron Jobs Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
