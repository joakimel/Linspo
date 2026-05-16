# ADR-005: Lest-status og feedback-system

**Dato:** 2026-05-16
**Status:** Godkjent

## Kontekst

Etter at SOLO-MVP var deployet trengte vi en måte for Joakim å samhandle med feeden — markere artikler som lest, gi feedback til AI-en, og se historikk. Han ba spesifikt om:
- "Marker som lest" som fjerner artikler fra feeden
- 3-veis reaksjoner (👍/😐/👎) med valgfri tekst-kommentar
- En arkiv-/progress-side
- Diskusjon: skal AI tilpasse seg feedbacken med en gang?

## Beslutning

### 1. 3-veis reaksjoner i stedet for binær (👍/👎)

Reaksjons-typer: `'positive' | 'neutral' | 'negative'`. Den nøytrale (😐) gir et mellomtrinn for innhold som verken er bra eller dårlig — viktig for kalibrering av AI-en senere.

### 2. Marker som lest skjuler, ikke sletter

`articles.read_at` (TIMESTAMPTZ, nullable) settes til `NOW()` når brukeren markerer lest. Forsiden filtrerer `read_at IS NULL`. Artikkel forsvinner fra feed, men beholdes i DB med all metadata + feedback intakt. Tilgjengelig på `/arkiv`.

### 3. Én feedback per artikkel (UNIQUE-constraint)

`article_feedback.article_id` har `UNIQUE`-constraint. Hvis bruker gir 👍, deretter 👎, oppdateres samme rad (via UPSERT med `onConflict: "article_id"`). Trigger `touch_updated_at` holder `updated_at` ferskt.

PostgREST-konsekvens: 1-til-1-relasjonen gjør at `select=*,feedback:article_feedback(*)` returnerer feedback som **enkelt objekt**, ikke array. Vi har en `getFeedback()`-helper i `lib/types.ts` som normaliserer begge formater.

### 4. Ingen AI-tilpasning til feedback — ennå

Diskusjon under bygging: skal Gemini bruke feedback-historikk når den scorer nye artikler? Vi konkluderte: **vent**. Med 0 feedback ved start er all algoritme-design gjettverk. Bedre å samle 1-2 uker med data, så designe en informert vekting (kilde-vekting, tag-vekting, eller prompt-augmentering) basert på faktiske mønstre.

Inntil videre brukes feedback kun som registrert data — analyserbart via Supabase SQL Editor.

### 5. UI-arkitektur

**Server-side:**
- `app/page.tsx` (force-dynamic) joiner `articles` + `article_feedback`, filtrerer på `learning_value >= 4` og `read_at IS NULL`
- `app/arkiv/page.tsx` (force-dynamic) joiner samme, filtrerer på `read_at IS NOT NULL`. Bygger stats-objekt.

**Client-side:**
- `components/ArticleActions.tsx` — `"use client"` komponent med:
  - 3 reaksjons-knapper (highlightes når aktive)
  - Expandable textarea (vises etter første reaksjon klikket)
  - "Marker som lest"-knapp (kaller API, deretter `router.refresh()`)
  - Optimistic UI med `useTransition`
  - Tekst-noten lagres `onBlur` (når brukeren forlater feltet)

**API:**
- `POST /api/articles/[id]/read` + `DELETE` for angre
- `POST /api/articles/[id]/feedback` (upsert) + `DELETE` for angre
- Alle bruker admin-klient (`SUPABASE_SECRET_KEY`) for å bypasse RLS — ingen auth-sjekk i SOLO-MVP

### 6. Stats på arkiv-siden

Når brukere kommer (Fase 2): per-bruker stats. For SOLO-MVP: global stats:
- Lest totalt, denne uka
- Snitt læringsverdi blant lest
- Fordeling 👍/😐/👎
- Antall uten feedback

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| Auto-marker-lest etter X sekunder scroll | For aggressiv. Brukerkontroll er viktigere. |
| Numerisk justering av læringsverdi per kort | Mer UI-friksjon enn verdi. 3-veis reaksjon er enklere og gir bedre signaler å lære fra. |
| Bygg AI-tilpasning fra dag 1 | Prematur optimalisering uten data. |
| Multi-bruker feedback i schema fra dag 1 | YAGNI for SOLO-MVP. Auth kommer i Fase 2, da legger vi til user_id-kolonner. |
| Slett artikkel ved "marker som lest" | Vi mister historikk, feedback-analyse, og potensielle "se gamle artikler"-funksjoner. |
| Tekst-input synlig fra start på hvert kort | For mye visuell støy. Aktiveres ved klikk på reaksjon. |
| Save-knapp på textarea | onBlur er enklere UX. Brukerens fokus-flyt indikerer ferdig-skrevet. |

## Konsekvenser

**Positivt:**
- Brukeren har kontroll over feeden sin
- Feedback-data samles og er klar for analyse
- Arkiv-siden gir oversikt og bygger motivasjon (synlig fremgang)
- Schema er enkel å utvide med per-bruker når auth kommer

**Negativt / kompromisser:**
- Ingen autentisering — hvem som helst med endpoint-URL kan markere/feedback. Akseptabelt for SOLO-MVP-trafikk, må fikses før Fase 2.
- Ingen AI-tilpasning til feedback ennå — brukeren ser ingen direkte effekt av sine tilbakemeldinger i feeden
- `router.refresh()` etter "marker som lest" gir liten lag-følelse (sub-sekund)

**Avhengigheter framover:**
- Fase 2 må legge til auth + user_id på alle relevante tabeller
- Ved 1-2 ukers data: bygg vekting basert på feedback-mønstre (sannsynligvis kilde- eller tag-baserte filtre)
- Vurder å vise "Du har gitt feedback på N artikler" eller lignende motivasjons-elementer

## Empirisk validering (2026-05-16)

- Migration 0002 kjørt i Supabase OK
- Reaction `positive` lagret med note "test" på artikkel "Architecture of Local-First..." → vises korrekt på `/arkiv` etter PostgREST-feed-objekt-bugfix
- Mark-as-read fjerner artikkel fra feed-spørringen umiddelbart
- Stats teller riktig etter fiks
