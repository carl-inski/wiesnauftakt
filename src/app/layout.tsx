import type { Metadata, Viewport } from "next";
import { basisUrl } from "@/lib/urls";
import "./globals.css";

export const metadata: Metadata = {
  // basisUrl() faengt leere und schiefe Werte ab – new URL("") hat frueher
  // den ganzen Build gekippt.
  metadataBase: new URL(basisUrl()),
  title: {
    default: "Wiesnauftakt 2026 – Pfarrjugend SJB",
    template: "%s · Wiesnauftakt",
  },
  description:
    "Biertisch reservieren für den Wiesnauftakt der Pfarrjugend SJB am 18. September 2026 im Jugendheim SJB Haidhausen.",
  openGraph: {
    title: "Wiesnauftakt 2026 – Pfarrjugend SJB",
    description: "Tisch reservieren, Leute eintragen, Pin abholen. 18.09.2026, Einlass ab 18:30.",
    locale: "de_DE",
    type: "website",
    images: [{ url: "/logo-quadrat.svg", width: 800, height: 800 }],
  },
  icons: { icon: "/logo-bildmarke.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#101625",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gelb focus:px-5 focus:py-2.5 focus:font-semibold focus:text-nacht"
        >
          Zum Inhalt springen
        </a>
        {children}
      </body>
    </html>
  );
}
