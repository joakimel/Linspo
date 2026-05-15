# ADR-002: Innholds-pipeline og kilde-strategi

**Dato:** 2026-05-15
**Status:** Godkjent

## Kontekst

Første versjon av pipelinen sendte kun artikkeltittel til Gemini Flash for sammendrag. Testing avslørte to alvorlige kvalitetsproblemer:

1. **AI-fabrikasjon:** Gemini hallusinerte sammendrag når tittel alene var tvetydig. Konkret eksempel: "A few words on DS4" (om GitHub-prosjektet DwarfStar 4) ble feilaktig oppsummert som DualShock 4-kontrolleren.
2. **Reddit-wrapper-problemet:** Reddit RSS gir bare wrapper-tekst ("brukeren X postet på r/Y, N kommentarer") for link-poster — selve postinnholdet er ikke i feeden. AI-en ble tvunget til å beskrive *at* en post finnes, ikke *hva* den handler om.

Det måtte også avgjøres hvordan beskytte forsiden mot at AI-en feilvurderer kvalitet (gir høy `learning_value` til memer/lavkvalitetsinnlegg).

## Beslutning

### Innhentings-pipeline (`lib/content/`)

1. **Innholds-ekstraktor (`extract.ts`):** For artikler uten passende excerpt fra kilden, hentes selve URL-en. Plukker ut, i prioritert rekkefølge:
   - `<meta property="og:description">`
   - `<meta name="twitter:description">`
   - `<meta name="description">`
   - Fallback: første 6 `<p>`-tagger (kun de med ≥80 tegn)
   - Maks 2000 tegn returneres
   - Hard timeout: 10 sek. Returnerer `null` hvis feil — pipelinen hopper over artikkelen.

2. **Streng anti-fabrikasjons-prompt:** Gemini-prompten inkluderer eksplisitt instruks: *"IKKE bruk forhåndskunnskap eller anta hva forkortelser betyr"*. Hvis innholdet er irrelevant eller for kort, settes `learning_value: 0` og artikkelen markeres som `ai_processed: false` (filtreres bort fra feed).

3. **Multi-kilde med interleaving:** `sources.ts` henter HN topic-søk + alle RSS-feeder parallelt, deretter interleaver listene så hver cron-kjøring får miks fra alle kilder (i stedet for at HN fyller opp først).

### Kilde-strategi

**Fjernet:**
- Alle Reddit-feeder (wrapper-problemet)
- Polygons hovedfeed (mest film/underholdning, ikke fokusområde)

**Beholdt:**
- HackerNews via Algolia (8 topic-søk parallelt)
- The Verge Gaming

**Lagt til:**
- UX: Smashing Magazine, UX Collective, Nielsen Norman Group
- Håndholdte: Retro Handhelds, Liliputing
- Linux/Steam Deck: Gaming On Linux
- Bredt tech: The Verge Tech-feed
- Tom's Hardware med `keywordFilter` (handheld/Steam Deck/ROG Ally/MSI Claw/AYANEO osv.) — siden de bare har samlet feed

### Forside-filter

`app/page.tsx` filtrerer på `learning_value >= 4`. Selv om AI-en feilvurderer et meme som høyere enn det burde, holdes lavkvalitetsinnhold ute av feeden.

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| `@mozilla/readability` + jsdom for content extraction | jsdom er tung (~10MB), DOM-parsing er overkill når vi bare trenger meta-tagger |
| `extractus/article-extractor`-pakke | Ekstra avhengighet — regex-basert tilnærming er enklere og dekker behovet |
| Filtrere Reddit til "self-text only" (skip link-posts) | Reduserer Reddit til ~10% av volumet, og selv self-posts har ofte lav signal-til-støy |
| Bruke top-of-month i stedet for top-of-week på Reddit | Samme wrapper-problem |
| Hardkodet blokkering av memer/clickbait via tittel-regex | Fragil og passer ikke alle kilder |
| Vente med `learning_value`-filter til feedback-system kommer | For mye støy slipper gjennom i mellomtiden |
| Tom's Hardware-feed uten filter | ~90% av artiklene irrelevant (CPU/GPU-benchmarks) — sløser AI-kvote |

## Konsekvenser

**Positivt:**
- Eliminerer hallusinering — sammendrag er nå basert på reelt artikkelinnhold (verifisert lokalt: nye sammendrag har konkrete detaljer fra sidene, ingen oppdiktet info)
- Kildemiksen matcher Joakims faktiske interesser
- `learning_value`-filter gir defense-in-depth mot eventuelle AI-feilvurderinger
- `keywordFilter`-mønsteret kan brukes på flere brede kilder senere

**Negativt / kompromisser:**
- Content extraction legger til ~1-2 sek per artikkel (parallellisert, men begrenset av langsomme servere)
- Avhenger av at sider faktisk har `og:description` (de fleste seriøse publikasjoner har det, men ikke alle — paywalls og JS-rendret innhold er fortsatt et hull)
- `keywordFilter` på Tom's Hardware kan misse artikler om handhelds som ikke nevner spesifikke produktnavn

**Avhengigheter framover:**
- Når feedback-systemet kommer (etter MVP): vurder om `learning_value`-terskelen bør være justerbar per bruker
- Når nye kilder legges til: følg pattern fra `RSS_FEEDS` i `sources.ts`, vurder om `keywordFilter` trengs
- Hvis vi senere ønsker dypere innhold for komplekse artikler: vurder å bytte fallback-ekstraktoren til `@mozilla/readability` — krever da også jsdom

## Empirisk validering (2026-05-15)

- Før fix: AI-sammendrag for HN-poster med kun tittel-input var ofte fabrikkert. Eksempel: "A few words on DS4" → AI beskrev DualShock 4. Faktisk innhold: DwarfStar 4-prosjekt på GitHub.
- Etter fix med content extraction: 9/10 artikler fikk faktisk-baserte sammendrag (én feil var Gemini-503, ikke fabrikasjon).
- `learning_value`-fordeling stemmer med innholdskvalitet: memer/Reddit-poster scoret 1-2, faglige refleksjoner 7-8.
