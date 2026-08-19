import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NichtGefunden() {
  return (
    <main
      id="inhalt"
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center"
    >
      <Logo variante="bildmarke" className="h-24 w-24 opacity-60" alt="" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Da ist nichts.</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Diese Seite gibt es nicht – oder der Link ist nicht mehr gültig. Wenn du deine
        Reservierung suchst, lass sie dir einfach nochmal zuschicken.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <Link
          href="/"
          className="rounded-full bg-rot px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rot/85"
        >
          Zur Startseite
        </Link>
        <Link
          href="/link"
          className="glas-knopf rounded-full px-6 py-3 text-sm font-semibold text-white"
        >
          Reservierung zuschicken lassen
        </Link>
      </div>
    </main>
  );
}
