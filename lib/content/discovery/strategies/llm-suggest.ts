/**
 * llm-suggest.ts — Bruk Gemini til å foreslå autoritative RSS-kilder for et emne.
 *
 * Strategi:
 * 1. Send prompt til Gemini med ønske om 5-10 autoritative kilder for emnet
 * 2. Parse JSON-svaret med URL, tittel, begrunnelse og forventet RSS-URL
 * 3. Returner som DiscoveredSource[] (RSS-URL settes til null — verify.ts sjekker)
 *
 * Modell: gemini-2.5-flash-lite (1000 RPD, gratis tier)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DiscoveredSource, StrategyResult } from "../types.js";

interface LlmSourceSuggestion {
  url: string;
  title: string;
  rationale: string;
  expected_rss?: string;
  language: string;
}

const SYSTEM_PROMPT = `Du er en ekspert på å finne autoritative nyhetskilder, blogger og RSS-feeder for faglige emner.

Oppgaven din: For et gitt emne, list opp 5-8 av de beste, mest autoritative nettstedene/bloggene/podcastene/nyhetsbrevene som dekker dette emnet. Prioriter:
1. Spesialiserte fagnettsteder og blogger (ikke Wikipedia, YouTube, Reddit)
2. Aktive kilder med regelmessig innhold (minst ukentlig)
3. Høy faglig kvalitet, lav støy
4. For norske emner: inkluder norskspråklige og skandinaviske kilder
5. Kilder som sannsynligvis har RSS-feed

Svar BARE med gyldig JSON-array. Ingen forklaringstekst. Format:
[
  {
    "url": "https://example.com",
    "title": "Kilde navn",
    "rationale": "Kort begrunnelse (1-2 setninger)",
    "expected_rss": "https://example.com/feed (hvis kjent, ellers null)",
    "language": "no/en/other"
  }
]`;

function getApiKey(): string {
  // I Next.js-miljø brukes process.env
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY mangler i miljøvariabler");
  return key;
}

function parseUrlSafe(url: string): string | null {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function discoverViaLlm(topic: string): Promise<StrategyResult> {
  const now = new Date().toISOString();

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return {
      method: "llm-suggest",
      sources: [],
      error: err instanceof Error ? err.message : "Feil ved henting av API-nøkkel",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Emne: "${topic}"\n\n${SYSTEM_PROMPT}`;

  let rawText = "";
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    rawText = result.response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      method: "llm-suggest",
      sources: [],
      error: `Gemini API-feil: ${msg}`,
    };
  }

  // Parse JSON fra svaret
  let suggestions: LlmSourceSuggestion[] = [];
  try {
    // Finn JSON-array i svaret (kan ha tekst rundt)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        method: "llm-suggest",
        sources: [],
        error: "Gemini returnerte ikke gyldig JSON-array",
      };
    }
    suggestions = JSON.parse(jsonMatch[0]) as LlmSourceSuggestion[];
  } catch (err) {
    return {
      method: "llm-suggest",
      sources: [],
      error: `JSON-parse-feil: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const sources: DiscoveredSource[] = [];

  for (const suggestion of suggestions) {
    const url = parseUrlSafe(suggestion.url);
    if (!url) continue;

    // Valider forventet RSS-URL
    let expectedRss: string | null = null;
    if (suggestion.expected_rss && suggestion.expected_rss !== "null") {
      expectedRss = parseUrlSafe(suggestion.expected_rss);
    }

    sources.push({
      url,
      rssUrl: expectedRss, // Vil bli (over)skrevet av verify.ts
      method: "llm-suggest",
      title: suggestion.title || url,
      description: suggestion.rationale,
      // Høy basis-konfidens fordi LLM aktivt velger relevante kilder
      confidence: 0.65,
      discoveredAt: now,
      llmRationale: suggestion.rationale,
    });
  }

  return { method: "llm-suggest", sources };
}
