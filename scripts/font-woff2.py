#!/usr/bin/env python3
"""Wandelt public/fonts/brewhouse.otf oder .ttf in eine woff2 um.

    pip install fonttools brotli
    python3 scripts/font-woff2.py

woff2 ist rund halb so gross wie otf/ttf – bei einer Schrift, die nur fuer
Ueberschriften laedt, macht das auf dem Handy einen spuerbaren Unterschied.
Noetig ist es nicht: Die Seite bindet otf und ttf genauso ein.
"""
import sys
from pathlib import Path

ORDNER = Path(__file__).resolve().parent.parent / "public" / "fonts"


def main() -> int:
    kandidaten = ["brewhouse.otf", "brewhouse.ttf", "BrewHouse.otf", "BrewHouse.ttf"]
    quelle = next((ORDNER / n for n in kandidaten if (ORDNER / n).exists()), None)
    if quelle is None:
        print(f"Keine der Dateien {', '.join(kandidaten)} in {ORDNER}", file=sys.stderr)
        return 1

    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print("Fehlt: pip install fonttools brotli", file=sys.stderr)
        return 1

    ziel = ORDNER / "brewhouse.woff2"
    schrift = TTFont(quelle)
    schrift.flavor = "woff2"
    schrift.save(ziel)

    vorher, nachher = quelle.stat().st_size, ziel.stat().st_size
    print(f"{quelle.name} ({vorher // 1024} KB) -> {ziel.name} ({nachher // 1024} KB), "
          f"{100 - nachher * 100 // vorher} % kleiner")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
