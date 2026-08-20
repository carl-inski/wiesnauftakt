/**
 * Drei Zeilen unter dem Plan. Wer aus einem Gruppenchat hier landet, weiss
 * sonst nicht, dass die Tische anklickbar sind.
 */
export function SoGehts() {
  const schritte = ["Freien Tisch antippen", "Namen eintragen", "Auf unser Okay warten"];

  return (
    <div className="glas-tief flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
      {schritte.map((text, i) => (
        <div key={text} className="flex flex-1 items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
            {i + 1}
          </span>
          <span className="text-sm text-white/65">{text}</span>
        </div>
      ))}
    </div>
  );
}
