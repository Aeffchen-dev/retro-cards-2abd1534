# Verlauf-Pills mit direktem Löschen

- „Heute“ und frühere Retros werden als eckige CTA-Reihen mit 32px Höhe dargestellt statt als runde Chips.
- Die aktive Datums-Pille erhält links eine Kategorie-Marke aus Quadrat und Punkt in invertierten Kartenfarben.
- Jede frühere Retro, die die angemeldete Person löschen darf, erhält direkt ein sichtbares X mit deutscher Beschriftung für Screenreader. „Heute“ und fremde Einträge bleiben ohne Löschsymbol.
- Die bestehende Sicherheitsabfrage bleibt. Nach erfolgreichem Löschen einer ausgewählten Retro zeigt die Grafik wieder „Heute“; bei einem Fehler bleiben Auswahl und Eintrag erhalten.

## Technisch
- `HealthCheckHistory.tsx`: Datumsauswahl und Löschbutton als separate, nebeneinander liegende Bedienelemente; kein verschachtelter Button und kein separater Löschlink mehr unter der Leiste.
- `health-check.css`: gemeinsamer CTA-Look, aktive invertierte Punkt-Kachel und klar erkennbare X-Fläche.
- `health-history-data.ts`: kleine reine Filterfunktion für einen Eintrag, mit konkretem Test, damit nur die gewählte Retro entfernt wird.
- In der Telefon-Vorschau mit einem Testeintrag prüfen: auswählen, aktives Styling, X sichtbar, Bestätigung, Löschen und Rückkehr zu „Heute“.
