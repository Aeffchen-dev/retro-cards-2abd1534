# Verlauf (Health Check) verständlicher machen

## So wird heute gespeichert
- Automatisch, ohne Speichern-Knopf: sobald alle acht eigenen Antworten da sind, wird nach ca. 1 Sekunde ein Eintrag angelegt.
- Ein Eintrag pro Tag: ändert ihr am selben Tag noch etwas, wird der Eintrag ersetzt, nicht verdoppelt.
- Ohne Anmeldung: nur auf diesem Gerät (Browser-Speicher). Mit Anmeldung/geteilter Sitzung: geschützt im Backend, sichtbar nur für euch beide.
- „Verlauf" erscheint erst, wenn es mindestens eine frühere Retro gibt. Einträge lassen sich einzeln löschen.

## Was heute schwer verständlich ist
- Niemand sieht, dass (und wo) gespeichert wurde.
- Diagramm-Achse zeigt nur „1, 2, 3" statt Datum; Zahlen wie „3,4/5" und „+0,25" sind abstrakt.
- Themen-Auswahl, Trends, Diagramm, Legende und Tabelle stehen gleichwertig untereinander – keine klare Hauptaussage.

## Vorschlag
1. **Speicher-Hinweis** unter dem Button: „Automatisch gespeichert · heute, 21:14 · nur auf diesem Gerät" (bzw. „für euch beide").
2. **Eine Kernaussage oben**: z. B. „Seit der letzten Retro: Jana ↗ etwas besser, Chris → gleich" – in Worten statt Dezimalzahlen (besser / gleich / schlechter).
3. **Diagramm mit Datum** auf der Achse (z. B. „Okt", „Nov") und Smileys statt 1–5 an der Seite; Legende direkt an den Linien.
4. **Themen als Chips** statt Auswahlliste: „Gesamt" + acht Themen zum Antippen.
5. **Tabelle einklappbar** („Alle Retros anzeigen"), Werte als Smiley + Zahl.
6. Bei nur einer früheren Retro: einfacher Vorher/Nachher-Vergleich statt Liniendiagramm.

## Technisch
- Nur `HealthCheckHistory.tsx`, `health-history-data.ts` (Hilfsfunktion Trend→Wort, getestet) und `health-check.css`; Speicherlogik bleibt unverändert.
