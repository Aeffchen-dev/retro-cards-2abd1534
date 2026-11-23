# Fragen-Karte ohne pinken Hintergrund

Die Fragen-Karte (und die Ideas-Karte, die dieselbe Zufallsfarbe trägt) wählt zufällig aus sechs Farbkombinationen. Eine davon hat Pink als Fläche (Pink mit Orange). Diese Kombination fällt weg, die übrigen fünf bleiben unverändert.

## Technisch
- `RetroCards.tsx`: Eintrag `{ icon: BRAND.stackOrange, square: BRAND.pink }` aus `QUESTION_COMBOS` entfernen. Die Wiederholungssperre arbeitet mit dem Index modulo Länge und passt sich an.
- Test: Keine Kombination in `QUESTION_COMBOS` hat `square: BRAND.pink`.
