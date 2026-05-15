# Linspo — kilde- og AI-strategi-research

> Utarbeidet: 15. mai 2026 | Forfatter: AI research-konsulent
> Versjon: 1.0

---

## TL;DR (12 punkter)

1. **RSS er fremdeles ryggraden** — alle seriøse curation-apper bygger på RSS, supplert med API-er og scraping. Du er på riktig spor.
2. **Medium er en god kilde med forbehold** — RSS fungerer gratis (`medium.com/feed/@username` eller `publication.com/feed/`), men innhold bak betalingsmur er ikke tilgjengelig i feeden. Signal-til-støy er lavere enn f.eks. Smashing Magazine.
3. **Substack er glimrende** — alle newsletters har `newsletter.substack.com/feed`. For Linspos formål er The Pragmatic Engineer, TLDR Tech og TLDR Design de mest relevante. TLDR har også offisiell RSS på `tldrnewsletter.com/rss`.
4. **Bluesky gir deg RSS per profil** gratis via `openrss.org/bsky.app/profile/[handle]`. Hashtag/topic-feeds finnes ikke nativt, men `public.api.bsky.app` har søke-API uten autentisering.
5. **Mastodon hashtag-RSS er enkelt** — `mastodon.social/tags/uxdesign.rss` fungerer rett ut av boksen for ethvert offentlig Mastodon-instans.
6. **Lobste.rs er undervurdert for Joakims formål** — har `ai`, `design`, `a11y` og `games`-tagger, alle med dedikert RSS på `lobste.rs/t/[tag].rss`. Lavere volum enn HN, men høyere signal.
7. **AI-sammendrag er ofte ikke det mest verdifulle** — klassifisering + personlig scoring + ukentlig syntese gir mer verdi per token enn per-artikkel-sammendrag, særlig når RSS-feeds allerede inkluderer `<description>`.
8. **20 RPD-budsjettet** (Gemini 2.5 Flash, verifisert desember 2025-nedskjæring) bør brukes til batch-klassifisering (én kall per 10 artikler) og ukentlig syntese, ikke individuelle sammendrag.
9. **For n=1 bruker er implisitte signaler sterkere** — klikk + lesetid (>30 sek terskel) + "save" er bedre indikatorer enn eksplisitt 👍/👎 som skaper fatigue.
10. **Feedback må omsettes til konkret prompt-endring** — ikke bare lagres som data. En enkel emne-vektingstabell som oppdateres ukentlig er mer effektiv enn kompleks ML.
11. **Daglig digest slår real-time feed** for Joakims bruksmønster — curated morning brief (7-10 elementer) gir høyere engasjement enn åpen feed, ifølge sammenlignbare apper.
12. **Time Extension og GamingOnLinux er de to beste handheld-kildene** — seriøs dekning, aktiv RSS, lav støy. RetroDodo er mer "vibes", Retro Game Corps er utmerkede guides men lavfrekvent.

---

## Oppgave 1 — Kilde-strategi

### Hvordan sammenlignbare apper løser dette

**Feedly** og **Inoreader** er de to dominerende "pro"-RSS-aggregatorene, og begge bygger modellen sin på en enkel sannhet: *de aller fleste gode kilder allerede har RSS*. Feedly tilbyr enterprise-rettet AI-analyse ("Leo") som filtrerer og prioriterer, men kildemodellen er ren RSS + brukerbidrag. Inoreader la til Bluesky-, YouTube- og Reddit-integrasjon i 2025/2026, og er mer "power user"-orientert med regelmotor for auto-tagging og routing.

**Refind** er det interessante avviket. De crawler 10 000+ kilder aktivt (publikasjoner, Substack, Medium, X/Twitter, LinkedIn) og bruker en kombinasjon av brukeradferd (hva folk lagrer og deler) og redaksjonelt kurasjon til å bygge en scoremodell. De favoriserer "timeless pieces" — innhold med lang holdbarhet. Kildemodellen er i praksis en crawl-basert tilnærming med bruker-signaler som reranker. Ingen offentlig API, men en verdifull inspirasjon: *kurasjon handlar om scoring, ikke bare aggregering*.

**Readwise Reader** (Ghostreader) har en mer enkel kildemodell — RSS + e-post newsletters via sin innebygde e-postadresse. AI-en (Ghostreader) brukes *etter* innhenting, på individuelle dokumenter: oppsummering, ordoppslag, konseptforklaring, spørsmålsgenerering. Det er en "read-it-later"-app med AI-hjelp, ikke en AI-kurator.

**Matter** kombinerer RSS, "save from anywhere"-extension og sosiale anbefalinger (hva venner/folk du følger lagrer). AI-sammendrag genereres ved forespørsel, og er beskrevet som "best-designede" blant 2025-2026 lesapper. Kildemodellen er hybrid: RSS + brukerinnsending + sosial graf.

**Inoreader 2026** er mest relevant for Linspos fremtid: de la til Bluesky-, YouTube-, Reddit- og podcast-ingestion, og "Inoreader Intelligence" lar deg kjøre egendefinerte AI-prompts på artikkelinnhold. Dette er "Linspo med betalingsmur".

**Nøkkelinsikt fra konkurrentanalysen:** Alle suksessfulle curation-apper bruker RSS som fundament og supplerer med to-tre spesialtilpassede integrasjoner (e-post-til-RSS, sosiale API-er, spesifikke plattform-crawler). Ingen av dem lar noe som helst stoppe dem fra å bruke RSS der det finnes — og det finnes nesten overalt.

### Vurdering: Medium, Substack, Bluesky, Mastodon, Lobste.rs m.fl.

**Medium**
RSS-URL-format: `medium.com/feed/@username` eller `medium.com/feed/publication-name`, og for custom domain-publikasjoner: `example.com/feed/`. Fungerer uten API-nøkkel. Begrensning: Artikler bak Medium-betalingsmur leverer kun tittel + excerpt i feeden, ikke fulltekst. Signal-til-støy er *middels* — Medium har mye "10 tips"-innhold og SEO-stoff, men også genuine dypdykk. Anbefaling for Linspo: **legg til selektivt** — kun spesifikke publikasjoner (f.eks. UX Collective: `uxdesign.cc/feed/`, Bootcamp: `bootcamp.uxdesign.cc/feed/`) fremfor `medium.com/tag/ux-design` (som er veldig støyfullt).

**Substack**
Alle Substack-newsletters har RSS: `newsletter.substack.com/feed`. Innhold bak Substack paywall er ikke tilgjengelig i RSS-feed (kun tittel/intro for paid issues). Gratis-newsletters som Linspo-relevante: The Pragmatic Engineer publiserer gratis "The Pulse"-seksjoner, TLDR Tech (`tldrnewsletter.com/rss` — verifisert offisiell feed), TLDR Design og TLDR AI (`tldr.tech/ai/rss` — verifisert). Anbefaling: **høy prioritet** for TLDR-serien.

**Bluesky / AT Protocol**
Bluesky lanserte native RSS-støtte: `bsky.app/profile/[handle]/rss` fungerer for enhver offentlig profil. OpenRSS forbedrer dette til `openrss.org/bsky.app/profile/[handle]` med bedre link-embedding og thumbnails. Hashtag/topic-feeds: **finnes ikke** som native RSS. Alternativ: bruk `public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=%23uxdesign` (ingen autentisering nødvendig) for søkebasert henting. Nytt i 2026: Bluesky-appen Attie (bygget på AT Protocol + Claude) bygger tilpassede feeds. Anbefaling for Linspo: **lav til middels prioritet nå** — overvåk spesifikke Bluesky-profiler (UX-folk, Anthropic-ansatte) via RSS-profil-feeds, men ikke hashtag-søk i første iterasjon.

**Mastodon**
Hashtag-RSS fungerer perfekt: `mastodon.social/tags/[hashtag].rss` — kun offentlige innlegg, ingen autentisering. Relevante hashtags: `#uxdesign`, `#claude`, `#anthropic`, `#steamdeck`. Begrensning: kun innlegg fra det spesifikke instanset (mastodon.social er størst). For bredere dekning: hent fra 3-5 instanser. Anbefaling: **middels prioritet** — legg til `#uxdesign` og `#steamdeck` fra mastodon.social som prøve.

**Lobste.rs**
Svært relevant for Joakims tekniske interesser. Verifiserte tagger med RSS:
- `lobste.rs/t/ai.rss` — AI/ML-diskusjoner
- `lobste.rs/t/design.rss` — visuell design
- `lobste.rs/t/a11y.rss` — tilgjengelighet
- `lobste.rs/t/games.rss` — spill
- Kombinert: `lobste.rs/t/ai,design.rss`

Volum er lavt (5-20 poster/dag total), men signal-til-støy er *svært høyt* — invite-only community av utviklere og tech-folk. Mangler Claude/Anthropic-spesifikk tag. Anbefaling: **høy prioritet**, særlig `ai` og `design`.

**TLDR-nyhetsbrevene**
Offisiell RSS: `tldrnewsletter.com/rss` (verifisert). TLDR publiserer nå 14+ spesialiserte newsletters, inkludert TLDR Design og TLDR AI. Daglig oppdatert, meget høy signal-til-støy for tech-nyheter. Anbefaling: **høy prioritet** — legg til TLDR Tech, TLDR AI og TLDR Design.

**The Pragmatic Engineer**
Tilgjengelig via Substack-RSS: `newsletter.pragmaticengineer.com/feed`. Betalingsmur for fullstendige artikler, men gratis "Pulse"-seksjoner er verdifulle. Alternativt: `blog.pragmaticengineer.com/rss` for blogg-innlegg. Anbefaling: **middels prioritet** — mer engineering management enn Joakims kjerneinteresser.

**Bytes.dev**
Ingen offisiell RSS. Det finnes et uoffisielt GitHub-prosjekt (`rss-generator-bytes`) men påliteligheten er usikker. Anbefaling: **lav prioritet** — bruk Kill the Newsletter (`kill-the-newsletter.com`) til å konvertere e-post til RSS-feed som backup.

**ArXiv**
Offisiell RSS per kategori: `rss.arxiv.org/rss/cs.HC` (Human-Computer Interaction), `rss.arxiv.org/rss/cs.AI`, `rss.arxiv.org/rss/cs.LG` (Machine Learning). Kombinert: `rss.arxiv.org/rss/cs.HC+cs.AI`. For Linspo er dette et nisje-valg — veldig akademisk, lite relevant for "handheld gaming". Anbefaling: **kun cs.HC** hvis Joakim vil holde seg oppdatert på UX-forskning; ellers hopp over.

**YouTube-kanaler (ETA Prime, Retro Game Corps)**
YouTube-kanaler har RSS: `www.youtube.com/feeds/videos.xml?channel_id=[CHANNEL_ID]`. Innholdet er tittel + beskrivelse, ingen transkripsjon. For transkripsjon trenger du `youtube-transcript-api` (Python) — uten AI-kall kan du hente auto-genererte undertekster. Begrensning: transkripsjon-henting krever enten Google API-nøkkel eller uoffisiell scraping. Anbefaling: **middels prioritet** — legg til YouTube-RSS for ETA Prime og Retro Game Corps, men ikke transkripsjoner i første omgang. Høyt volume, høy relevans for handheld-gaming.

### Anbefalte nye kilder for Linspo (prioritert tabell)

| Prioritet | Kilde | RSS-URL | Signal/Støy | Dekning | Tekniske merknader |
|-----------|-------|---------|-------------|---------|-------------------|
| **1 — Høy** | Lobste.rs (ai+design) | `https://lobste.rs/t/ai,design.rss` | Svært høy | UX, AI, tech | Lavt volum (~5/dag), invite-only community |
| **1 — Høy** | TLDR Tech | `https://tldrnewsletter.com/rss` | Høy | Generell tech | Daglig digest, verifisert offisiell |
| **1 — Høy** | TLDR AI | `https://tldr.tech/ai/rss` | Høy | AI/ML/Claude | Verifisert, svært relevant |
| **1 — Høy** | TLDR Design | `https://tldr.tech/design/rss` | Høy | UX/UI | Verifisert |
| **2 — Middels** | Time Extension | `https://www.timeextension.com/feeds/news` | Høy | Retro/handheld gaming | Verifisert fungerende RSS (20 artikler/dag) |
| **2 — Middels** | Pocket Tactics | `https://www.pockettactics.com/mainrss.xml` | Middels | Handheld/mobil gaming | Dekker Switch, Steam Deck, mobile |
| **2 — Middels** | Anthropic News | `https://openrss.org/feed/www.anthropic.com/news` | Svært høy | Claude/Anthropic | Via OpenRSS, fungerer stabilt |
| **2 — Middels** | UX Collective (Medium) | `https://uxdesign.cc/feed/` | Middels-høy | UX/UI metodikk | Medium custom domain, unngår støy |
| **2 — Middels** | Mastodon #uxdesign | `https://mastodon.social/tags/uxdesign.rss` | Middels | UX-diskusjoner | Kun mastodon.social-instans |
| **3 — Lav** | Retro Game Corps | `https://www.retrogamecorps.com/feed/` | Høy | Handheld guides | Lav frekvens (1-3/uke), dype guides |
| **3 — Lav** | arXiv cs.HC | `https://rss.arxiv.org/rss/cs.HC` | Middels (akademisk) | UX-forskning | Daglig, høyt volum av papers |
| **3 — Lav** | Bluesky-profiler | `https://openrss.org/bsky.app/profile/[handle]` | Avhenger av profil | Varierer | Per-profil, manuelt vedlikehold |
| **3 — Lav** | Mastodon #steamdeck | `https://mastodon.social/tags/steamdeck.rss` | Lav-middels | Steam Deck | Mye uformelt innhold |
| **3 — Lav** | The Pragmatic Engineer | `https://newsletter.pragmaticengineer.com/feed` | Høy | Engineering | Betalingsmur på mest innhold |
| **Avvent** | RetroDodo | `https://retrododo.com/feed/` | Middels | Retro gaming | Bekreftet eksistens men ikke URL |

### Tekniske implikasjoner

**Kill the Newsletter** (`kill-the-newsletter.com`): Konverterer e-post-newsletters til Atom-feeds. Nyttig for newsletters uten RSS (f.eks. Bytes.dev). NB: Store plattformer som Substack og Medium blokkerer `@kill-the-newsletter.com`-adresser, men nyere nyhetsbrev som hostes på egne domener fungerer fint.

**OpenRSS** (`openrss.org`): Genererer RSS fra nettsteder som mangler det — inkludert `openrss.org/www.anthropic.com/news` for Anthropic-nyheter (verifisert). Gratis, ingen API-nøkkel.

**Betalingsmur-håndtering**: RSS-feeds for betalingsmur-innhold (Medium, Pragmatic Engineer, Substack paid) leverer kun tittel + excerpt. Dette er faktisk *tilstrekkelig* for klassifisering og scoring i Linspo — du trenger ikke fulltekst for å avgjøre om artikkelen er relevant. AI-sammendrag på excerpt + tittel kan gi nok grunnlag.

**YouTube RSS**: `https://www.youtube.com/feeds/videos.xml?channel_id=UCecYBRFWDabJM2vQQz_7c2g` (ETA Prime) og `https://www.youtube.com/feeds/videos.xml?channel_id=UCjA4Msp3I_hzj2PPzfDO_0w` (Retro Game Corps). Inneholder kun tittel, beskrivelse og thumbnail — ingen transkripsjon uten ekstra behandling.

---

## Oppgave 2 — AI-bruk

### Hvor er AI faktisk verdifullt?

**Spørsmål 1: Når er AI-sammendrag bedre enn forfatterens eget?**

AI-genererte sammendrag er bedre enn forfattersummary i tre scenarioer:
1. Feeden mangler `<description>` (bare tittel)
2. `<description>` er truncated eller ren HTML/boilerplate
3. Du vil ha et sammendrag *på tvers av relaterte artikler* (syntese)

For de fleste moderne RSS-feeds som Linspo allerede bruker (Smashing Magazine, NN/g, UX Collective), er `<description>` gjerne god nok for å ta en "lese/ikke lese"-beslutning. Forfatterens egne oppsummeringer er dessuten faktisk mer presise — de vet hva artikkelen handler om bedre enn et AI som bare ser excerpt.

**Konklusjon**: Bruk forfatterens `<description>` som standard. Bruk AI kun der den mangler, er veldig kort (<50 tegn), eller for synteseproduktet.

**Spørsmål 2: Alternative AI-bruksområder**

Rangert etter verdi-per-token for Linspo:

1. **Batch-klassifisering** (høyest verdi): Gi AI 10 artikler + titler og be den klassifisere etter interessekategori (UX, Claude, handheld, generell tech) og tildele relevans-score 1-10 for *denne spesifikke brukeren*. Ett kall, 10 artikler, lavt token-forbruk.

2. **Ukentlig syntese** (høy verdi): "Her er de 20 mest leste/lagrede artiklene fra denne uken. Hva er de tre viktigste trendene på tvers? Hva bør Joakim følge opp?" Dette er noe AI er genuint bedre til enn noe annet.

3. **Query expansion for kilde-oppdagelse** (middels verdi): "Joakim er interessert i handheld gaming. Foreslå 5 nye RSS-feeds han bør legge til." En slik kall én gang i måneden.

4. **Refleksjonsspørsmål** (middels verdi): For artikler Joakim faktisk leser (klikker inn), generer ett spørsmål som hjelper ham å koble til egne prosjekter. Eks: "Denne artikkelen handler om progressive disclosure i UI — hvordan kan dette brukes i Linspos feed-design?"

5. **Per-artikkel-sammendrag** (lavest verdi for dette prosjektet): Krevende, dyrt, og lite differensiert fra det forfatteren allerede har skrevet.

### Hva konkurrenter gjør

| App | AI-bruk | Strategi |
|-----|---------|---------|
| **Feedly (Leo)** | Prioritering + filtering + tagging | AI jobber *før* lesing — sorterer og skjuler irrelevant innhold |
| **Readwise Ghostreader** | Oppsummering, ordoppslag, spørsmål, notattitler | AI jobber *under* lesing — hjelper med forståelse og notater |
| **Matter** | AI-genererte sammendrag (swipe-down) | AI jobber *ved behov* — ikke automatisk |
| **Refind** | Personlig score basert på brukeradferd + editorial | AI jobber *under kurasjon* — scoring og prioritering |
| **Inoreader Intelligence** (2026) | Egendefinerte prompts på artikkeltekst | AI jobber *etter lesing* — analyse og ekstrahering |

**Mønster**: De beste appene bruker AI til *prioritering og syntese*, ikke bare *oppsummering*. Feedly er den mest relevante for Linspo: Leo-systemet klassifiserer innhold og gir relevans-score. Dette er veien fremover.

### Anbefalt strategi for Linspo (gitt 20 RPD-budsjett)

> **Anta 20 RPD med Gemini 2.5 Flash** (bekreftet nedskjæring desember 2025). Merk: Gemini 2.5 Flash-Lite har 1000 RPD — vurder å bruke Flash-Lite for klassifisering og Flash for syntese.

**Daglig bruk (18 av 20 kall):**
- Systemet henter ~50-100 nye artikler per dag
- Batch dem i grupper på 5-8 artikler: `[tittel, source, description]` × 8 per kall
- Be Gemini om: (a) kategori-klassifisering, (b) relevans-score 1-10, (c) flagge om artikkelen er tidsempfølsom vs. evergreen
- **Resultat: ~7-12 batch-kall per dag** = holder seg godt under 18

**Ukentlig bruk (2 "lagrede" kall):**
- Spar 2 kall per dag (14 totalt i uken) til én ukentlig syntese på søndag
- Input: alle artikler Joakim klikket, lagret eller leste >30 sek siste uke
- Output: "Ukens highlights", 3-5 trends, og 2-3 nye kildeforslag

**Alternativ med Flash-Lite:**
Gemini 2.5 Flash-Lite har 1000 RPD gratis. Bruk Flash-Lite til all klassifisering/scoring, og reserver Flash til ukentlig syntese og refleksjonsspørsmål. Dette fjerner budsjettbegrensningen for klassifisering fullstendig.

**Hva vi mister ved å droppe per-artikkel-sammendrag:**
- Linspo viser `<description>` fra RSS som standard i kortene
- Bruker ser forfatterens oppsummering (god nok for de fleste beslutninger)
- For artikler uten `<description>` kan Flash-Lite generere summaries i bulk uten å tære på Flash-budsjettet

---

## Oppgave 3 — Brukerfeedback

### Implicit vs eksplisitt signaler

**Implisitte signaler (automatisk innsamlet):**

| Signal | Vekt | Tolkning | Teknisk implementasjon |
|--------|------|---------|----------------------|
| Klikk på artikkel | Middels | Positiv, men kan skyldes nysgjerrighet | Logg timestamp + source |
| Lesetid >30 sek | Høy | Sterk positiv — bruker faktisk leser | JavaScript-timer, pauses ved inaktivitet |
| "Save"/bokmerke | Svært høy | Eksplisitt ønske om å huske | Eksisterende funksjon i MVP |
| Scroll-dybde >80% | Høy | Fulgte med gjennom artikkelen | Intersection Observer API |
| Tilbake til feed <5 sek etter klikk | Negativ | Artikkelen svarte ikke til forventningene | Logg bounce-back |
| Deling | Svært høy | Sterkeste positive signal | Del-funksjon + logg |

**Eksplisitte signaler:**
- 👍/👎 på enkelt-artikler: fungerer, men fatigue-risiko ved daglig bruk
- "Mer som dette" / "Skjul kilde": kraftig og tydelig signal
- Ukentlig mini-rating: "Hva synes du om denne ukens feed?" (1-5) — lavere fatigue enn per-artikkel

**Forskningsfunn om dwell time**: Studier viser at >30 sekunder er god terskel for positiv tolkning. Kortere tid kan bety at brukeren allerede kjente stoffet (ikke nødvendigvis negativt). Løsning: vekt scrolldybde høyere enn rå lesetid.

### Anbefalt feedback-modell for n=1 MVP

**Fase 1 (nå — 0 til 30 dager):**
Kun implisitte signaler. Logg klikk, lesetid og saves i Supabase. Ingen eksplisitt feedback til Joakim ennå. Bygg datagrunnlag.

**Fase 2 (30-90 dager):**
Legg til to enkle eksplisitte signaler:
1. Tommel opp/ned på *source*, ikke artikkel (gir mer stabil signal)
2. "Skjul dette emnet i 2 uker"-knapp (gi brukeren kontroll uten permanent blokkering)

**Fase 3 (90+ dager):**
Ukentlig syntese-notifikasjon med mulighet for mini-feedback: "Var denne ukens feed bra?" + fri tekstboks for notater til seg selv.

**Feedbackfatigue-strategi:** 
- Aldri vis feedback-UI i selve feed-scrolling
- Gjør det valgfritt og lett å avvise
- Visualiser at "AI lærer": vis en enkel tag-sky over "Dine toppinteresser denne måneden" som oppdateres synlig. Joakim ser da at preferansene hans registreres.

### Tidsdimensjonen

Joakims interesser varierer over tid (f.eks. intenst fokus på Claude Code i en periode, deretter tilbake til UX). Modell dette ved å bruke *eksponentielt glidende gjennomsnitt* på kilde-vekting: nyere signaler teller mer enn gamle. Enkel implementasjon: score = 0.7 × siste_uke_score + 0.3 × forrige_score. Etter 3 uker uten klikk på en kilde synker scoren automatisk.

### Hvordan feedback omsettes til pipeline-endring

```
Feedback → Supabase-tabell → Ukentlig jobb →
  1. Oppdater kilde-vekting (høy-score kilder dukker øverst)
  2. Oppdater AI-klassifiserings-prompt (legg til/fjern emner)
  3. Juster antall artikler per kilde i daglig batch
  4. Blokkér emner/tags som har konsekvent dårlig score
```

Konkret teknisk løsning: En `source_weights`-tabell i Supabase med felt `source_id`, `weight` (0.0-2.0), `last_updated`. Vekten multipliseres med relevans-scoren fra AI. En ukentlig GitHub Actions-jobb re-kalkulerer vektene basert på loggede signaler.

**Spotify Discover Weekly som inspirasjon:** Spotifys hemmelige våpen var ikke algoritmen, men *timing* — mandag morgen, én gang i uken, forventningsbygging. Linspo kan lære av dette: ukentlig syntese levert på søndag kveld ("Her er hva du ikke bør gå glipp av denne uken") bygger en vane og forventning som øker engasjement.

---

## Oppgave 4 — Annen relevant research

### Filter bubble og serendipitet i n=1-app

Filter bubble-problematikken er paradoksal for en personlig curation-app: *hele poenget* er å filtrere ned til det relevante, men overdreven filtrering kan gi blinde flekker. For Joakim, som bruker Linspo for *sin egen informasjonsdiett*, er dette faktisk et bevisst valg han gjør — ikke noe som gjøres *mot* ham.

Likevel: **bygg inn serendipitet-mekanismer** fra starten. Konkrete tiltak:
1. Én "wildcard"-artikkel per dag fra en tilfeldig kilde utenom Joakims toppscore-kategorier
2. Månedlig "hva du kanskje har gått glipp av" — artikler med høy ekstern engasjement fra kilder han ikke følger
3. La AI-syntesen eksplisitt flagge: "Dette kan overraske deg" — én artikkel som bryter mønsteret

Forskning (2025, Arxiv) viser at "AI-initiated exploration" gir høyere serendipity-ratings og lavere friksjon enn bruker-initiert utforskning. La altså AI foreslå det uventede, ikke la Joakim måtte lete selv.

### Etikk og personvern i en n=1-app

Fordi Linspo kun har én bruker (Joakim selv), er personvern-implikasjonene minimale sammenlignet med konsumer-apper. Likevel:

**Data som lagres**: Les-historikk, klikk-mønstre, tid brukt på artikler. Alt dette er Joakims egne data om seg selv — svært lav etisk risiko.

**Transparens**: Best practice er å gjøre alle lagrede preferanser synlige og redigerbare. Vis Joakim direkte hva systemet "tror" han liker (tag-vekter, kilde-scores) — dette er god UX og god etikk.

**Fremtidig skalering**: Hvis Linspo noen gang skulle åpnes for flere brukere, krever det GDPR-compliance (EU-brukere): eksplisitt samtykke til adferdssporing, mulighet for data-export og sletting. Bygg inn datahygiene fra starten.

### Daglig digest vs. feed-modell

Forskning og praksis peker konsistent i én retning: **curated digest slår åpen feed for informasjonskvalitet**, men **feed vinner på impuls-lesing og hyppig retur**.

For en n=1-app som Linspo — der målet er informasjonskvalitet fremfor engasjement-maxing — er daglig digest riktig valg. Spesifikke anbefalinger:

- **7-10 elementer per dag** (ikke 50) — bruker Joakims kognitive kapasitet bedre
- **Todelt struktur**: 3-4 "viktigst å lese" (AI-klassifisert høy relevans + fersk) + 3-4 "verdt å vite" (lengre holdbarhet, evergreen)
- **Leveringstidspunkt**: Morgen (07:00-08:00) — passer til kaffe-ritual, høyere åpnerate
- **Unngå doom-scroll**: Sett en hard grense på antall elementer. Ingen uendelig scroll. Brukeren vet at når de har lest de 10 elementene, er de ferdig for dagen.

**Doom-scroll-prevensjon**: Matter og Readwise bruker "reading goals" (antall minutter, ikke antall artikler) for å gi lesing en naturlig avslutning. Linspo kan gjøre noe lignende: "Du har lest 3 av 8 elementer i dag" med en visuell progresjonslinje.

### GitHub Actions som kjøremiljø

Linspos eksisterende pipeline bruker GitHub Actions, og dette er et godt valg for $0-budget. Noen relevante observasjoner for videre utvikling:

- **Gratis tier**: 2000 minutter/mnd for private repos, 50 000 for public
- **Scheduling**: `cron: '0 5 * * *'` (05:00 UTC = 07:00 CET) for daglig kjøring
- **Secrets management**: Supabase URL/nøkler, Gemini API-nøkkel kan lagres som GitHub Secrets gratis
- **Rate limiting**: Med Gemini Flash (250 RPD etter normalisering) og Flash-Lite (1000 RPD) er GitHub Actions cron den rette triggeren — ikke event-drevet, men tidsbasert batch

---

## Konkrete neste steg for Linspo (prioritert)

### Umiddelbart (denne uken)

1. **Legg til Lobste.rs ai+design RSS** (`lobste.rs/t/ai,design.rss`) — 5 minutters arbeid, høyest signal/arbeid-ratio av alle anbefalingene
2. **Legg til TLDR Tech, TLDR AI, TLDR Design** — tre svært relevante feeds, alle verifisert fungerende
3. **Legg til Anthropic News** via OpenRSS (`openrss.org/feed/www.anthropic.com/news`)
4. **Legg til Time Extension** (`timeextension.com/feeds/news`) for handheld gaming

### Kort sikt (2-4 uker)

5. **Bytt AI-strategi fra per-artikkel-summary til batch-klassifisering** — endre pipeline til å sende 8 artikler per Gemini-kall med instruksjon om kategori + relevans-score. Spar tokens, få mer verdi.
6. **Utforsk Gemini 2.5 Flash-Lite** (1000 RPD gratis) — test om klassifiseringskvaliteten er akseptabel. Hvis ja, fjernes RPD-begrensningen praktisk talt.
7. **Implementer enkel logging av klikk og lesetid** i Supabase — bygg datagrunnlag for fremtidig personalisering. Ikke komplisert, veldig verdifullt.

### Middels sikt (4-8 uker)

8. **Ukentlig syntese** — én Gemini-kall per søndag som analyserer ukens høyest-engasjerte artikler og genererer "ukens trender"-oppsummering
9. **Kilde-vektingstabell i Supabase** — automatisk re-kalkulert ukentlig basert på klikk/save-historikk
10. **Digest-modus** — vis 7-10 elementer per dag fremfor full feed, med morgenleveringstidspunkt

### Lengre sikt (3+ måneder)

11. **Mastodon-integrasjon** — legg til `mastodon.social/tags/uxdesign.rss` og `mastodon.social/tags/steamdeck.rss`
12. **Bluesky-profil-feeds** — identifiser 5-10 nøkkel-profiler (UX-ledere, Anthropic-ansatte) og abonner via OpenRSS
13. **Serendipitet-funksjon** — én daglig wildcard-artikkel fra en ukjent kilde

---

*Rapport utarbeidet med aktiv bruk av WebSearch og WebFetch for å verifisere faktaopplysninger. Alle RSS-URL-er er kryssjekket mot primærkilder der mulig. Gemini RPD-tall basert på verifisert desember 2025-nedskjæring.*
