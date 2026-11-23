# Statement-Karte (Risikofaktoren) verbessern

## Was auf dem Screenshot auffällt
1. **"Chris" kollidiert mit "Trifft immer zu"** – das Partner-Label läuft in die Spaltenbeschriftung.
2. **Partner-Smiley hängt lose unter der Linie** – wirkt wie ein sechster Smiley, nicht wie eine Antwort.
3. **Viel leere Fläche** zwischen Frage, Skala und Infozeile; die Skala wirkt klein und verloren.
4. **Nur zwei Endbeschriftungen**, die mittleren Spalten bleiben namenlos, obwohl Linien sie trennen.
5. **Vertikale Linien ragen weit über/unter die Smileys** und wirken unruhig.
6. **Kein Hinweis, ob du schon geantwortet hast** – das gewählte Smiley ist nur etwas dunkler.

## Vorschläge
- Partner-Antwort **über** der Linie zeigen (kleiner Punkt/Emoji mit Name darüber), die Spaltenbeschriftung bleibt unten frei – keine Überlappung mehr.
- Partner-Markierung in einer eigenen, zurückhaltenden Farbe (dunkelgrau Umriss, wie im Health Check), damit sie klar "Antwort von Chris" liest.
- Skala etwas größer und näher an die Frage rücken; freien Raum unten statt zwischen den Blöcken.
- Trennlinien kürzen: nur so hoch wie Smiley + Label-Zone.
- Endbeschriftungen unter dem ersten/letzten Smiley zentrieren statt am Rand.
- Gewähltes Smiley deutlicher markieren (Kartenfarbe als Füllung oder dickerer Ring).

## Technisch
- `RisikoSlide.tsx` / `health-check.css`: Partner-Marker-Position (above), Labelplatte, Linienhöhe, Spacing.
- Kollisionsprüfung wie `partnerLabelSide` wiederverwenden; Print unverändert lassen.
- Test: Partner-Label überlappt Endbeschriftung nicht (Geometrie-Helper).
