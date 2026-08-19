"use client";

import { useEffect, useState } from "react";

/**
 * Der Countdown rechnet erst nach dem Mount, sonst laeuft die Serverzeit gegen
 * die Uhr im Browser und React meckert ueber unterschiedliches Markup.
 */
export function Countdown({ zielIso }: { zielIso: string }) {
  const [rest, setRest] = useState<number | null>(null);

  useEffect(() => {
    const ziel = new Date(zielIso).getTime();
    const rechnen = () => setRest(ziel - Date.now());
    rechnen();
    const uhr = window.setInterval(rechnen, 30_000);
    return () => window.clearInterval(uhr);
  }, [zielIso]);

  if (rest === null) {
    return <span className="inline-block h-6 w-28 rounded bg-white/10" aria-hidden />;
  }

  if (rest <= 0) {
    return <span className="font-semibold text-gelb">Heute geht&rsquo;s los!</span>;
  }

  const tage = Math.floor(rest / 86_400_000);
  const stunden = Math.floor((rest % 86_400_000) / 3_600_000);

  if (tage === 0) {
    return (
      <span>
        <span className="font-semibold text-gelb">
          noch {stunden} {stunden === 1 ? "Stunde" : "Stunden"}
        </span>
      </span>
    );
  }

  return (
    <span>
      <span className="font-semibold text-gelb">
        noch {tage} {tage === 1 ? "Tag" : "Tage"}
      </span>
      {tage <= 14 && stunden > 0 && (
        <span className="text-white/55"> und {stunden} h</span>
      )}
    </span>
  );
}
