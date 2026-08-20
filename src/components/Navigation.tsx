"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Reiter = { pfad: string; name: string; symbol: React.ReactNode };

const Saalplansymbol = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" />
    <rect x="6.5" y="6.5" width="4" height="5.5" rx="1.2" fill="currentColor" />
    <rect x="13.5" y="6.5" width="4" height="5.5" rx="1.2" stroke="currentColor" />
    <rect x="6.5" y="15" width="4" height="2.5" rx="1" stroke="currentColor" />
    <rect x="13.5" y="15" width="4" height="2.5" rx="1" stroke="currentColor" />
  </svg>
);

const Buchungssymbol = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
    <path
      d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"
      stroke="currentColor"
    />
    <path d="M8 10.5h8M8 14h4.5" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const Infosymbol = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-5 w-5">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
    <path d="M12 11v5" stroke="currentColor" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.1" fill="currentColor" />
  </svg>
);

const REITER: Reiter[] = [
  { pfad: "/", name: "Saalplan", symbol: Saalplansymbol },
  { pfad: "/meine-buchung", name: "Meine Buchung", symbol: Buchungssymbol },
  { pfad: "/infos", name: "Infos", symbol: Infosymbol },
];

export function Navigation() {
  const pfad = usePathname();

  function aktiv(reiter: string): boolean {
    if (reiter === "/") return pfad === "/" || pfad.startsWith("/tisch");
    if (reiter === "/meine-buchung")
      return pfad.startsWith("/meine-buchung") || pfad.startsWith("/reservierung");
    return pfad.startsWith("/infos");
  }

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2"
    >
      <ul className="glas-leiste-schwebend flex items-stretch gap-0.5 rounded-full p-1">
        {REITER.map((r) => {
          const ist = aktiv(r.pfad);
          return (
            <li key={r.pfad}>
              <Link
                href={r.pfad}
                aria-current={ist ? "page" : undefined}
                className={`flex min-w-[4.75rem] flex-col items-center gap-[3px] rounded-full px-3.5 py-2 text-[0.66rem] font-medium leading-none transition-colors duration-200 ${
                  ist ? "bg-white/10 text-rot-hell" : "text-white/40 hover:text-white/70"
                }`}
              >
                {r.symbol}
                <span className="whitespace-nowrap">{r.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
