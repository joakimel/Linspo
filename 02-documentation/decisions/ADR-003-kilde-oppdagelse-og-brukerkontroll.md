# ADR-003: Kilde-oppdagelse, bruker-godkjenning og manuell kildelegging

**Dato:** 2026-05-16
**Status:** Godkjent

## Kontekst

Linspo må kunne håndtere vilkårlige brukerinteresser ("sykepleie", "gro kantareller hjemme", "kvantedatamaskiner") uten manuell hardkoding av RSS-kilder. En tidligere agent bygget et discovery-system med 8 strategier (`lib/content/discovery/`), og en testagent kjørte alle 10 emner. Funnene var:

- **`llm-suggest` (Gemini)** ga treff på alle 10 emner — eneste strategi som dekker norske nisjer
- **`reddit`, `mastodon`, `hn-algolia`, `awesome-lists`** funker godt for engelske/tekniske emner
- **`wikipedia`** er nyttig men langsom (110-140s på norske emner pga. fallback-kjede)
- **`search-engine` (DuckDuckGo-scraping)** returnerte 0/10 — DDG blokkerer headless-klienter
- **`substack-discover`** returnerte 0/10 — udokumentert API har sluttet å fungere

Joakim sa også at oppdagede kilder må **godkjennes manuelt** før de aktiveres, og at brukeren skal kunne **legge til kilder selv** — men **ikke kilder bak betalingsmur**.

## Beslutning

### 1. Fjernet to dødvekt-strategier

- `lib/content/discovery/strategies/search-engine.ts` — slettet (0/10 i test)
- `lib/content/discovery/strategies/substack-discover.ts` — slettet (0/10 i test)

Discovery-systemet kjører nå seks aktive strategier: `wikipedia`, `llm-suggest`, `mastodon`, `reddit`, `awesome-lists`, `hn-algolia`.

`DiscoveryMethod`-typen har fått en ny verdi `"manual"` for å spore at en kilde ble lagt til av brukeren selv (ikke kjørbar som strategi, men brukt i database).

### 2. Bruker-godkjenning er obligatorisk

Discovery-resultater går aldri direkte i feed. De legges i en **pending-kø** og brukeren godkjenner eller avviser hver kandidat. Selv kilder med høy konfidens (verifisert RSS, høy ranking) krever eksplisitt godkjenning i denne fasen.

**Begrunnelse:**
- LLM-suggest er kritisk for dekning, men kan hallusinere — verifisering fanger noen feil, men ikke alle
- I tidlig fase verdsetter vi kvalitet over UX-friksjon
- Brukeren bygger mental modell av hva systemet finner og hvorfor

### 3. Manuell kildelegging

Brukeren kan legge til kilder via en input-form i UI:
1. Brukeren limer inn URL (eller direkte RSS-URL)
2. Systemet kjører `verify.ts` for å bekrefte gyldig RSS
3. Auto-utfylling av tittel/beskrivelse fra feed-metadata
4. **Paywall-sjekk** kjøres (se under)
5. Hvis OK: legges til som `discovery_method: "manual"` med status `approved`

### 4. Paywall-deteksjon

Manuelt lagte kilder må filtreres mot betalingsmurer. Implementeres som flerlags sjekk:

| Sjekk | Hva |
|---|---|
| HTTP-status | `402 Payment Required` → avvis |
| RSS content-lengde | Hvis ≥80 % av siste 20 items har `<description>` < 50 tegn → trolig teaser-only (paywall) |
| Kjente paywall-domener | Hardkodet liste: nytimes.com, wsj.com, ft.com, theinformation.com osv. |
| Substack | `*.substack.com/feed` — sjekk om innholdet er teaser eller fullt |
| Medium | Membership-only artikler markert med `<medium:isLockedContent>true` |

Hvis sjekkene returnerer "trolig paywall", vises advarsel til bruker. Brukeren kan overstyre om de mener systemet tar feil, men det krever eksplisitt klikk.

### 5. Schema (implementeres i Fase 2)

```sql
CREATE TABLE user_topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  topic           TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

CREATE TABLE user_topic_sources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_topic_id     UUID REFERENCES user_topics(id) ON DELETE CASCADE,
  source_url        TEXT NOT NULL,
  rss_url           TEXT,
  title             TEXT,
  description       TEXT,
  discovery_method  TEXT NOT NULL,       -- 'wikipedia' | 'llm-suggest' | ... | 'manual'
  confidence        DECIMAL(3,2),        -- 0.00 til 1.00
  llm_rationale     TEXT,                -- hvis discovery_method = 'llm-suggest'
  status            TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  is_paywalled      BOOLEAN DEFAULT FALSE,
  discovered_at     TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  UNIQUE(user_topic_id, source_url)
);

ALTER TABLE user_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only own topics"
  ON user_topics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users see only own topic sources"
  ON user_topic_sources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_topics
    WHERE id = user_topic_sources.user_topic_id
    AND user_id = auth.uid()
  ));
```

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| Erstatte DDG med Brave Search API (gratis 2 000/mnd) | Verdt å vurdere senere, men ikke nødvendig for MVP. LLM-suggest dekker rollen. Krever ny API-nøkkel og kompleksitet. Utsatt. |
| Auto-akseptere kilder med konfidens > 0.7 | Slipper gjennom hallusinerte URL-er som tilfeldigvis svarer på HTTP. Risikerer falske positiver. |
| 100 % manuell kildelegging | Mister verdien av discovery for nisje-emner. For mye arbeid for brukeren. |
| Tillate paywalled kilder hvis bruker eksplisitt godkjenner | Mulig senere, men ikke i MVP — risikerer at feeden domineres av teaser-only items. |
| Smart paywall-deteksjon med ML | Overkill for MVP. Heuristikker holder. |
| Vente med å fjerne søke- og Substack-strategiene | Dødvekt-kode gir falskt inntrykk av redundans. Bedre å fjerne og ev. legge til Brave Search bevisst senere. |

## Konsekvenser

**Positivt:**
- Renere kodebase (2 færre filer å vedlikeholde)
- Bedre brukerkontroll over hva som er i feeden
- Manuell kildelegging gir brukeren agentskap
- Paywall-deteksjon beskytter brukerverdi (teaser-feed er verdiløs)

**Negativt / kompromisser:**
- Mer UI-arbeid (pending-kø, godkjennings-flyt, manuell legg-til-form)
- Bruker-friksjon ved emne-oppsett (men engangs per emne)
- Paywall-deteksjon er heuristisk og vil ha feil i begge retninger

**Avhengigheter framover:**
- Schema må implementeres i Fase 2 (når auth kommer)
- UI for pending-kø må designes
- Paywall-detector skal være eget modul: `lib/content/discovery/paywall.ts`
- Hvis LLM-suggest er feilkilden: vurder Brave Search API eller Anthropic Claude som backup
