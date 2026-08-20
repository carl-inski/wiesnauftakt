"use client";

import { useState } from "react";
import { Navigation } from "./Navigation";
import { Onboarding } from "./Onboarding";

/**
 * Klammert die Gastseiten: Navigation unten, Onboarding beim ersten Besuch.
 * Waehrend des Onboardings bleibt die Navigation weg – sie taucht erst auf,
 * wenn man in der App angekommen ist.
 */
export function AppRahmen({
  onboardingNoetig,
  verfallZeit,
  datumText,
  einlassZeit,
  children,
}: {
  onboardingNoetig: boolean;
  verfallZeit: string;
  datumText: string;
  einlassZeit: string;
  children: React.ReactNode;
}) {
  const [onboarding, setOnboarding] = useState(onboardingNoetig);

  return (
    <>
      <div className={onboarding ? "h-dvh overflow-hidden" : "pb-[7.5rem]"} aria-hidden={onboarding}>
        {children}
      </div>

      {onboarding ? (
        <Onboarding
          verfallZeit={verfallZeit}
          datumText={datumText}
          einlassZeit={einlassZeit}
          onFertig={() => setOnboarding(false)}
        />
      ) : (
        <Navigation />
      )}
    </>
  );
}
