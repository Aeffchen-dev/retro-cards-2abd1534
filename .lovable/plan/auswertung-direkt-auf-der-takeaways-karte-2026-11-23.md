# Auswertung direkt auf der Takeaways-Karte

## Sichtbare Änderung
- Das separate KI-Fenster entfällt. Die Gesamtauswertung wird direkt auf der Takeaways-Karte erstellt und dort angezeigt.
- Die Zahlen, Verlauf und Themenbalken bleiben erhalten. Darunter erscheinen auf Wunsch drei klare Bereiche: „Was gut funktioniert“, „Was Aufmerksamkeit braucht“ und „Eure Vorhaben“.
- In einer geteilten Session werden beide Perspektiven einbezogen. Gemeinsamkeiten und unterschiedliche Wahrnehmungen werden verständlich nebeneinander gestellt.
- Vor der KI-Erstellung oder ohne Verbindung bleibt die vorhandene sofortige Auswertung sichtbar. Bereits eingetragene Ideas haben bei den vorgeschlagenen Vorhaben Vorrang.

## Alle Angaben einbeziehen
- `retro-ai-data.ts` sammelt zusätzlich zu den bisherigen Textfeldern alle sechs „Letzte 4 Wochen“-Notizen, Dates, Health-Check-Notizen und -Bewertungen, Intimität, Beziehungsarbeit und Takeaways.
- Leere Felder und lokale Partnerkopien werden ignoriert. Gemeinsam bearbeitete Ideas werden nur einmal als gemeinsame Angabe übergeben.
- Die bisherige Verlaufsfunktion für wiederkehrende Themen bleibt lokal auf dem Gerät.

## Technisch
- `RetroAiInsights.tsx`: Dialog und Zusatzkontext-Fenster durch eine eingebettete Ergebnisansicht mit Erstellen-/Aktualisieren-Button ersetzen.
- `RetroSummary.tsx`: Die KI-Ergebnisse ersetzen nach ihrer Erstellung die drei Standardboxen; bis dahin dient diese als Fallback.
- `retro-insights`: Alle gesammelten Angaben zulassen; das Antwortschema erhält pro Thema eine Kategorie (`works` oder `watch`) und einen Vergleich der Perspektiven. Das Modell wird ausdrücklich angewiesen, vorhandene Ideas zu priorisieren und keine Tatsachen zu erfinden.
- Bestehende gespeicherte KI-Ergebnisse bleiben lesbar; fehlende neue Felder werden beim Einlesen sinnvoll ergänzt.
- Tests für vollständige Erfassung, Partnervergleich, gemeinsame Ideas und das neue Antwortformat; anschließend Typecheck, Funktionsdeployment und Telefonprüfung ohne Dialog.
