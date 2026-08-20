import type { Metadata } from "next";
import Link from "next/link";
import { LinkFormular } from "@/components/LinkFormular";
import { einstellungenLaden } from "@/lib/einstellungen";

export const metadata: Metadata = {
  title: "Reservierung nochmal zuschicken",
  description: "E-Mail eingeben, Link kommt nochmal.",
  robots: { index: false, follow: false },
};

export default async function LinkSeite() {
  const e = await einstellungenLaden();

  return (
    <main id="inhalt" className="mx-auto max-w-md px-4 pb-24 pt-8 sm:px-6 sm:pt-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        <span aria-hidden>←</span> Zur Startseite
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">Link weg?</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Kein Drama. Trag deine E-Mail-Adresse ein, dann schicken wir dir deine
        Reservierung nochmal zu.
      </p>

      <div className="glas mt-6 p-5">
        <LinkFormular />
      </div>

      <p className="mt-6 text-center text-sm leading-relaxed text-white/40">
        Kommt nichts an? Schau kurz im Spam-Ordner. Wenn es dann immer noch nichts ist,
        schreib uns an{" "}
        <a href={`mailto:${e.kontakt_email}`} className="text-gelb underline underline-offset-4">
          {e.kontakt_email}
        </a>
        .
      </p>
    </main>
  );
}
