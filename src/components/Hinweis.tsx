type Ton = "gelb" | "rot" | "gruen" | "orange" | "neutral";

const STIL: Record<Ton, string> = {
  gelb: "border-gelb/35 bg-gelb/8",
  rot: "border-rot/40 bg-rot/10",
  orange: "border-orange/40 bg-orange/10",
  gruen: "border-gruen/35 bg-gruen/8",
  neutral: "border-white/12 bg-white/5",
};

const TITELFARBE: Record<Ton, string> = {
  gelb: "text-gelb",
  rot: "text-rot-hell",
  orange: "text-orange-hell",
  gruen: "text-gruen-hell",
  neutral: "text-white",
};

export function Hinweis({
  ton = "neutral",
  titel,
  bild,
  children,
}: {
  ton?: Ton;
  titel?: string;
  /** Optionales Bild in der Ecke. Der Text rueckt dann rechts aus dem Weg. */
  bild?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 ${STIL[ton]}`}>
      {bild}
      <div className={bild ? "relative pr-24 sm:pr-28" : undefined}>
        {titel && (
          <p className={`mb-1 text-sm font-semibold ${TITELFARBE[ton]}`}>{titel}</p>
        )}
        <div className="text-sm leading-relaxed text-white/75">{children}</div>
      </div>
    </div>
  );
}
