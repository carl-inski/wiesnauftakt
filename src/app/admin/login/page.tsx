import { redirect } from "next/navigation";
import { Anmeldeformular } from "@/components/Anmeldeformular";
import { Logo } from "@/components/Logo";
import { adminKonfiguriert, angemeldet } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function Anmeldeseite() {
  if (await angemeldet()) redirect("/admin");

  return (
    <main
      id="inhalt"
      className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12"
    >
      <div className="text-center">
        <Logo variante="bildmarke" className="mx-auto h-16 w-16 opacity-80" alt="" />
        <h1 className="mt-4 text-2xl font-bold">Orgabereich</h1>
        <p className="mt-1.5 text-sm text-white/50">Wiesnauftakt 2026</p>
      </div>

      <div className="glas mt-8 p-5">
        {adminKonfiguriert() ? (
          <Anmeldeformular />
        ) : (
          <p className="text-sm leading-relaxed text-white/70">
            Auf dem Server fehlt <code className="text-gelb">ADMIN_PASSWORT</code>. Ohne
            das kommt hier niemand rein – auch niemand Fremdes.
          </p>
        )}
      </div>
    </main>
  );
}
