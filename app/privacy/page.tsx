import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personvern — Linspo",
  description: "Personvernerklæring for Linspo.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Personvernerklæring</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Sist oppdatert: 16. mai 2026
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Om Linspo</h2>
          <p>
            Linspo er en personlig kurator-app som henter faglig innhold fra
            tredjepartskilder, kjører AI-sammendrag, og presenterer det som en daglig
            feed. Per mai 2026 er Linspo i lukket utvikling med kun én bruker
            (utvikleren selv, Joakim Eldén).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Hvilke data samles inn</h2>
          <p className="mb-2">
            Linspo samler inn følgende fra offentlige kilder:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Artikkel-metadata (tittel, URL, publiseringsdato, forfatter) fra HackerNews og RSS-feeder (Smashing Magazine, Nielsen Norman Group, The Verge, m.fl.)</li>
            <li>AI-genererte sammendrag av disse artiklene, produsert via Google Gemini API</li>
          </ul>
          <p className="mt-4">
            <strong>Linspo samler IKKE inn personopplysninger om besøkende:</strong> ingen kontoer, ingen tracking, ingen cookies, ingen analytics.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Tredjeparter</h2>
          <p className="mb-2">
            Linspo bruker følgende tjenester for å fungere:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong>Supabase</strong> (Frankfurt, EU): lagrer artikkel-metadata. Databehandleravtale finnes via Supabase.</li>
            <li><strong>Google Gemini API</strong>: brukes til å generere sammendrag. Sender artikkel-tittel og innholdsutdrag til Google.</li>
            <li><strong>Cloudflare Pages</strong>: hosting. Cloudflare ser standard request-logger (IP, user-agent) som de behandler etter sin egen personvernerklæring.</li>
            <li><strong>UptimeRobot</strong>: pinger nettstedet hvert 5. minutt for å holde Supabase aktiv.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Brukerrettigheter (når brukere kommer)</h2>
          <p>
            Når Linspo åpner for flere brukere vil følgende rettigheter være på plass:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Innsyn i hvilke data som er lagret om deg</li>
            <li>Sletting av konto og all tilhørende data (cascade-slett)</li>
            <li>Eksport av data i maskinleselig format</li>
            <li>Trekke samtykke til AI-prosessering</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Kontakt</h2>
          <p>
            Spørsmål om personvern kan rettes til{" "}
            <a
              href="mailto:joakim.m.elden@gmail.com"
              className="text-indigo-600 underline dark:text-indigo-400"
            >
              joakim.m.elden@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
