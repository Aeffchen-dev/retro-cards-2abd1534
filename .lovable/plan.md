# Smiley-Regler: weiße Füllung und Einrasten beim Loslassen

- Die grauen Smileys behalten ihre zurückhaltende graue Kontur, aber ihre Innenfläche wird deckend weiß gezeichnet.
- Beim Ziehen folgt der schwarze Regler frei und stufenlos dem Finger oder Zeiger.
- Beim Loslassen springt er auf die nächste der fünf Smiley-Spalten: 0, 25, 50, 75 oder 100 Prozent.
- Das gilt für den gemeinsamen Smiley-Regler im Health Check und bei den Risikofaktoren. Gespeicherte Health-Check-Werte bleiben weiterhin 1–5, Partnerantworten und Auswertung ändern sich nicht.
- Tastatursteuerung und einfaches Antippen landen ebenfalls auf einer Spalte.

## Technisch
- `RisikoSlide.tsx`: während der Interaktion einen freien Zwischenwert anzeigen und bei Zeigerende, Abbruch oder Fokusverlust auf den nächsten Spaltenwert setzen.
- `risiko-data.ts`: eine kleine reine Einrastfunktion mit Tests für Grenzen und Rundung.
- `health-check.css` und `index.css`: weiße Fläche von der abgeschwächten Kontur entkoppeln; bestehende Tests an das neue Verhalten anpassen.
- Danach den zentralen Ablauf am Telefon-Viewport prüfen: frei ziehen, loslassen, eingerasteten Wert und weiße Füllung kontrollieren.
