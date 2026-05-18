# ADR-007: Innholds-pipeline-arkitektur for multi-bruker med mangfoldige interesser

**Dato:** 2026-05-18
**Status:** Under vurdering (relevant fra Fase 2)

## Kontekst

I SOLO-MVP henter pipeline et fast sett med artikler fra hardkodede kilder daglig. Dette fungerer for én bruker med kjente interesser. Når Linspo åpnes for flere brukere oppstår disse spørsmålene:

1. **Personalisering:** Brukere skal få artikler basert på egne interesser og emner
2. **Mangfold:** Interesser kan spenne fra UX-design og AI til handheld gaming, afrikanske biller eller bysantinsk myntteknikk — hyper-spesifikke nisjeemner er et kjerneprinsipp, ikke et edge-case
3. **Skalerbarhet:** En naiv løsning (fetch alt mulig, eller fetch per bruker) er enten umulig eller ekstremt kostbar
4. **Timing:** Brukere er i ulike tidssoner og forventer ferske artikler

## Kjerneprinsipp (viktig premiss)

Linspo er designet for at brukere skal kunne utforske og lære om hyper-spesifikke emner. Dette er ikke en generell nyhetsapp — det er en personlig kurator. En bruker som legger til "bysantinske mynter fra 900-tallet" skal faktisk få relevante artikler om det. Systemet må støtte den lange halen av nisjeinteresser.

## Beslutning

### 1. Emne-drevet fetch, ikke per-bruker og ikke globalt

**Arkitektur:**
- Systemet holder en liste over *aktive emner* — unionen av alle brukeres interesser
- Artikler hentes og prosesseres **per unikt emne**, ikke per bruker
- Hvis 500 brukere er interessert i "gaming", hentes gaming-artikler én gang
- Hvis 1 bruker er interessert i "afrikanske biller", hentes det én gang — ikke 1 gang per bruker
- AI-sammendrag (Gemini) genereres per unik artikkel, uavhengig av antall brukere
- Ved visning scores og filtreres artiklene mot den enkelte brukerens interesseprofil

**Skalering:**
- Lagring vokser med antall *unike artikler på tvers av aktive emner*, ikke brukere × artikler
- Gemini-kall vokser med antall unike artikler, ikke brukere
- Nye brukere som velger eksisterende emner koster nesten ingenting ekstra

### 2. Discovery-systemet er fundamentet for nisjeemner

Hyper-spesifikke emner kan ikke pre-fetches fra hardkodede kilder — man vet ikke hvilke kilder som finnes. Når en bruker legger til et nytt nisjeemne, kjøres discovery-pipeline (`lib/content/discovery/`) for å finne relevante kilder:

```
Bruker legger til "bysantinske mynter"
  → Discovery finner relevante kilder (Wikipedia, LLM-forslag, Reddit, RSS-blogs)
  → Lagres som topic_sources i DB (knyttet til emnet)
  → Fetch-pipeline henter artikler fra disse kildene
  → Gemini scorer relevans mot emnet og genererer sammendrag
  → Artiklene tagges med emnet og deles med alle abonnenter
```

Discovery kjøres én gang per nytt emne (eller periodisk re-discovery for å finne nye kilder). Dette er grunnen til at discovery-systemet ble bygget som Fase 2-fundament i ADR-003.

### 3. Tidssone-problemet løses ikke i fetch, men i visning

Det er ingen naturlig "riktig tidspunkt" å fetche for globale brukere. Løsningen:
- Fetch kjører tidlig nok til at alle tidssoner har ferske artikler innen de våkner (f.eks. 03:00–04:00 UTC)
- "Dagens artikler" bestemmes av brukerens lokale dato, ikke av når fetchen kjørte
- Brukere ser de nyeste tilgjengelige artiklene for sine emner — ikke nødvendigvis fra "i dag" spesifikt

### 4. Kontrollmekanismer for å begrense vekst

For å unngå ukontrollert vekst i lagring og prosessering:
- Maks N artikler per emne per dag (konfigurerbart)
- Emner med færre enn X abonnenter nedprioriteres i fetch-frekvens (f.eks. ukentlig i stedet for daglig)
- Artikler slettes/arkiveres automatisk etter 30 dager (konfigurerbart per plan/tier)
- Paywall-deteksjon (`lib/content/discovery/paywall.ts`) filtrerer bort utilgjengelig innhold

### 5. Hva lagres per artikkel vs. per bruker

| Data | Lagres | Deles |
|---|---|---|
| Artikkel-innhold + URL | Per unik artikkel | Alle brukere med emnet |
| AI-sammendrag | Per unik artikkel | Alle brukere med emnet |
| Relevans-score | Per artikkel × emne | Alle abonnenter av emnet |
| Lest-status | Per bruker × artikkel | Privat |
| Reaksjon / feedback | Per bruker × artikkel | Privat (aggregert anonymt for AI-vekting) |

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| Global fetch av alt mulig innhold | Umulig i praksis — man kan ikke pre-fetche "alt" fra alle mulige nisjer |
| Fetch per bruker | Gemini-kall og lagring vokser med brukere × artikler. 1000 brukere × 20 artikler = 20 000 Gemini-kall/dag. Sprenger free tier umiddelbart. |
| On-demand fetch ved sideopplasting | Første besøk per dag er tregt. Dårlig UX. |
| Én global cron for alle emner parallelt | Riktig tilnærming, men krever kø-system (Fase 3). I Fase 2 kjøres sekvensielt per emne. |

## Konsekvenser

**Positivt:**
- Støtter hyper-spesifikke nisjeemner uten å sprenge kostnadsrammer
- AI-kostnader skalerer med innhold, ikke brukere
- Discovery-systemet (allerede bygget) aktiveres naturlig
- Nye brukere med eksisterende emner er nær gratis

**Negativt / kompromisser:**
- Fetch-jobb tar lenger tid jo flere unike aktive emner som finnes
- Nisjeemner med få abonnenter vil ha lavere fetch-frekvens — brukeren kan oppleve at det ikke kommer noe nytt på dager
- Krever at brukerprofil lagrer interesser/emner på en måte som kan aggregeres (schema-design for Fase 2)

## Avhengigheter og neste steg

1. **Fase 2 (auth + onboarding):** Lagre brukerens emner i `user_topics`-tabell. Bruker velger emner ved onboarding.
2. **Fetch-pipeline:** Utvid `fetch-pipeline.ts` til å iterere over aktive emner, ikke hardkodede kilder.
3. **Discovery-integrasjon:** Koble `lib/content/discovery/` til topic-onboarding — kjør discovery automatisk når nytt emne legges til.
4. **Relevans-scoring:** Gemini-prompten augmenteres med emnet (ikke bare generell læringsverdi) for å gi relevante sammendrag.
5. **ADR-008 (fremtidig):** Kø-arkitektur for parallell fetch av mange emner (Fase 3).
