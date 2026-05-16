# Linspo — strategi for generell kilde-oppdagelse

**Dato:** 2026-05-16
**Grunnlag:** Test av kilde-oppdagelses-systemet på 10 emner, WebSearch-research av konkurrenter og alternativer.

---

## Problemet vi løser

Linspo er en personlig faglig kurator. Brukeren setter opp et sett med emner de vil følge, og systemet skal automatisk finne de beste RSS-kildene for disse emnene — uten at brukeren trenger å vite hva `feedsearch.dev` er eller huske at NRK har en matblogg med RSS.

Dette skiller seg fra RSS-lesere som Feedly eller Inoreader på én kritisk måte: **brukeren angir et emne, ikke en URL**. Systemet må selv finne ut hvilke kilder som finnes, velge de beste, og presentere dem som klare til å abonnere på.

Problemet har tre dimensjoner:
1. **Oppdagelse:** Hvilke nettsteder dekker dette emnet?
2. **Verifisering:** Har de RSS? Er de aktive?
3. **Rangering:** Hvilke er best for akkurat denne brukeren?

Det nåværende systemet løser dimensjon 1 og 2 rimelig godt for engelske/tekniske emner, men er svakt for norskspråklige niche-emner.

---

## Konkurrentanalyse

### Feedly Discover

Feedly er den dominerende RSS-leseren og har utviklet et sofistikert oppdagelsessystem over mer enn 10 år. Kjernen er:

- **Curated bundles:** Redaksjonelt kuraterte kildelister per bransje/tema. Disse er laget av mennesker, ikke algoritmer.
- **Similar sources:** Basert på hvilke brukere som abonnerer på de samme kildene (kolaborativ filtrering).
- **URL-basert oppdagelse:** Brukeren limer inn en URL, Feedly finner alle tilgjengelige RSS-feeder automatisk (inkludert sub-feeder).
- **RSS Builder:** For sider uten RSS kan Feedly lage en syntetisk feed ved å periodisk skrape siden.
- **Leo AI:** Feedly's AI analyserer innholdet i feeder og lar brukere filtrere etter relevans — men dette skjer *etter* at kildene er lagt til, ikke som en del av oppdagelsen.

**Svakhet relevant for Linspo:** Feedlys oppdagelse forutsetter at brukeren vet omtrent hva de leter etter. Den er ikke designet for spørsmålet "finn meg alle gode RSS-kilder om kantareller".

### Inoreader

Inoreaders oppdagelsessystem er mer teknisk avansert enn Feedlys:

- **Global search (oppdatert mars 2025):** Søker på tvers av Inoreaders katalog av verifiserte feeder. Inkluderer "Featured collections" kuratert per emne.
- **Web Feeds (oppdatert februar 2025):** Kan konvertere nesten hvilken som helst nettside til en RSS-feed ved å spore sideendringer — en form for syntetisk feed-generator.
- **Browser-extension autodiscovery:** Oppdager automatisk RSS-lenker i `<link rel="alternate">` i HTML `<head>`.
- **Semantic search med autofullføring:** Real-time forslag basert på Inoreaders feed-katalog.

**Styrke relevant for Linspo:** Inoreaders "Web Feeds"-funksjon er interessant — hvis ingen RSS finnes, kan siden selv overvåkes for endringer. Linspo mangler dette.

### Refind

Refind er ikke en RSS-leser, men en innholds-kuraterings-plattform som løser et delvis overlappende problem. De overvåker 10 000+ kilder og 1 000+ "thought leaders" og sender brukeren 5-10 lenker per dag basert på interesser.

Modellen deres er:
- **Massiv kilde-database:** 10 000+ forhåndsgodkjente kilder, manuelt kuratert av teamet og eksperter.
- **Brukerdrevne signaler:** Brukere lagrer lenker via nettleserutvidelse — disse bidrar til å oppdage nye kilder.
- **"Timelessness"-algoritmen:** Prioriterer innhold med lang levetid (ikke breaking news) basert på lesemønster over tid — 100 000+ nye lenker per dag prosesseres.
- **Ekspert-kuratorer:** Niche-emner kurateres manuelt av domene-eksperter.

**Leksjon for Linspo:** Refind-modellen skalerer fordi de har bygget en kombinasjon av menneskelig kuratering + algoritmisk utvelgelse. En ren automatisert tilnærming vil aldri matche dette for niche-emner. For Linspo er det realistisk å bygge automatisert oppdagelse for «store» emner (UX, teknologi, gaming) og falle tilbake på LLM-generering for niche.

### NewsBlur

NewsBlur er en åpen-kildekode RSS-leser med en imponerende oppdagelsesfunksjon (oppdatert mars 2026):

- **63 000+ verifiserte feeds:** 2 000+ YouTube-kanaler, 6 600 subreddits, 7 300 nyhetsbrev, 32 000 podcaster, 14 000 RSS-feeder.
- **Semantisk søk med autofullføring:** Bruker subscription velocity, read engagement, og subscriber counts for å rangere.
- **Kategorier:** 50 000+ curaterte feeder organisert i dusinvis av kategorier.

**Leksjon for Linspo:** NewsBlurs "Add + Discover Sites"-funksjon viser at et komplett oppdagelsessystem krever pre-indekserte, verifiserte feeds. For Linspo med én bruker er det ikke nødvendig å bygge dette fra scratch — det er bedre å utnytte NewsBlurs åpen-kildekode-indeks eller lignende databaser som `feedle.world`.

### Curated.co

Curated.co er en plattform for menneskelig kuraterte ukentlige nyhetsbrev. Modellen er ikke automatisert oppdagelse, men verktøy-støtte for menneskelige kuratorer. Relevant for Linspo fordi det bekrefter at niche-emner (strikking, kantareller) krever menneskelig kunnskap — algoritmer alene strekker ikke til.

---

## Strategier vi har implementert (med vurdering basert på test-rapporten)

### `llm-suggest` — Kritisk, beholdes

**Hva:** Sender emnet til Gemini 2.5 Flash Lite med en strukturert prompt og ber om 5-8 autoritative kilder med forventede RSS-URL-er.

**Resultat:** Fungerte på samtlige 10 emner. Eneste strategi med 10/10 dekning. Leverer konsekvent høy kvalitet — riktige norske kilder for "sykepleie", riktige spesialist-bloggene for "embedded Linux".

**Svakhet:** Kan misforstå emnet (Claude Code → generell AI-dekning) og hallusinere RSS-URL-er som finnes, men peker til feil seksjon av siden. RSS-verifisering fanget opp mange av disse.

**Anbefaling:** Beholdes. Vurder å legge til instruksjon i prompten om å skille mellom "generell AI" og "Claude Code" for å redusere tematisk drift.

### `reddit` — Sterk for engelske emner

**Hva:** Søker Reddit's subreddit-API og returnerer relevante subreddits med verifiserte RSS-URL-er.

**Resultat:** 5/10 emner — fungerte utmerket for UX design, Claude Code, Steam Deck, embedded Linux, sykepleie (fant r/norge). Null for strikkeoppskrifter, kantareller, koreansk matlaging, kvantedatamaskiner.

**Problem:** Søketermen brukes direkte. Norske emner som "strikkeoppskrifter" matcher ikke r/knitting (2,1M abonnenter). Reddit-søk er engelsk-sentrisk.

**Anbefaling:** Legg til en automatisk oversettelse-steg i `index.ts` — bruk `llm-suggest` eller et enkelt ordbok-oppslag for å generere en engelsk variant av emnet. Send begge søketermene parallelt til Reddit-strategien.

### `mastodon` — Bred dekning, lav informasjonstetthet

**Hva:** Sjekker Mastodon-hashtag-RSS for 7 instanser på tvers av 2 hashtag-varianter.

**Resultat:** 8/10 emner — feiler for strikkeoppskrifter og koreansk matlaging (hashtag for lite brukt). Konfidens settes riktig lavt (0.45) fordi Mastodon-feeds har mye støy.

**Svakhet:** Hashtag-RSS viser *alle* innlegg med taggen — signal-til-støy er lav. Bruksverdien for Linspo er å vise at emnet diskuteres på Mastodon, ikke som primær nyhetskilde.

**Anbefaling:** Beholdes for tekniske og faglige emner. Vurder å begrense til kun instanser med norsk profil (snabelen.no, norges.social) for norskspråklige emner.

### `awesome-lists` — Svært emne-avhengig

**Hva:** Søker GitHub etter `awesome-{topic}`-repos og parser README for lenker.

**Resultat:** 4/10 emner — fungerte for UX design, Steam Deck, embedded Linux, Claude Code (0 resultater her). Feiler for alle norske/niche-emner.

**Svakhet:** Mange lenker fra awesome-lists er prosjektsider, dokumentasjon og verktøy — ikke nyhetssider med RSS. De henter f.eks. `marvelapp.com/styleguide` og `material.io/design` som UX-kilder, men disse er ikke aktivt oppdaterte nyhetsbrev.

**Anbefaling:** Legg til domeneklassifisering. URL-er med `/docs`, `/guide`, `/getting-started`, `/styleguide` i stien har svært lav sannsynlighet for å ha en aktiv RSS-feed — gi dem lavere konfidens eller filtrer dem bort.

### `wikipedia` — Nyttig for etablerte emner, mye støy

**Hva:** Henter eksterne lenker fra Wikipedia-artikkel om emnet (norsk først, fallback til engelsk).

**Resultat:** 3/10 emner med reelle resultater. Dominerer for "sykepleie" (17 kandidater) og "bipolar lidelse" (12 kandidater), men 80%+ er støy: bibliotekskataloger (`id.loc.gov`, `aleph.nkp.cz`, `catalogue.bnf.fr`), web.archive.org-snapshots, og enkeltartikkel-lenker.

**Kritisk bug:** Fallback-logikken er seriell (norsk → engelsk → translitterert), noe som forårsaker kjøretider på 110–140 sekunder. Burde kjøres parallelt.

**Anbefaling:**
1. Utvid `DOMAIN_BLOCKLIST` i `wikipedia.ts` med: `web.archive.org`, `id.loc.gov`, `catalogue.bnf.fr`, `datos.bne.es`, `d-nb.info`, `id.ndl.go.jp`, `aleph.nkp.cz`, `britannica.com`
2. Gjør fallback-kall parallelt med `Promise.allSettled`

### `hn-algolia` — Artikkelfinner, ikke kildefinner

**Hva:** Søker Hacker News Algolia API for å finne domener som har dukket opp i HN-diskusjoner for emnet.

**Resultat:** 4/10 emner med resultater, men kvaliteten er problematisk. Returnerer individuelle artikkel-URL-er fra vidt forskjellige domener — mange er enkeltposter som aldri vil dukke opp igjen.

**Structural problem:** `hn-algolia` er optimalt for å finne *artikler*, men kilde-oppdagelse handler om *redaksjoner med kontinuerlig innhold*. Et domene som har hatt én viral HN-post om Steam Deck er ikke nødvendigvis en god Steam Deck-kilde.

**Anbefaling:** Aggreger på domene-nivå og krev minst 3 HN-forekomster for å inkludere en kilde. Sjekk om rot-domenet har RSS autodiscovery (via `<link rel="alternate">`-headeren). Nåværende terskel på 1 forekomst er for lav.

### `search-engine` (DuckDuckGo) — Ikke-funksjonell

**Hva:** Søker DuckDuckGo HTML-endepunkt og parser søkeresultater.

**Resultat:** 0/10 emner. Returnerte ingenting på samtlige kjøringer.

**Årsak:** DuckDuckGo bruker bot-deteksjon og returnerer antagelig en 202 eller CAPTCHA for headless-klienter uten JavaScript. DuckDuckGo's ToS forbyr også scraping, og i 2025 krever pålitelig tilgang residensielle proxy-er.

**Anbefaling:** Erstatt med Brave Search API (2 000 gratis queries/mnd, veldokumentert JSON API, uavhengig indeks). Alternativt: Feedle (`feedle.world`) som er en RSS-spesifikk søkemotor — hver søk returnerer en RSS-feed, og de har et API egnet for dette formålet.

### `substack-discover` — Ikke-funksjonell

**Hva:** Søker Substacks udokumenterte API (`/api/v1/search/top?type=publication`) for relevante nyhetsbrev.

**Resultat:** 0/10 emner. Returnerte ingen publikasjoner.

**Årsak:** Substack's API er udokumentert og kan ha endret seg. Det finnes et offisielt "Substack Developer API" (lansert 2025), men det er rettet mot å hente innhold fra egne Substack-profiler — ikke søk etter publikasjoner.

**Anbefaling:** Test om API-endepunktet fortsatt fungerer manuelt. Hvis ikke, vurder å bytte til `feedle.world`-søk filtrert på `substack.com`-domenet.

---

## Strategier vi IKKE har implementert (med begrunnelse)

### RSS autodiscovery (HTML-header-scanning)

**Hva det er:** Hente HTML-headeren til et domene og se etter `<link rel="alternate" type="application/rss+xml">`. Dette er den standardiserte mekanismen for RSS-oppdagelse (rssboard.org/rss-autodiscovery).

**Hvorfor ikke implementert:** Det er allerede implementert som en del av `verify.ts`, men bare for URL-er som allerede er oppdaget av andre strategier. Vi mangler en strategi som *starter* med liste av domener og sjekker autodiscovery.

**Potensiell verdi:** Høy — ville fange opp RSS-feeder som Inoreader og nettleser-extensions oppdager automatisk.

**Anbefaling:** Legg til `link rel alternate`-sjekk i `verify.ts` som del av verifiseringssteget for alle kandidater.

### Feedle/FeedSpot RSS-søk

**Hva det er:** Dedikerte søkemotorer for RSS-feeder. `feedle.world` indekserer tusenvis av blogger og podcaster og lar deg søke på emne — hvert søk genererer en ny RSS-feed av matchende innhold. `feedsearch.dev` er et rent feed-oppdagelses-API.

**Hvorfor ikke implementert:** Ikke kjent for utvikler av systemet.

**Potensiell verdi:** Høy — spesielt for å finne nisje-feeder som ikke dukker opp i awesome-lists eller Reddit.

**Anbefaling:** Implementer `feedle`-strategi som sjekker `feedle.world/search?q={topic}` og henter ut feed-URL-er. Vurder `feedsearch.dev` for å sjekke om et kjent domene har feeder.

### Podcast-oppdagelse (Podcast Index)

**Hva det er:** `podcastindex.org` har et åpent API med 4,2 millioner podcaster. Mange er i Atom/RSS-format og kan abonneres på i en RSS-leser.

**Hvorfor ikke implementert:** Linspo er primært tekst-basert, podcaster er lyd.

**Potensiell verdi:** Lav i nåværende MVP — brukerprofilen er lesebasert faglig læring.

### OPDS-kataloger (biblioteksystemer)

**Hva det er:** Open Publication Distribution System — brukt av bibliotek og akademiske publishers. Mange norske fagkilder (Tidsskriftet, Sykepleien) er tilgjengelige via OPDS.

**Hvorfor ikke implementert:** For smal nisje, lav RSS-overlapp.

### Mastodon GraphQL / Lists API

**Hva det er:** Mastodon har en mer granulær API som kan hente profiler med mest engasjement rundt en hashtag — mer signal enn rå hashtag-RSS.

**Hvorfor ikke implementert:** Kompleksitet, men lav prioritet gitt at Mastodon generelt har lav signal-til-støy.

### Semantic similarity / embedding-basert rangering

**Hva det er:** Konverter kilde-beskrivelser til embedding-vektorer og rank etter cosine similarity med emnet. Feedle gjør noe lignende internt.

**Hvorfor ikke implementert:** Krever embedding-API (kostnad) eller lokal modell. Overkill for MVP.

---

## Anbefalt arkitektur for produksjon

### Nivå 1: Kjerne (implementer nå)

```
topic (norsk/engelsk)
    → [forhåndsbehandling] norsk → engelsk oversettelse (via Gemini, 1 kall)
    → parallelt:
        llm-suggest          ← kritisk, alltid på
        reddit (norsk + EN)  ← grunnstruktur fungerer
        mastodon             ← lav innsats, god dekning
    → dedup + rang
    → rss-verifisering (topp 10)
    → resultat
```

**Estimert tid:** 10-15 sek. **Estimert dekning:** 85% av emner.

### Nivå 2: Berikelse (aktiver for spesifikke emner-typer)

```
Tekniske/engelske emner (ingen æøå, finnes på HN):
    + awesome-lists
    + hn-algolia (med domeneklassifisering, min 3 forekomster)

Etablerte faglige emner (finnes på Wikipedia):
    + wikipedia (etter støy-filtrering)
```

**Estimert tilleggsverdi:** 5-10 kandidater per emne med verifisert RSS.

### Nivå 3: Fremtidig

```
    + feedle.world-søk (erstatter search-engine)
    + Brave Search API (erstatter DuckDuckGo-scraping)
    + RSS autodiscovery for alle oppdagede domener (forbedrer verify.ts)
    + Substack-søk via feedle (filtrert på substack.com)
```

### Feilslagede strategier som bør deaktiveres

```typescript
// I lib/content/discovery/index.ts, legg til i standard-konfig:
const DEFAULT_SKIP: DiscoveryMethod[] = ["search-engine"];
// Substack: evaluer manuelt, deretter bestem
```

### Ytelsesmål for produksjon

| Scenario | Nåværende | Mål |
|----------|-----------|-----|
| Engelske tekniske emner | 10-20 sek | < 10 sek |
| Norske niche-emner | 12-16 sek | < 15 sek |
| Norske faglige emner (Wikipedia) | 110-140 sek | < 20 sek (parallell fallback) |
| Kandidater med verifisert RSS | 4-21 (median ~15) | > 10 per emne |

---

## Open questions

1. **Norsk emne-oversettelse:** Skal vi bruke Gemini til å oversette emnet til engelsk som forhåndsbehandling for alle strategier, eller bare for `reddit` og `awesome-lists`? Kostnad er minimal (1 ekstra API-kall), men det er overhead.

2. **`substack-discover`-strategi:** Er Substack's søke-API faktisk brutt, eller er det en konfigurasjonsfeil? Bør testes isolert: `curl "https://substack.com/api/v1/search/top?query=ux+design&type=publication"`. Basert på søkeresultater finnes et offisielt Substack Developer API fra 2025, men det er ikke for kilde-søk.

3. **feedle.world:** Feedle indekserer tusenvis av blogger og podcaster og genererer en RSS-feed for hvert søk. Dette er potensielt den mest direkte erstatningen for `search-engine`. Bør testes som en ny strategi (`feedle-search`).

4. **`hn-algolia`-terskel:** Nåværende logikk inkluderer domener med 1 HN-forekomst. Bør terskelen heves til 3? Det ville eliminert 80% av støyen (individuelle poster) men beholdt de virkelig autoritative kildene (uxdesign.cc med 8 forekomster).

5. **Wikipedia støy-filtrering:** Domenelisten som bør blokkeres (`id.loc.gov`, `aleph.nkp.cz`, `catalogue.bnf.fr` osv.) er lang, men veldig forutsigbar — dette er bibliografiske metadata-tjenester, ikke innholdssider. En enkel domeneliste-utvidelse ville eliminere ~60% av Wikipedia-støyen umiddelbart.

6. **RSS vs. syntetiske feeder:** Inoreader og Feedly kan lage RSS-feeder fra sider uten RSS. Linspo gjør ikke dette. Norske helsesider som `psykiatri.no` og `helse-bergen.no` er gode kilder uten RSS — bør Linspo støtte "Web Feed"-funksjonalitet (periodisk scraping av forsider)?

7. **Oppdagelses-kadense:** Kilde-oppdagelse skjer nå on-demand (når brukeren setter opp et nytt emne). I produksjon: bør systemet periodisk re-kjøre oppdagelse for eksisterende emner (f.eks. ukentlig) for å fange opp nye aktive kilder? Anbefaling: ja, men månedlig er tilstrekkelig.

---

*Rapport skrevet av: test- og rapport-agent, Claude Sonnet 4.6 — 2026-05-16*

*Basert på: lokal kjøring av 10 emner + WebSearch-research av Feedly, Inoreader, Refind, NewsBlur, Curated.co, Feedle, Brave Search API, DuckDuckGo scraping-status, og RSS autodiscovery-standarder.*
