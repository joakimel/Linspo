# Ting å tenke på som ofte overses – Linspo

## 1. GDPR og personvern

### Hva Linspo samler inn (og hva det betyr juridisk)
Linspo behandler personopplysninger hvis den har brukere, og norske brukere er dekket av GDPR. Selv om du er solo-utvikler og appen er liten, gjelder GDPR fullt ut.

**Opplysninger Linspo samler:**
- E-postadresse (autentisering)
- Lesehistorikk (hvilke artikler lest, når)
- Interesseprofil (topics, skill_level)
- Feedback på innhold (👍/👎)
- Lesetidspunkt og -frekvens

Dette er **personopplysninger** – og noen av dem kan betraktes som **sensitive** (f.eks. politiske interesser avledet fra lesevaner).

### Minstekrav for GDPR-overholdelse

1. **Personvernerklæring (Privacy Policy)** – obligatorisk, må være tilgjengelig før innlogging
   - Hva samles inn, hvorfor, hvor lenge lagres det
   - Hvem deles det med (Supabase, Google/Gemini, Groq)
   - Brukerens rettigheter (innsyn, sletting, portabilitet)

2. **Samtykke** – brukeren må aktivt samtykke til datainnsamling
   - Ikke forhåndshukede bokser
   - Separat samtykke for markedsføring vs. nødvendig funksjonalitet

3. **Rett til sletting** – brukere må kunne slette kontoen sin og all tilhørende data
   - Implementer en "Slett konto"-funksjon fra dag 1
   - Cascade-slett all brukerdata fra alle tabeller

4. **Databehandleravtaler (DPA)** – du er "behandlingsansvarlig", Supabase og Google er "databehandlere"
   - Supabase tilbyr DPA: https://supabase.com/docs/company/sla
   - Google tilbyr DPA for Gemini API
   - Du trenger signerte DPA-er med alle tjenesteleverandører

5. **Datalagring i EU** – sjekk at Supabase-prosjektet ditt er i EU-region (Frankfurt)
   - Velg `eu-central-1` (Frankfurt) ved opprettelse av Supabase-prosjekt

### Praktisk tips
Bruk [Iubenda](https://www.iubenda.com) eller [Cookiebot](https://www.cookiebot.com) for å generere privacy policy og cookie-samtykke. Iubenda har en gratis plan for enkle apper.

---

## 2. Rate limiting og API-misbruk

### Problemet
Uten rate limiting kan én bruker (eller bot) tømme AI-kvoten din på sekunder.

### Hva kan skje
- Noen skriver et script som kaller `/api/articles?refresh=true` tusenvis av ganger
- Du når Gemini Flash sin daglige grense på 1 500 requests på minutter
- Alle andre brukere får ingen ny innhold den dagen

### Løsning: Implementer rate limiting fra dag 1

**Alternativ A: Upstash Redis (Anbefalt)**
- Gratis: 10 000 commands/dag
- Bruk `@upstash/ratelimit`-biblioteket
- Sett grenser per IP og per bruker-ID

```typescript
// Eksempel: Max 10 API-kall per bruker per minutt
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

const { success } = await ratelimit.limit(userId);
if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });
```

**Alternativ B: Cloudflare Workers Rate Limiting**
- Inkludert gratis på Cloudflare Pages
- Enklere å sette opp, men mindre fleksibelt

### Beskyttelse av cron-endepunkter
API-rutene som kalles av GitHub Actions MÅ beskyttes med en hemmelig nøkkel:

```typescript
// app/api/cron/fetch-content/route.ts
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... fortsett med henting
}
```

---

## 3. Skalering av AI-kall når brukerbase vokser

### Problemet som overses
De fleste solo-utviklere designer AI-arkitekturen slik at **ett AI-kall gjøres per bruker per forespørsel**. Dette skalerer ikke.

### Riktig tilnærming: Separér innholdsprosessering fra personalisering

```
FEIL:   Bruker ber om feed → AI genererer personalisert feed → dyrt og tregt
RIKTIG: AI prosesserer artikler én gang → lagres → personalisering skjer via DB-spørring
```

### Konkret: Slik skalerer Linspo

**Med 10 brukere:** 50 artikler/dag, 1 AI-kall per artikkel = 50 AI-kall (gratis-tier: ok)

**Med 1 000 brukere:** Fremdeles 50 artikler/dag, 1 AI-kall per artikkel = 50 AI-kall (gratis-tier: ok!)
- Personaliseringen er en database-query, ikke et AI-kall

**Med 10 000 brukere:** 200 artikler/dag, 1 AI-kall per artikkel = 200 AI-kall
- Betalt tier: 200 artikler × $0,00015 = $0,03/dag = under $1/mnd

**Konklusjon:** Med riktig arkitektur er AI-kostnadene nesten trivielle selv med mange brukere.

### Unntaket: Personaliserte ukentlige digester
Hvis du genererer én AI-digest per bruker per uke, koster det:
- 1 000 brukere × $0,001 per digest = $1/uke = $4/mnd

Det er akseptabelt, men vurder å gruppere brukere med like interesser og generere én digest per gruppe.

---

## 4. Innholdskvalitet og spam

### Problemer som dukker opp i produksjon

**Duplikater på tvers av kilder:**
Samme artikkel kan dukke opp fra HackerNews, DEV.to og RSS-feeden til Smashing Magazine. Implementer innholds-hashing:
```typescript
const hash = crypto.createHash('sha256').update(article.url).digest('hex');
// Sjekk om hash finnes i DB før prosessering
```

**Clickbait som scorer høyt:**
AI-modeller kan gi høy score til artikler med dramatiske titler. Motvirk med:
- Kjente domene-allowlist/blocklist
- Straff artikler fra domener som historisk har fått 👎-tilbakemeldinger

**Foreldede artikler:**
RSS-feeds kan inkludere gamle artikler. Filtrer alltid på `published_at` < 7 dager.

**SEO-spam i tech-feeder:**
Noen nettsteder publiserer AI-generert bulk-innhold. Tegn på spam:
- Mer enn 5 artikler/dag fra samme domene
- Artikler med identiske strukturer
- Manglende author-felt

---

## 5. Supabase-pauseproblemet

Prosjekter på Supabase gratis-plan **pauses automatisk etter 7 dagers inaktivitet**.

### Konsekvens
Cron-jobben din feiler stille – GitHub Actions logger suksess (HTTP 200 ble returnert), men Supabase er pauset og ingen data ble lagret.

### Løsning
1. Sett opp en **ping-funksjon** som kjører daglig og holder Supabase aktiv
2. Eller oppgrader til Pro ($25/mnd) når appen er i produksjon
3. Monitor med UptimeRobot (gratis) – sett det til å pinge appen din hvert 5. minutt

```yaml
# Legg til i GitHub Actions cron-jobb
- name: Wake up Supabase
  run: curl https://your-project.supabase.co/rest/v1/ -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## 6. Service worker-caching er vanskelig å debugge

### Vanlige problemer
- **Brukere ser gammel versjon:** Service workeren cacher aggressivt. Sett alltid en versjon i service worker-filnavnet eller bruk `skipWaiting()`.
- **Utvikling er frustrerende:** Cachen kolliderer med nye endringer. Bruk Chrome DevTools → Application → Clear Storage regelmessig.
- **PWA-installasjonsprompt dukker ikke opp:** Krever 2+ besøk, 5+ minutters mellomrom, HTTPS, gyldig manifest. Test med Lighthouse.

### Praktisk råd
Deaktiver Serwist under utvikling. Legg til i `next.config.ts`:
```typescript
const withSerwist = createSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',  // ← VIKTIG
});
```

---

## 7. GitHub Actions inaktivitetsproblemet

Workflows deaktiveres automatisk etter **60 dagers inaktivitet** (ingen commits, PR-er, issues i repoet).

### Konsekvens
Du oppdager at appen ikke har hentet nytt innhold på 2 måneder fordi du glemte å oppdatere koden.

### Løsning
Lag en enkel tomme-commit eller bruk `workflow_dispatch` med en manuell trigger for å reaktivere. Vurder å sette opp UptimeRobot til å pinge cron-endepunktet direkte (omgår GitHub Actions helt).

---

## 8. iOS EU-begrensningen (kritisk for norske brukere)

Som nevnt i PWA-arkitektur-dokumentet: iOS 17.4+ fjernet standalone PWA-støtte i EU under DMA. **Norge er med i EØS og er berørt av dette.**

### Konsekvens for Linspo
- Norske iPhone-brukere kan installere PWA-en, men den åpnes i Safari-tab (ikke standalone)
- Push-notifikasjoner fungerer IKKE for norske iOS-brukere
- Brukeropplevelsen er klart dårligere enn på Android

### Hva du kan gjøre
1. Ikke love push-notifikasjoner til iOS-brukere
2. Gjør e-postdigest til primær notifikasjonskanal
3. Design appen slik at den fungerer godt i nettleser (ikke kun som installert app)
4. Informer iOS-brukere om begrensningen ved onboarding

---

## 9. Over-engineering ved start

Den vanligste feilen solo-utviklere gjør med slike prosjekter:

**Bruker 3 måneder på arkitektur, aldri lanserer.**

### Tegn på over-engineering
- Microservices for én persons app
- Kubernetes for noe som kjører på én server
- Kompleks event-sourcing for enkel tilstandshåndtering
- Separate repos for frontend/backend/workers

### Riktig tilnærming
Start med **en monolittisk Next.js-app** som gjør alt. Splitt opp kun når et spesifikt problem oppstår. For 95% av apps med under 100k MAU er monolitt det rette valget.

**Prioriteringsprinsipp:** Funksjonell app med én bruker > Perfekt arkitektur uten brukere.

---

## 10. Gjøremål-sjekkliste som ofte glemmes

```
[ ] Personvernerklæring publisert på /privacy
[ ] Vilkår for bruk (Terms of Service) på /terms
[ ] "Slett konto"-funksjon implementert
[ ] CRON_SECRET satt som miljøvariabel (ikke hardkodet)
[ ] Supabase-prosjekt i EU-region (eu-central-1)
[ ] Supabase row-level security (RLS) aktivert på alle tabeller
[ ] DPA signert med Supabase
[ ] DPA sjekket for Google Gemini API
[ ] Rate limiting på alle API-endepunkter
[ ] UptimeRobot satt opp for monitoring
[ ] Error tracking (Sentry gratis-tier) satt opp
[ ] Backup-strategi for Supabase-data
[ ] Lighthouse PWA-audit kjørt og bestått
[ ] Robots.txt og Sitemap.xml (for landingsside)
[ ] HTTPS aktivert (automatisk på Cloudflare Pages)
[ ] Content Security Policy header satt
[ ] Miljøvariabler ikke committet til Git
```

---

## Oppsummering av de viktigste risikoene

| Risiko | Sannsynlighet | Konsekvens | Tiltak |
|--------|--------------|------------|--------|
| Supabase-pause | Høy | Appen stopper å fungere | Ping-løsning + UptimeRobot |
| GitHub Actions inaktivitet | Medium | Ingen ny innhold i måneder | Sett opp monitoring |
| iOS push-notifikasjoner (EU) | Høy | Ingen push til norske iPhone-brukere | Bruk e-post istedenfor |
| API-kvote tømt av bot/misbruk | Medium | Ingen AI-prosessering | Rate limiting fra dag 1 |
| GDPR-brudd | Lav (men alvorlig) | Bøter opp til 4% av omsetning | Privacy policy + DPA |
| Over-engineering | Høy | Appen lanseres aldri | Start med enkel monolitt |
| Service worker-cache-problemer | Medium | Brukere ser gammel versjon | Versjonshåndtering |

---

## Kildeliste
- [MagicBell: PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Supabase Free Tier Limits 2026](https://aiagencyplus.com/supabase-free-tier-limits/)
- [GDPR Compliance 2026](https://secureprivacy.ai/blog/gdpr-compliance-2026)
- [Solo Developer Lessons 2025 (DEV.to)](https://dev.to/pipipi-dev/2025-year-in-review-lessons-from-solo-saas-development-3i08)
- [GitHub Actions Cron Guide](https://cronjobpro.com/blog/github-actions-scheduled-workflows)
- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs/usage-and-pricing)

---

## Tillegg etter MVP-implementering (2026-05-15)

Disse observasjonene kom fra reell bygging og testing av MVP-en. De er nye risikoer eller justeringer av eksisterende, ikke fra ekstern research.

### A. Gemini free-tier er strengere enn dokumentert

Dokumentasjonen sier 250 RPD for `gemini-2.5-flash` og 1000 RPD for `gemini-2.5-flash-lite`. På vårt nye Google Cloud-prosjekt observerte vi **20 RPD per modell** — sannsynligvis fordi prosjektet er "uverifisert" (ingen billing tilknyttet).

**Konsekvens:** En enkelt testdag med flere cron-kjøringer tømte hele kvoten. Med 10 artikler per cron-kjøring betyr 20 RPD at vi maks kan kjøre cron to ganger om dagen.

**Tiltak:**
- Aktiver billing på Google Cloud (gir $300 gratis kreditt — har du kredittkort tilgjengelig, gjør dette tidlig)
- Eller: bytt til Anthropic Claude API (Haiku 4.5 koster ~$0.50/mnd for tilsvarende volum)
- Eller: aksepter begrensningen og kjør cron én gang om dagen kl. 05:00 UTC. Det er nok for MVP-bruk.

### B. AI-fabrikasjon ved tynn input

Når Gemini fikk kun artikkeltittel (ingen content), fabrikkerte den sammendrag basert på forhåndskunnskap. Eksempel: "A few words on DS4" ble feilaktig oppsummert som DualShock 4-kontrolleren, mens artikkelen faktisk handlet om DwarfStar 4-prosjektet på GitHub.

**Tiltak:** Implementert i `lib/content/extract.ts` — henter `og:description`/`meta description`/`<p>`-fallback før AI-kallet. Pluss streng anti-fabrikasjons-prompt. Artikler uten hentbart innhold hoppes over. Se `ADR-002` for detaljer.

### C. Reddit RSS-wrapper-problemet

Reddit RSS gir bare wrapper-tekst ("brukeren X postet på r/Y, N kommentarer") for link-poster — ikke selve innholdet. Det betyr at AI ikke har noe meningsfullt å oppsummere.

**Konsekvens:** Reddit som RSS-kilde gir konsekvent meningsløse sammendrag, uansett hvor god AI-modellen er.

**Tiltak:** Alle Reddit-feeder fjernet fra `RSS_FEEDS` i `sources.ts`. Hvis Reddit-innhold ønskes senere, må vi enten:
1. Hente faktisk postinnhold via Reddit JSON API (krever OAuth)
2. Hardkode "skip link-poster, behold kun self-posts"
3. Bruke topp-kommentarer som content-proxy (kompleks og fragil)

### D. Bredt feed-format krever filtrering

Tom's Hardware har ingen kategori-spesifikk RSS — de tilbyr én samlet feed med alt. ~90% av artiklene var irrelevante for våre fokusområder (CPU/GPU-benchmarks, generelle PC-tester).

**Tiltak:** `RssFeedConfig.keywordFilter` lagt til i `lib/content/rss.ts`. Filtrerer på tittel + excerpt før AI-prosessering. For Tom's Hardware: `["handheld", "steam deck", "rog ally", "msi claw", "legion go", "ayaneo", "retroid", "ayn "]`.

Dette mønsteret kan brukes på andre brede kilder (f.eks. The Verge-hovedfeed hvis vi tar den inn senere).

### E. AI feilvurderer ofte underholdnings-content som høyverdig

Selv med streng prompt, kan Gemini gi `learning_value: 7-8` til Reddit-memer eller humorpost (eksempel: "In Time (2011) was a documentary about Claude Pro users" — en spøk, ikke faglig innhold).

**Tiltak:** `app/page.tsx` filtrerer på `learning_value >= 4`. Defense-in-depth — om AI feilvurderer, holdes lavkvalitetsinnhold ute likevel. Vurder å heve terskelen til 6 hvis det fortsatt slipper gjennom for mye støy.

### F. Mappenavn med store bokstaver krenker npm-konvensjon

`npx create-next-app` nekter å scaffolde hvis target-mappen har store bokstaver i navnet (npm-pakkenavn må være små bokstaver). Vår "Linspo"-mappe måtte døpes om til "linspo" på macOS via en to-stegs rename (`mv Linspo tmp && mv tmp linspo`) siden filsystemet er case-insensitive.

**Tiltak:** Husk lowercase fra start på fremtidige prosjekter.
