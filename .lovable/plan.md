# Health Check Skala: größer, Partner-Antwort klarer

## Was sich ändert
- **Skala größer**: Smileys und Linie wachsen (Smileys 44 → ca. 52px, Feldhöhe 120 → ca. 150px), der Abstand zur Frage oben und zum Kartenende unten wird kleiner – die Skala füllt den freien Platz.
- **Partner-Smiley schwarz**: Umriss in Tinte statt Grau, ohne Füllung.
- **Partner-Name ohne graue Fläche**: keine Platte/Hinterlegung mehr, nur der Name.
- **Etwas Luft unter der Partner-Antwort**: Abstand zwischen Name und „Trifft noch nicht zu / Trifft immer zu“, damit nichts mehr kollidiert.

## Technisch
- `health-check.css`: `.health-scale-centre` Padding reduzieren, `--risiko-field-h` und Track-Höhe für `.health-smiley-control` anheben, Gesichtsgröße per Variable nur in dieser Karte vergrößern (Risikofaktoren bleiben unverändert).
- `.risiko-comparison-marker > svg` Stroke auf `var(--retro-black)`; `.risiko-comparison-name` sicher `background: none` (auch gegen geerbte Platten-Regeln aus `index.css`), Farbe bleibt Grau-Text.
- `.has-comparison` bekommt `padding-bottom` (~12px), damit die Endbeschriftungen unter dem Namen sitzen.
- Am iPhone-Format (393×706) mit verbundenem Partner per Screenshot prüfen, dass Karte nicht überläuft.
