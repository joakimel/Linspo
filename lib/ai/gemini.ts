import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AISummary } from "@/lib/types";

const PROMPT_TEMPLATE = `Du er en faglig kurator som vurderer artikler for en UX-designer og produktutvikler som er interessert i AI, design systems, gaming og teknologi.

Artikkel:
Tittel: {title}
Innhold (kan være tomt, basér deg da på tittelen alene):
{content}

Returner KUN gyldig JSON med disse feltene, ingen ekstra tekst eller markdown:
{
  "summary": "2-3 setninger på norsk som oppsummerer hovedinnholdet. Vær konkret, ikke generisk.",
  "learning_value": <heltall 1-10, der 10 = stor faglig læringsverdi, 1 = ren underholdning/clickbait>,
  "tags": ["maks 5 korte tags, små bokstaver, engelske, beskriver emnet"],
  "difficulty": "beginner" eller "intermediate" eller "advanced",
  "reading_time": <heltall, estimert minutter å lese>,
  "key_takeaway": "1 setning på norsk med viktigste poeng for leseren"
}`;

export async function summarizeArticle(input: {
  title: string;
  content: string;
}): Promise<AISummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY mangler");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const prompt = PROMPT_TEMPLATE
    .replace("{title}", input.title)
    .replace("{content}", input.content || "(ikke tilgjengelig)");

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as AISummary;
  } catch {
    throw new Error(`Klarte ikke å parse Gemini-respons som JSON: ${text.slice(0, 200)}`);
  }
}
