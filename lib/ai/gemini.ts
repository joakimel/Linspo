import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AISummary } from "@/lib/types";

const PROMPT_TEMPLATE = `Du er en faglig kurator for en UX-designer / produktutvikler som er interessert i:
- UX-metodikk, design systems, brukerinnsikt og trender
- AI-verktøy for utvikling (særlig Claude Code) og nyheter fra Anthropic
- Gaming-nyheter og spillkultur
- Håndholdte spillkonsoller og gaming-PCer (MSI Claw 8AI, Steam Deck, ROG Ally og lignende)

Artikkel:
Tittel: {title}
URL: {url}
Innhold (utdrag fra siden eller feed-beskrivelsen):
"""
{content}
"""

KRITISKE REGLER:
1. Sammendraget MÅ baseres utelukkende på innholdet over. IKKE bruk forhåndskunnskap eller anta hva forkortelser betyr (eks: "DS4" kan være DualShock 4, DwarfStar 4, eller noe helt annet — IKKE GJETT).
2. Hvis innholdet er tomt, irrelevant til tittelen, eller for kort til å oppsummere meningsfullt:
   - Sett "summary" til "Innholdet kunne ikke verifiseres mot tittelen."
   - Sett "learning_value" til 0
   - Sett "key_takeaway" til "Mangler innhold for analyse."
3. Skriv summary og key_takeaway på NORSK.
4. Tags skal være engelske, små bokstaver, korte (1-2 ord per tag).

Returner KUN gyldig JSON, ingen markdown eller ekstra tekst:
{
  "summary": "2-3 setninger som faktisk beskriver innholdet",
  "learning_value": <heltall 0-10, der 0 = ikke kunne verifiseres / irrelevant>,
  "tags": ["maks 5 tags"],
  "difficulty": "beginner" eller "intermediate" eller "advanced",
  "reading_time": <heltall, estimert minutter>,
  "key_takeaway": "1 setning med viktigste poeng for leseren"
}`;

export async function summarizeArticle(input: {
  title: string;
  url: string;
  content: string;
}): Promise<AISummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY mangler");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    // gemini-2.5-flash-lite: 15 RPM, 1000 RPD free tier (vs flash: 5 RPM, 20 RPD).
    // Litt lavere kvalitet, men nok for MVP-testing. Kan byttes tilbake til "gemini-2.5-flash" når kvoten reset.
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = PROMPT_TEMPLATE
    .replace("{title}", input.title)
    .replace("{url}", input.url)
    .replace("{content}", input.content);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as AISummary;
  } catch {
    throw new Error(`Klarte ikke å parse Gemini-respons som JSON: ${text.slice(0, 200)}`);
  }
}
