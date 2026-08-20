import { AppRahmen } from "@/components/AppRahmen";
import { onboardingFertig } from "@/lib/eigene-buchungen";
import { einstellungenLaden } from "@/lib/einstellungen";
import { datumLang } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GastLayout({ children }: { children: React.ReactNode }) {
  const [e, fertig] = await Promise.all([einstellungenLaden(), onboardingFertig()]);

  return (
    <AppRahmen
      onboardingNoetig={!fertig}
      verfallZeit={e.verfall_zeit}
      datumText={datumLang(e.event_datum)}
      einlassZeit={e.einlass_zeit}
    >
      {children}
    </AppRahmen>
  );
}
