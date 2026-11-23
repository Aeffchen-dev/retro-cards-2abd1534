# Verlauf-Pills im CTA-Look

- „Heute“ und frühere Retros werden als eckige CTA-Reihen mit 32px Höhe dargestellt statt als runde Chips.
- Die aktive Datums-Pille erhält links eine Kategorie-Marke aus Quadrat und Punkt in invertierten Kartenfarben.
- Der Verlauf bietet keine Löschfunktion. Die bisherige Löschaktion unter der Leiste und die zugehörige Löschlogik entfallen vollständig; gespeicherte Retros bleiben unverändert erhalten.

## Technisch
- `HealthCheckHistory.tsx`: Datumsauswahl als CTA-Pills; Löschbutton, Löschimport und `remove`-Logik entfernen.
- `health-check.css`: gemeinsamer CTA-Look und aktive invertierte Punkt-Kachel; alte Löschstyles entfernen.
- In der Telefon-Vorschau mit einem Testeintrag prüfen: Datumsauswahl, aktives Styling und dass keine Löschaktion mehr angeboten wird.
