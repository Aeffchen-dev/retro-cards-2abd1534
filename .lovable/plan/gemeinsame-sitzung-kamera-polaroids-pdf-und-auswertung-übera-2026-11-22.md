# Gemeinsame Sitzung, Kamera, Polaroids, PDF und Auswertung überarbeiten

## 1. Gemeinsames Schreiben (Textfelder)
- Jede Person schreibt in **ihr eigenes Feld**, das Feld des Partners steht direkt darunter, live sichtbar, mit seinem Namen und seiner Farbe (nur lesen). So überschreibt niemand den Text des anderen.
- Karten mit „[Name]'s Themen" zeigen automatisch die Spalte der jeweiligen Person.
- Partnertext erscheint sofort, während er tippt (kein Warten auf Feldverlassen beim **fremden** Feld; nur das eigene Feld wird beim Tippen nicht angefasst).

## 2. Name statt „Gast"
- Der Setup-Name wird bei Beitritt sofort mitgeschickt und bei jeder Änderung (verzögert) aktualisiert; zusätzlich wird der Name aus den geteilten Antworten gelesen, falls die Serverzeile noch „Gast" enthält. Prüfung mit zwei echten Gästen.

## 3. Tippen fühlt sich normal an
- Eigenes Feld ist vollständig lokal geführt; Speichern und Teilen laufen im Hintergrund ohne Neuzeichnen der Karte. Erneuter Test im iPhone-Format inkl. erstem Buchstaben.

## 4. Health Check: Partner-Emoji sehen
- Das Emoji (Memoji) des Partners erscheint live an der Stelle, wohin er es zieht – halbtransparent, mit Namen, eigenes Emoji bleibt unberührt. Regel „eigene Antwort zuerst" gilt weiter.

## 5. Fotos
- „Kamera öffnen" startet auf iOS die Rückkamera der Telefon-Kamera direkt (Datei-Auswahl mit Kamera-Aufnahme statt Browser-Vorschau), ohne Blitz.
- Aufgenommene Bilder erscheinen als Polaroids (weißer Rahmen, breiter unterer Rand mit Datum, leicht gedreht), auch im PDF.

## 6. PDF-Export
- Jede Karte sauber auf eine A4-Seite, einheitliche Ränder und Schrift, Partnerantworten nebeneinander, Polaroids, keine abgeschnittenen Inhalte, keine leeren Seiten. Kontrolle per gerenderter Druckvorschau.

## 7. Bessere automatische Auswertung
- Auswertungskarte zeigt automatisch: größte Unterschiede zwischen euch (mit Gesprächsimpuls), stärkste und schwächste Bereiche, Trend gegenüber der letzten Retro, Stimmung vorher/nachher und offene Ideas als nächste Schritte. Ohne Partner nur eigene Werte.

## Technische Details
- Textfelder: Partnerwerte aus `partnerAnswers` pro Feldschlüssel in `PostItField` als read-only Block; Hold-until-blur nur noch für das fokussierte eigene Feld.
- Name: `display_name` beim `join` mitsenden; Fallback `answers.setup.name1`.
- Health-Check-Position: Partner-Markerposition aus geteilten Antworten (`health-check-position.ts`), Live-Update während Drag (gedrosselt).
- Kamera: `<input type="file" accept="image/*" capture="environment">` als iOS-Pfad, `camera-settings.ts` ohne Torch.
- Polaroid: neue CSS-Komponente, in Memory-Slide und Print.
- Auswertung: Logik in `retro-summary.ts` erweitern, mit Tests pro Regel.
