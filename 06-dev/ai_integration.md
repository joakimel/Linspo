# AI-integrasjon og innholdsstrategi for Linspo

## Oversikt over gratis AI-APIer (2026)

### Google Gemini API (Anbefalt primærvalg)

**Gemini 2.5 Flash – Free tier:**
- 15 RPM (requests per minute)
- 1 500 RPD (requests per day)
- 1 000 000 TPM (tokens per minute)
- 1 000 000 token kontekstvindu (unikt for Gemini)
- Gratis: Ja, men Google forbeholder seg retten til å trene på gratis-tier data

**Gemini 2.5 Pro – Free tier:**
- 5 RPM
- 100 RPD
- For avanserte oppgaver der kvalitet er kritisk

**Advarsel:** Google kuttet gratis-tier kvoter med 50–80% i desember 2025. Flash er fortsatt det beste gratis valget for innholdssammendrag.

**Betalt tier (når man vokser):**
- Flash: $0,15 per 1M input-tokens / $0,60 per 1M output-tokens
- Pro: $1,25 per 1M input-tokens / $10,00 per 1M output-tokens

---

### Groq (Anbefalt for lav latens)

**Free tier:**
- Llama 3.3 70B: ca. 30 RPM
- 300+ tokens/sekund – raskeste gratis inference tilgjengelig
- Kjører på egenutviklet LPU-hardware

**Bruksområde for Linspo:** Rask tagging og kategorisering av artikler der svartid er viktig. Ikke for batch-prosessering.

---

### Mistral AI – Experiment Plan

**Free tier:**
- Ca. 1 milliard tokens/måned (tilsvarer ~750 000 sider tekst)
- Modeller: Mistral Small, Mistral Medium
- **Viktig forbehold:** Gratis-tier requests kan brukes til å trene Mistral sine modeller
- **Viktigst:** Experiment-planen er prototype-only per brukervilkår – ikke for produksjon

---

### Cohere – Trial Key

**Free tier:**
- 1 000 API-kall per måned totalt på tvers av alle endepunkter
- Tilgang til Command R+, Rerank 3.5, Embed 4
- **Begrensning:** Non-commercial only
- **Bruksområde:** Embedding for semantisk søk og re-ranking av innhold

---

### OpenRouter (Fallback/aggregator)

- Gratis tilgang til mange modeller (Llama, Mistral, Gemma osv.)
- Fungerer som gateway der man kan bytte modell uten kodeendringer
- Noen modeller er gratis med daglige kvoter

---

## Anbefalt AI-stack for Linspo (gratis-fase)

```
Primær sammenfatning:    Gemini 2.5 Flash (1 500 req/dag)
Rask kategorisering:     Groq Llama 3.3 70B (30 RPM)
Embedding/søk:           Cohere Embed 4 (1 000 req/mnd)
Fallback:                OpenRouter (gratis modeller)
```

**Viktig realitetsssjekk:**
Med 1 500 req/dag på Gemini Flash og daglig kjøring kan Linspo behandle ca. 1 500 artikler per dag. Det er mer enn nok for starten. Når man nærmer seg grensen, bør man implementere caching aggressivt (se under).

---

## Innholdshenting – gratis og lovlige kilder

### Hacker News API (Algolia)
- **URL:** `https://hn.algolia.com/api/v1/`
- **Pris:** Gratis, ingen autentisering, ingen offisiell rate limit
- **Innhold:** Teknologi, startups, programmering, AI
- **Mengde:** Hundrevis av nye stories daglig
- Perfekt for Linspos teknologi/AI-emner

### The Guardian Open Platform API
- **Pris:** Gratis developer-key
- **Rate limit:** 12 kall/sekund, 5 000 kall/dag
- **Innhold:** 2,7 millioner artikler siden 1999, fulltekst tilgjengelig
- **Kategorier:** Teknologi, design, kultur, gaming
- Returnerer full artikkeltekst (ikke bare snippet som NewsAPI)

### DEV.to (Forem) API
- **Pris:** Gratis, med eller uten API-nøkkel
- **Rate limit:** 30 requests per 30 sekunder
- **Innhold:** Teknologi, webutvikling, UX, AI-verktøy
- **API-dok:** https://developers.forem.com/api/v0
- Utmerket for UX-design og webutviklingsinnhold

### NewsAPI.org
- **Pris:** Gratis developer-plan
- **Rate limit:** 100 requests/dag
- **Begrensning:** Artikler er 24 timer forsinket på gratis-tier
- **Innhold:** Brede nyhetskilder
- Bruk kun som supplement – begrensningene er strenge

### Reddit API
- **Pris:** Gratis opp til 100 requests/minutt per OAuth app
- **Innhold:** r/UXDesign, r/webdev, r/MachineLearning, r/gamedev
- **Advarsel:** Reddit strammet inn API-vilkår i 2023. Les vilkårene nøye. Ikke bruk til kommersiell aggregering uten tillatelse.

### RSS-feeds (anbefalt!)
Mange kvalitetskilder tilbyr RSS uten begrensninger:
- Smashing Magazine RSS
- CSS-Tricks RSS
- A List Apart RSS
- UX Collective (Medium) RSS
- Nielsen Norman Group RSS
- The Verge RSS (tech/gaming)

**RSS er den sikreste og mest stabile innholdskilden** – ingen rate limits, ingen autentisering, ingen vilkår å bryte.

---

## RSS + AI-pipeline: Slik gjøres det

### Konseptet
```
1. Hent RSS-feeds (5–20 feeds, daglig)
2. Filtrer artikler publisert siste 24 timer
3. Sjekk mot database: allerede prosessert?
4. Send artikkeltekst til AI for:
   a. Sammendrag (2–3 setninger)
   b. Relevansscoring (0–10) mot brukerens interesser
   c. Tagging (emneord)
   d. Vanskelighetsgrad (begynner/middels/avansert)
5. Lagre til database med metadata
6. Server til bruker sortert etter relevansscoring
```

### Kostnadsestimering for AI-kall

En gjennomsnittlig artikkel på 800 ord = ca. 1 000 tokens input.
Et godt sammendrag + scoring = ca. 200 tokens output.

Med Gemini 2.5 Flash betalt tier:
- 1 000 tokens input × $0,15/1M = **$0,00015 per artikkel**
- 50 artikler/dag × 30 dager = 1 500 artikler/mnd = **$0,225/mnd** (ekstremt billig)

Gratis-tieret dekker opp til 1 500 artikler/dag – mer enn nok for MVP.

---

## Caching-strategi for å minimere AI-kall

### Innholdsnivå
- Sjekk alltid om artikkelen (identifisert via URL eller hash av innhold) er prosessert tidligere
- Lagre AI-genererte sammendrag i databasen permanent
- Aldri generer samme sammendrag to ganger

### Brukernivå
- Personaliser score på servernivå basert på lagrede preferanser – ikke per AI-kall
- Ukentlig digest: Generer én gang for alle brukere som deler samme interesseprofil (clustering)
- Cache feed-respons i 6–12 timer per bruker

### Batch-prosessering
```
Unngå: Én AI-kall per bruker per forespørsel
Gjør:   Batch-prosesser alle nye artikler én gang daglig (cron job)
        Lagre resultater
        Server til alle brukere fra cache
```

### Når er det for dyrt å generere nytt innhold?

**Under 100 brukere:** Gratis-tieret er mer enn nok med smart caching.

**100–1 000 brukere:** Fremdeles gratis hvis artikler deles mellom brukere. Personalisert re-scoring er billig (ingen AI-kall, kun database-query mot brukerpreferanser).

**1 000–10 000 brukere:** Trenger betalt tier, men kostnadene er minimale ($1–5/mnd for selve AI-kallet). Databasen og hosting-kostnadene vil overstige AI-kostnadene.

**Over 10 000 brukere:** Vurder å bygge eget innholds-clustering-system slik at AI kun kalles for nye artikkler, ikke per bruker.

---

## Innholdskvalitet og spam-filtrering

### Enkle filtre (ingen AI nødvendig)
- Minste artikkellengde: 300 ord (filtrerer listicle-spam)
- Maksimal alder: 7 dager (for daglig feed)
- Domene-blocklist: kjente clickbait-domener
- Duplikatsjekk: URL-hash eller tittel-similaritet (Levenshtein-distanse)

### AI-basert filtrering
Be Gemini/Groq scori innhold på en skala 1–10 for:
- Faglig dybde (vs. overfladisk)
- Originalitet (vs. regurgitert innhold)
- Relevans til brukerens interesser

Gi kun innhold med score ≥ 6 til brukeren.

### Bruker-feedback-loop
- Brukere kan markere artikkel som: "Nyttig", "Irrelevant", "Clickbait"
- Lagre feedback til bruker-preferansemodell
- Juster scoring-prompt basert på aggregert feedback

---

## Prompt-eksempel for artikkelsammendrag

```
Du er en faglig kurator for en senior UX-designer med interesse for 
teknologi, AI og produktutvikling. 

Analyser denne artikkelen og svar med JSON:
{
  "summary": "2-3 setninger på norsk som fanger kjernebudskapet",
  "learning_value": 8, // 1-10, hvor 10 er høyest faglig verdi
  "tags": ["UX", "AI", "design systems"],
  "difficulty": "intermediate", // beginner/intermediate/advanced
  "reading_time_minutes": 5,
  "key_takeaway": "Én konkret ting man lærer av denne artikkelen"
}

Artikkeltittel: {title}
Artikkelinnhold: {content}
```

---

## Kildeliste
- [AwesomeAgents: Free AI Inference 2026](https://awesomeagents.ai/tools/free-ai-inference-providers-2026/)
- [TokenMix: Gemini API Free Tier 2026](https://tokenmix.ai/blog/gemini-api-free-tier-limits)
- [Hacker News Algolia API](https://hn.algolia.com/api)
- [The Guardian Open Platform](https://publicapis.io/the-guardian-api)
- [DEV.to Forem API](https://developers.forem.com/api/v0)
- [n8n: RSS + AI workflow](https://n8n.io/workflows/4503-automate-rss-content-with-ai-summarize-notify-and-archive/)
- [NewsData.io: Best Free News APIs 2026](https://newsdata.io/blog/best-free-news-api/)
