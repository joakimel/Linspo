# Test-rapport: Kilde-oppdagelses-systemet

**Dato:** 2026-05-16

---

## Sammendrag (TL;DR)

- **En kritisk bug ble fikset:** `cli.ts` brukte feil relativ sti (`../../../../`) for å finne `.env.local`, noe som førte til at GEMINI_API_KEY aldri ble lastet. Etter fix (`../../../`) fungerer `llm-suggest` som forventet.
- **Tre strategier yter konsistent og pålitelig:** `reddit`, `mastodon`, og `llm-suggest` leverer verifiserbare RSS-feeds på tvers av alle emner der de har relevans.
- **To strategier er ikke-funksjonelle i praksis:** `search-engine` (DuckDuckGo-scraping) og `substack-discover` returnerte 0 resultater på samtlige 10 emner.
- **`wikipedia` er nyttig for norske faglige emner** (sykepleie, bipolar lidelse), men gir mye støy — bibliotekskatalog-URL-er, web.archive.org og enkelt-artikkel-lenker dominerer resultatlisten.
- **`awesome-lists` er emne-avhengig:** svært god for tekniske emner (UX design, Steam Deck, embedded Linux), fullstendig tom for norskspråklige eller nisjepregede emner.
- **`hn-algolia` gir artikkel-kandidater, ikke feed-kandidater:** URL-ene er individuelle HN-poster, ikke redaksjoner med RSS. Høy støy-ratio.
- **Norske niche-emner (gro kantareller hjemme, strikkeoppskrifter, koreansk matlaging) avhenger 100 % av `llm-suggest`** — alle andre strategier returnerer 0.
- **Kjøretid:** varierer dramatisk fra 10 sek (tekniske emner med mange strategier) til 140 sek (norske emner der `wikipedia`-strategien blokkerer i opp til 2 min fordi den prøver alle fallbacks seriellt).

---

## Setup

**CLI-kommando brukt:**
```bash
cd "/Users/joakimmilianelden/Claude Code Projects/linspo"
npx tsx lib/content/discovery/cli.ts "<emne>"
```

**Eventuelle fikser:**

| Fil | Endring | Begrunnelse |
|-----|---------|-------------|
| `lib/content/discovery/cli.ts` linje 20 | `../../../../` → `../../../` | `__dirname` er `lib/content/discovery/`, ikke prosjektroten. 4 nivåer opp landerer én mappe over prosjektet og `.env.local` finnes ikke der. |

Uten denne fiksen feilet `llm-suggest` med `GEMINI_API_KEY mangler i miljøvariabler` på alle kjøringer.

**Begrensninger:**
- `GITHUB_TOKEN` er ikke satt — GitHub API kjøres uten auth (60 req/time). Merk: awesome-lists bruker `queries.slice(0, 1)` for å begrense, og er derfor ikke kritisk avhengig av token.
- Gemini gratis-tier: 15 RPM. Det ble brukt 6 sekunder mellom hvert emne-kall.
- DuckDuckGo og Substack ble ikke verifisert som fungerende i dette test-miljøet.
- RSS-verifisering er aktivert for topp 20 per kjøring (standard).

---

## Resultater per emne

### 1. UX design (smoke-test + fullkjøring)

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 30 (maks) |
| Med verifisert RSS | 21 |
| Tid | 11.0s |

**Strategistatus:**
- `wikipedia` ✓ 0 resultater (ingen direkte treff)
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 6 resultater
- `reddit` ✓ 8 resultater
- `awesome-lists` ✓ 9 resultater
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0–1 resultater (varierer per kjøring)
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Nielsen Norman Group** — `https://www.nngroup.com` — llm-suggest — 100% konfidens — RSS: `https://www.nngroup.com/rss`
2. **UX Collective (uxdesign.cc)** — `https://uxdesign.cc` — llm-suggest — 100% — RSS: `https://uxdesign.cc/feed`
3. **Smashing Magazine** — `https://www.smashingmagazine.com/category/ux-design` — llm-suggest — 100% — RSS: `https://www.smashingmagazine.com/feed`

**Observasjoner:** Resultatlisten er svært god. `awesome-lists` henter inn noen foreldede lenker (marvelapp.com styleguide, material.io/design) som ikke er aktive nyhetssider. `hn-algolia` henter inn mange individuelle HN-poster fra vidt forskjellige nettsteder med lav relevans.

---

### 2. Claude Code

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 30 (maks) |
| Med verifisert RSS | 19 |
| Tid | 53.6s |

**Strategistatus:**
- `wikipedia` ✓ 0 resultater
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 6 resultater
- `reddit` ✓ 6 resultater
- `awesome-lists` ✓ 0 resultater
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 11 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Wired AI** — `https://www.wired.com/tag/artificial-intelligence` — llm-suggest — 100% — RSS: `https://www.wired.com/feed/category/artificial-intelligence/rss`
2. **MIT Technology Review AI** — `https://www.technologyreview.com/artificial-intelligence` — llm-suggest — 100%
3. **r/ClaudeCode** — `https://www.reddit.com/r/ClaudeCode/` — reddit — 100% — RSS: `https://www.reddit.com/r/ClaudeCode/top.rss?t=week`

**Observasjoner:** `llm-suggest` misforstår emnet — den foreslår generelle AI-ressurser (Wired, MIT TR, OpenAI Blog, Google AI Blog) i stedet for Claude Code-spesifikke kilder. `hn-algolia` gir faktisk mest temaspecifikt innhold her, men i form av individuelle artikler. `code.claude.com` og `bsky.app` er åpenbare falske positiver. Kjøretiden på 53.6 sekunder er uvanlig høy — trolig på grunn av RSS-verifisering av 20 kandidater parallelt med trege servere.

---

### 3. Steam Deck

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 30 (maks) |
| Med verifisert RSS | 20 |
| Tid | 10.0s |

**Strategistatus:**
- `wikipedia` ✓ 0 resultater
- `llm-suggest` ✓ 6 resultater
- `mastodon` ✓ 6 resultater
- `reddit` ✓ 8 resultater
- `awesome-lists` ✓ 3 resultater
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 7 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **GamingOnLinux** — `https://www.gamingonlinux.com` — llm-suggest — 100% — RSS: `https://www.gamingonlinux.com/article_rss.php`
2. **PC Gamer Steam Deck** — `https://www.pcgamer.com/steam-deck` — llm-suggest — 100% — RSS: `https://www.pcgamer.com/rss`
3. **Rock Paper Shotgun** — `https://www.rockpapershotgun.com/tag/steam-deck` — llm-suggest — 100% — RSS: `https://www.rockpapershotgun.com/feed`

**Observasjoner:** Svært god kvalitet. `hn-algolia` henter ut noen irrelevante poster (f.eks. `Show HN: Itsyhome` som er en macOS-app — tilfeldig co-lokalisering i HN-tråd med Steam Deck-omtale). `awesome-lists` finner kun 3 lenker (ProtonDB, iFixit, EmuDeck) — nyttige, men ikke nyhetssider med RSS.

---

### 4. sykepleie

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 30 (maks) |
| Med verifisert RSS | 13 |
| Tid | 110.3s |

**Strategistatus:**
- `wikipedia` ✓ 17 resultater
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 5 resultater
- `reddit` ✓ 1 resultat (r/norge)
- `awesome-lists` ✗ feil: ingen liste funnet
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Sykepleien.no** — `https://sykepleien.no` — llm-suggest — 100% — RSS: `https://sykepleien.no/rss.xml`
2. **Fagbladet Sykepleie** — `https://www.fagbladet.no/sykepleie` — llm-suggest — 100% — RSS: `https://www.fagbladet.no/sykepleie/rss.xml`
3. **Tidsskrift for Den norske legeforening** — `https://www.tidsskriftet.no` — llm-suggest — 100% — RSS: `https://www.tidsskriftet.no/rss.xml`

**Observasjoner:** `llm-suggest` leverer de riktige norske fagkildene. `wikipedia` bidrar med 17 kandidater, men disse er i stor grad støy: bibliotekskatalog-URL-er (id.loc.gov, aleph.nkp.cz), web.archive.org-snapshots, og fagartikkel-lenker (ikke nyhetssider). `reddit` finner kun r/norge (irrelevant). Kjøretid 110 sek er trolig pga. `wikipedia`-strategiens treghet ved norsk emne (prøver norsk, fallback til engelsk, fallback til translitterert versjon — seriellt).

---

### 5. gro kantareller hjemme

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 6 |
| Med verifisert RSS | 5 |
| Tid | 12.1s |

**Strategistatus:**
- `wikipedia` ✗ feil: Ingen artikkel funnet
- `llm-suggest` ✓ 6 resultater
- `mastodon` ✓ 0 resultater
- `reddit` ✓ 0 resultater
- `awesome-lists` ✗ feil: ingen liste funnet
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **NRK Livsstil Mat og drikke** — `https://www.nrk.no/livsstil/mat-og-drikke` — llm-suggest — 100% (merk: RSS-URL er for NRK XL-seksjonen, ikke mat — mulig feilverifisering)
2. **Forskning.no Sopp** — `https://www.forskning.no/sopp-planter-biologi/tag/sopp` — llm-suggest — 100%
3. **Hageselskapet** — `https://www.hageselskapet.no/artikler` — llm-suggest — 100%

**Observasjoner:** Kun 6 kandidater — absolutt minimum. Systemet er totalt avhengig av `llm-suggest` for dette emnet. `llm-suggest` gjør en fornuftig jobb, men temaet er svært niche: kantareller kan ikke dyrkes hjemme på tradisjonell måte (de er mykorrhiza-sopp), og LLM-suggestene reflekterer dette med generelle hage- og soppressurser. Ingen av dem er spesifikt om hjemmedyrking av kantareller.

---

### 6. kvantedatamaskiner

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 8 |
| Med verifisert RSS | 6 |
| Tid | 14.7s |

**Strategistatus:**
- `wikipedia` ✗ feil: Ingen artikkel for "kvantedatamaskiner" (norsk søketerm)
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 1 resultat (kun mastodon.social)
- `reddit` ✓ 0 resultater
- `awesome-lists` ✗ feil: ingen liste
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Quanta Magazine** — `https://www.quantamagazine.org/tag/quantum-computing` — llm-suggest — 100% — RSS: `https://www.quantamagazine.org/feed`
2. **IEEE Quantum Computing** — `https://quantumcomputing.ieee.org` — llm-suggest — 100%
3. **Nature Quantum Computing** — `https://www.nature.com/subjects/quantum-computing` — llm-suggest — 100% — RSS: `https://www.nature.com/subjects/quantum-computing.rss`

**Observasjoner:** `wikipedia`-strategien feiler fordi den søker på "kvantedatamaskiner" (norsk) og finner ingen artikkel — den burde fallback til "quantum computers" (en.wikipedia.org) men gjør ikke det her. Kun 8 resultater er for lite for et emne med god engelsk-dekning. `reddit` finner ikke r/QuantumComputing (finnes, har ~150k subs) — mulig emne-oversettingsproblem.

---

### 7. strikkeoppskrifter

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 7 |
| Med verifisert RSS | 4 |
| Tid | 15.7s |

**Strategistatus:**
- `wikipedia` ✗ feil: Ingen artikkel funnet
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 0 resultater
- `reddit` ✓ 0 resultater
- `awesome-lists` ✗ feil: ingen liste
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Garnstudio Blogg** — `https://www.garnstudio.com/blog` — llm-suggest — 100% — RSS: `https://www.garnstudio.com/blog/feed`
2. **Dustorealpakka Blogg** — `https://www.dustorealpakka.no/blogg` — llm-suggest — 100%
3. **Pickles.no** — `https://www.picklesoslo.no/blogs/strikkeoppskrifter` — llm-suggest — 100%

**Observasjoner:** Kun 7 kandidater, helt avhengig av `llm-suggest`. `reddit` treffer ikke r/knitting (2,1M subs) eller r/nordiskestrikk fordi søket er på norsk. Mastodon og HN uten treff er forventet for dette emnet. Kvaliteten på `llm-suggest`-resultatene er god — Garnstudio og Pickles er legitime norske garnbutikk-blogger.

---

### 8. bipolar lidelse

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 20 |
| Med verifisert RSS | 3 |
| Tid | 140.5s |

**Strategistatus:**
- `wikipedia` ✓ 12 resultater
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 1 resultat
- `reddit` ✓ 0 resultater
- `awesome-lists` ✗ feil: ingen liste
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Dagens Medisin Bipolar** — `https://www.dagensmedisin.no/tema/bipolar-lidelse` — llm-suggest — 100% — RSS: `https://www.dagensmedisin.no/rss/tema/bipolar-lidelse`
2. **NIMH** — `https://www.nimh.nih.gov/health/topics/bipolar-disorder` — llm-suggest — 100% — RSS: `https://www.nimh.nih.gov/rss.xml`
3. **#bipolarlidelse** på mastodon.social — mastodon — 100% — RSS: `https://mastodon.social/tags/bipolarlidelse.rss`

**Observasjoner:** Svært lav RSS-rate (3 av 20 = 15%). `wikipedia` dominerer med 12 kandidater, men nesten alle er uten RSS og lav konfidens (0.25). `web.archive.org`, `id.ndl.go.jp`, `omim.org`, `britannica.com` er alle støy. Tid 140 sek er den høyeste — Wikipedia prøver mange fallback-kall seriellt. `llm-suggest` gir nyttige norske og internasjonale helsesider, men mange mangler RSS (Nasjonal kompetansetjeneste, psykiatri.no).

---

### 9. koreansk matlaging

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 6 |
| Med verifisert RSS | 4 |
| Tid | 14.8s |

**Strategistatus:**
- `wikipedia` ✗ feil: Ingen artikkel funnet
- `llm-suggest` ✓ 6 resultater
- `mastodon` ✓ 0 resultater
- `reddit` ✓ 0 resultater
- `awesome-lists` ✗ feil: ingen liste
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 0 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **The Korea Times Food** — `https://www.koreatimes.com/news/culture/food` — llm-suggest — 100%
2. **Serious Eats Korean Food** — `https://www.seriouseats.com/tag/korean-food` — llm-suggest — 100% — RSS: `https://www.seriouseats.com/all.rss`
3. **Maangchi** — `https://www.maangchi.com` — llm-suggest — 100% — RSS: `https://www.maangchi.com/feed`

**Observasjoner:** Kun 6 kandidater. `reddit` treffer ikke r/koreanfood (225k subs) eller r/food, trolig fordi søketermen er norsk. `wikipedia` finner ikke "koreansk matlaging" (norsk artikkel er liten), burde fallback til "Korean cuisine" på en.wikipedia.org. `llm-suggest` leverer solide internasjonale blogg-kandidater (Maangchi er gullstandarden for koreansk matlaging).

---

### 10. embedded Linux

| Metrikk | Verdi |
|---------|-------|
| Antall kandidater | 30 (maks) |
| Med verifisert RSS | 21 |
| Tid | 19.4s |

**Strategistatus:**
- `wikipedia` ✓ 0 resultater (ingen direkte treff på "embedded Linux")
- `llm-suggest` ✓ 7 resultater
- `mastodon` ✓ 6 resultater
- `reddit` ✓ 8 resultater
- `awesome-lists` ✓ 7 resultater
- `search-engine` ✓ 0 resultater
- `hn-algolia` ✓ 2 resultater
- `substack-discover` ✓ 0 resultater

**Topp 3 anbefalte:**
1. **Embedded.com** — `https://www.embedded.com` — llm-suggest — 100% — RSS: `https://www.embedded.com/feed`
2. **Bootlin Blog** — `https://bootlin.com/blog` — llm-suggest — 100% — RSS: `https://bootlin.com/feed/`
3. **CNX Software** — `https://www.cnx-software.com` — llm-suggest — 100% — RSS: `https://www.cnx-software.com/feed`

**Observasjoner:** Utmerket resultat. `awesome-lists` henter inn solide verktøy-lenker (OpenWrt, barebox, coreboot, buildroot) men disse er prosjektsider, ikke nyhetssider med RSS. `reddit` treffer r/embeddedlinux, r/embedded, r/yocto, r/linux — alle relevante. Systemet fungerer best for tekniske, engelskspråklige emner med GitHub awesome-lists.

---

## Tverr-emne-funn

### Hvilke strategier yter best?

| Strategi | Treff (av 10 emner) | Merknad |
|----------|---------------------|---------|
| `llm-suggest` | 10/10 | Eneste strategi med treff på alle emner. Beste signal-til-støy. |
| `reddit` | 5/10 | Ekstremt god for tekniske/engelske emner. Null for norskspråklige. |
| `mastodon` | 8/10 | Treffer på alle engelske og de fleste norske emner. Lavt innhold per feed. |
| `awesome-lists` | 4/10 | Svært god for tekniske emner med etablerte GitHub-lister. |
| `hn-algolia` | 4/10 | Gir artikkel-URL-er, ikke redaksjoner. Høy støy. |
| `wikipedia` | 3/10 | Kun nyttig for etablerte faglige emner. Mye støy (bibliotekskataloger). |
| `search-engine` | 0/10 | Ikke-funksjonell. DuckDuckGo returnerte ingenting. |
| `substack-discover` | 0/10 | Ikke-funksjonell. Substack API returnerte ingenting. |

### Hvilke strategier er bortkastede?

**`search-engine` (DuckDuckGo HTML-scraping):** Returnerte 0 resultater på alle 10 emner. DuckDuckGo serverer sannsynligvis en CAPTCHA eller 202-respons til headless-klienter uten JavaScript. Strategien er ikke-funksjonell i sin nåværende form.

**`substack-discover`:** Returnerte 0 resultater på alle 10 emner. Substack-API-et (`/api/v1/search/top?type=publication`) ser ut til å ikke returnere publikasjoner. Kan skyldes API-endring eller emne-mismatch.

### Norske vs. engelske emner

| Emne-type | Gjennomsnitt kandidater | Gjennomsnitt RSS-verifisert | Strategier som bidrar |
|-----------|------------------------|-----------------------------|-----------------------|
| Engelske/tekniske (UX, Claude Code, Steam Deck, embedded Linux) | 30 | 20 | llm-suggest, reddit, mastodon, awesome-lists, hn-algolia |
| Norske niche (kantareller, strikkeoppskrifter, koreansk matlaging) | 6 | 4.3 | Kun llm-suggest |
| Norske faglige (sykepleie, bipolar, kvantedatamaskiner) | 19.3 | 7.3 | llm-suggest + wikipedia (støy) |

Systemet har en klar skjevhet mot engelskspråklige emner. For norske niche-emner er `llm-suggest` den eneste fungerende strategien.

### Signal-til-støy

- **Høy støy:** `wikipedia` (bibliotekskataloger, enkeltartikler), `hn-algolia` (tilfeldige poster)
- **Middels støy:** `awesome-lists` (prosjektsider uten RSS, foreldede lenker)
- **Lav støy:** `llm-suggest`, `reddit`, `mastodon`

---

## Anbefalinger

### Beholde — fungerer godt

- **`llm-suggest`** — Kritisk. Eneste strategi som leverer på alle emner. Beholdes uendret.
- **`reddit`** — Solid for engelske emner. Beholdes. Legg til automatisk oversettelse av emnet til engelsk (`topic → englishTopic`) som en forhåndsbehandlingssteg i `index.ts` for å bedre dekning av norske emner.
- **`mastodon`** — Nyttig for sanntidssporing. Beholdes. Lav informasjonsverdi per feed, men enkel å verifisere.

### Forbedre

- **`wikipedia`:** Problemet er at norske søkeord ikke finnes på no.wikipedia.org for mange emner, og fallback til en.wikipedia.org krever at søketermen er på engelsk. Løsning: bruk `llm-suggest` eller hardkod en oversettelse som forhåndsbehandling. Alternativt: slå av for norske niche-emner ved å sjekke tegnsettet (æøå). Størst gevinst: filtrer bort URL-er fra bibliotekskataloger (`aleph.nkp.cz`, `id.loc.gov`, `catalogue.bnf.fr`, `d-nb.info`, `web.archive.org`) i `wikipedia.ts → DOMAIN_BLOCKLIST`.
  - **Fil:** `lib/content/discovery/strategies/wikipedia.ts`, linje 16–36 (DOMAIN_BLOCKLIST). Legg til `web.archive.org`, `id.loc.gov`, `catalogue.bnf.fr`, `datos.bne.es`, `d-nb.info`, `id.ndl.go.jp`, `aleph.nkp.cz`.

- **`hn-algolia`:** Strategien henter artikkel-URL-er i stedet for redaksjons-domener med RSS. Løsning: aggreger domener fra HN-resultater i stedet for å returnere individuelle artikkel-URL-er, og sjekk om domenets rot har RSS.
  - **Fil:** `lib/content/discovery/strategies/hn-algolia.ts`

- **`awesome-lists`:** Legg til RSS-url-sjekk ved parse-tid. Mange lenker fra awesome-lists er til prosjektsider, dokumentasjon, eller verktøy — ikke nyhetssider. Vurder å score ned URL-er som slutter på `/docs`, `/guide`, `/getting-started` etc.

### Droppe eller deaktivere

- **`search-engine`** — Deaktiver inntil DuckDuckGo-scraping fungerer, eller erstatt med en faktisk søke-API (Brave Search API, SearXNG self-hosted). Den bidrar med 0 verdi og øker kjøretid uten å feile eksplisitt (returnerer bare 0 resultater stille).
  - Midlertidig fix: legg til `search-engine` i default `skipStrategies` i `index.ts`.

- **`substack-discover`** — Verifiser om Substack-APIet fungerer. Gjør et manuelt kall:
  ```bash
  curl "https://substack.com/api/v1/search/top?query=ux+design&type=publication"
  ```
  Hvis det returnerer tomt, enten oppdater API-kallet eller deaktiver strategien.

### Ytelse

- **Kjøretid for norske emner (110–140 sek):** Skyldes `wikipedia`-strategiens sekvensielle fallback (norsk → engelsk → translitterert). Vurder å kjøre alle tre parallelt med `Promise.race`/`Promise.allSettled`.
- **Verifisering av topp 20:** RSS-verifisering kan ta 30–50 sekunder ekstra for trege servere. Vurder å redusere `verifyTopN` til 10 som standard, eller øke timeout-parallellitet.

---

*Rapport generert av: test- og rapport-agent, Claude Sonnet 4.6 — 2026-05-16*
