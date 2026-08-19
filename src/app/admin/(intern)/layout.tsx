import Link from "next/link";
import { abmeldenAktion } from "@/app/admin/aktionen";
import { adminSchutz } from "@/lib/admin";

export const dynamic = "force-dynamic";

const NAVIGATION: [string, string][] = [
  ["/admin", "Übersicht"],
  ["/admin/anfragen", "Anfragen"],
  ["/admin/tische", "Tische"],
  ["/admin/gaeste", "Gästeliste"],
  ["/admin/einlass", "Einlass"],
  ["/admin/einstellungen", "Einstellungen"],
];

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  await adminSchutz();

  return (
    <div className="min-h-dvh">
      <header className="glas-leiste sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-2.5">
            <Link href="/admin" className="text-sm font-bold tracking-tight">
              Orgabereich
            </Link>
            <form action={abmeldenAktion}>
              <button className="rounded-full px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/8 hover:text-white">
                Abmelden
              </button>
            </form>
          </div>

          <nav className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <ul className="flex gap-1.5 whitespace-nowrap">
              {NAVIGATION.map(([pfad, name]) => (
                <li key={pfad}>
                  <Link
                    href={pfad}
                    className="glas-knopf inline-block rounded-full px-3.5 py-1.5 text-sm text-white/80"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="inhalt" className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
