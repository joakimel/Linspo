/**
 * run-cron.ts — Selvstendig Node-script for daglig content fetch.
 *
 * Kjøres av GitHub Actions hver morgen (se .github/workflows/daily-fetch.yml).
 * Kan også kjøres lokalt: `npx tsx scripts/run-cron.ts`
 *
 * Forventer at miljøvariablene NEXT_PUBLIC_SUPABASE_URL,
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY og GEMINI_API_KEY
 * er satt — enten via .env.local (lokalt) eller som GitHub Secrets (CI).
 */

import * as path from "node:path";
import * as dotenv from "dotenv";

// Laste .env.local hvis tilgjengelig (lokalt). På CI ignoreres dette og
// env-variablene kommer direkte fra GitHub Secrets.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

import { runFetchPipeline } from "@/lib/content/fetch-pipeline";

async function main() {
  const startedAt = Date.now();
  console.log(`[cron] Starter fetch-pipeline ${new Date().toISOString()}`);

  // I produksjon kjører vi med høyere maxToProcess siden vi har Node-runner
  // uten 30s-timeout som Cloudflare Workers har.
  const result = await runFetchPipeline({ maxToProcess: 20 });

  const elapsedMs = Date.now() - startedAt;
  console.log(`[cron] Ferdig på ${(elapsedMs / 1000).toFixed(1)}s`);
  console.log(JSON.stringify(result, null, 2));

  // Exit code 1 hvis vi prøvde å prosessere men 0 lyktes (sannsynlig systemfeil)
  if (result.processed > 0 && result.inserted === 0) {
    console.error("[cron] FEIL: prøvde å prosessere men ingen ble lagt til DB");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[cron] Uventet feil:", err);
  process.exit(2);
});
