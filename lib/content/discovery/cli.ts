/**
 * cli.ts — Kommandolinje-grensesnitt for kilde-oppdagelses-systemet.
 *
 * Bruk:
 *   npx tsx lib/content/discovery/cli.ts "emne"
 *   npx tsx lib/content/discovery/cli.ts "UX design" --skip mastodon,reddit
 *   npx tsx lib/content/discovery/cli.ts "sykepleie" --no-verify
 *   npx tsx lib/content/discovery/cli.ts "steam deck" --max 20
 *
 * Miljøvariabler:
 *   GEMINI_API_KEY  — Kreves for llm-suggest-strategien
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Last .env.local fra prosjektrot
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../");
config({ path: path.join(projectRoot, ".env.local") });

import { discoverSources } from "./index.js";
import type { DiscoveryMethod } from "./types.js";

// --- Argument-parsing ---

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
Linspo kilde-oppdagelse CLI
============================
Bruk: npx tsx lib/content/discovery/cli.ts <emne> [flagg]

Flagg:
  --skip <metoder>    Kommaseparert liste over strategier å hoppe over
                      (wikipedia, llm-suggest, mastodon, reddit, awesome-lists,
                       hn-algolia)
  --no-verify         Hopp over RSS-verifisering (raskere, men mindre nøyaktig)
  --max <n>           Maks antall resultater (standard: 30)
  --json              Skriv ut JSON i stedet for tabell

Eksempel:
  npx tsx lib/content/discovery/cli.ts "UX design"
  npx tsx lib/content/discovery/cli.ts "sykepleie" --skip mastodon
  npx tsx lib/content/discovery/cli.ts "steam deck" --no-verify --max 10
`);
  process.exit(0);
}

// Finn emnet (første arg som ikke starter med --)
const topicArgs: string[] = [];
let skipStrategies: DiscoveryMethod[] = [];
let verifyRss = true;
let maxResults = 30;
let outputJson = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--skip" && args[i + 1]) {
    skipStrategies = args[i + 1].split(",").map((s) => s.trim()) as DiscoveryMethod[];
    i++;
  } else if (arg === "--no-verify") {
    verifyRss = false;
  } else if (arg === "--max" && args[i + 1]) {
    maxResults = parseInt(args[i + 1], 10) || 30;
    i++;
  } else if (arg === "--json") {
    outputJson = true;
  } else if (!arg.startsWith("--")) {
    topicArgs.push(arg);
  }
}

const topic = topicArgs.join(" ");

if (!topic) {
  console.error("Feil: Mangler emne. Bruk: npx tsx cli.ts <emne>");
  process.exit(1);
}

// --- Kjøring ---

console.log(`\nLinspo kilde-oppdagelse`);
console.log(`Emne: "${topic}"`);
console.log(`Strategier: alle${skipStrategies.length > 0 ? ` (hopper over: ${skipStrategies.join(", ")})` : ""}`);
console.log(`RSS-verifisering: ${verifyRss ? "ja" : "nei"}`);
console.log("─".repeat(60));
console.log("Søker...\n");

const startTime = Date.now();

discoverSources(topic, {
  skipStrategies,
  verifyRss,
  maxResults,
  verifyTopN: verifyRss ? 20 : 0,
})
  .then((result) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`Fant ${result.sources.length} kandidater på ${elapsed}s\n`);

    // Vis strategistatus
    console.log("Strategi-status:");
    for (const method of result.strategiesUsed) {
      const error = result.strategiesErrored[method];
      const count = result.sources.filter((s) => s.method === method).length;
      const status = error ? `✗ feil: ${error.slice(0, 60)}` : `✓ ${count} resultat${count !== 1 ? "er" : ""}`;
      console.log(`  ${method.padEnd(20)} ${status}`);
    }

    console.log("\n" + "─".repeat(60));
    console.log("Topp kandidater:\n");

    if (result.sources.length === 0) {
      console.log("Ingen kandidater funnet.");
      return;
    }

    result.sources.forEach((source, idx) => {
      const rssStatus = source.rssUrl ? "✓ RSS" : "  ···";
      const confStr = `[${(source.confidence * 100).toFixed(0).padStart(3)}%]`;
      console.log(`${String(idx + 1).padStart(3)}. ${confStr} ${rssStatus}  ${source.title}`);
      console.log(`     URL:  ${source.url}`);
      if (source.rssUrl && source.rssUrl !== source.url) {
        console.log(`     RSS:  ${source.rssUrl}`);
      }
      console.log(`     Fra:  ${source.method}`);
      if (source.description) {
        console.log(`     Info: ${source.description.slice(0, 100)}`);
      }
      console.log();
    });

    // Oppsummering
    const withRss = result.sources.filter((s) => s.rssUrl !== null).length;
    console.log("─".repeat(60));
    console.log(`Total: ${result.sources.length} kandidater, ${withRss} med verifisert RSS`);
    console.log(`Tid: ${elapsed}s (intern: ${result.durationMs}ms)`);
  })
  .catch((err) => {
    console.error("Uventet feil:", err);
    process.exit(1);
  });
