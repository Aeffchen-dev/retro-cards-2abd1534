# Health-Check-Skala: UI- und UX-Verbesserungen

## Ziel
Die Skala soll sofort verständlich sein, sich auf dem Handy sicher bedienen lassen und klar zeigen, was gewählt wurde – ohne das bestehende Aussehen (Smileys, Linie, runder Punkt) umzubauen.

## Vorschläge

1. **Gewählte Antwort sichtbar machen**
   Während des Ziehens und danach steht die passende Spaltenbezeichnung (z. B. „Trifft oft zu“) hervorgehoben unter dem Punkt; die übrigen Bezeichnungen treten etwas zurück.

2. **Spürbares Einrasten**
   Beim Loslassen gleitet der Punkt sanft (ca. 150 ms) in die nächste Spalte; auf Android kurzes Vibrieren beim Einrasten.

3. **„Noch nicht beantwortet“ klarer**
   Solange nichts gewählt ist, wirkt der Punkt leicht abgeblendet mit dem kurzen Links/Rechts-Hinweis; nach der ersten Wahl wird er voll ink-schwarz. So ist der neutrale Startwert nicht mit einer echten Antwort verwechselbar.

4. **Tippen statt nur Ziehen**
   Tippen auf ein Smiley oder eine Spaltenbezeichnung setzt den Punkt direkt dorthin (größere Trefferflächen, mind. 44 px).

5. **Partner-Antwort ruhiger**
   Partner-Smiley und Name rücken nie in die Spaltenbezeichnungen; liegen beide Antworten in derselben Spalte, stehen sie nebeneinander statt übereinander.

6. **Bedienbarkeit für alle**
   Screenreader lesen die Spaltenbezeichnung statt einer Zahl vor; Pfeiltasten springen spaltenweise, Pos1/Ende an die Enden.

7. **Kein versehentliches Weiterwischen**
   Ziehen auf der Skala blättert nie die Karte um; leichtes vertikales Wischen außerhalb des Punkts scrollt/blättert normal.

## Technische Details
- Betrifft `StatementScale` in `RisikoSlide.tsx`, die ersten zwei Health-Check-Karten in `RetroCards.tsx` und `health-check.css`.
- Gespeicherte Antworten (1–5 bzw. 0/25/50/75/100) bleiben unverändert.
- `aria-valuetext` aus den Spaltenbezeichnungen; Snap-Animation per CSS-Transition nur nach dem Loslassen; `navigator.vibrate(8)` wenn verfügbar.
- Tests für: Tippen auf Spalte setzt Wert, valuetext entspricht Bezeichnung, unbeantworteter Zustand.
