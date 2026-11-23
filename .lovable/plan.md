# „Letzte 4 Wochen“ einheitlich rosa

## Sichtbare Änderung
- Der Hintergrund der Karte „Letzte 4 Wochen“ wird fest auf den vorhandenen Rosa-Ton `#F39FFF` gesetzt, unabhängig von ihrer Position im Kartenstapel.
- Alle sechs geöffneten Notizseiten übernehmen denselben Hintergrund, da sie die Farbe der zugehörigen Karte verwenden.
- Die orangefarbene Kategorie-Pille, die rosa Fragefelder und alle gespeicherten Notizen bleiben unverändert.

## Technisch
- `RetroCards.tsx`: Die positionsabhängige Hintergrundfarbe für Karte 3 wird durch den festen Rosa-Ton ersetzt; die Notizansicht nutzt weiterhin genau diesen Kartenstil.
- `questions-card-fill.test.js`: Ein Regressionstest stellt sicher, dass Karte 3 und ihre Notizseiten nicht wieder eine positionsabhängige Farbe erhalten.
- Telefon-Vorschau: Kartenhintergrund und eine geöffnete Notizseite auf identischen Rosa-Ton prüfen; anschließend Typecheck und fokussierte Tests ausführen.
