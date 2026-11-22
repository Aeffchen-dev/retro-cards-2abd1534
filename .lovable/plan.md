# KI-Auswertung für die Retro

## Was entsteht
- Auf der **Takeaways**-Karte öffnet ein neuer Button **„KI-Auswertung“** einen fokussierten Dialog.
- Die Auswertung übernimmt automatisch eure bereits eingetragenen Antworten aus Feedback, Gesprächsthemen, Intimacy, Ideas und Takeaways. Bei einer Verbindung werden auch die sichtbaren Partnerantworten berücksichtigt.
- Ein optionales Feld **„Zusätzlicher Kontext“** ergänzt die Runde, ohne Antworten doppelt einzugeben.
- Das Ergebnis zeigt auf Deutsch **2–4 wiederkehrende Themen** und **2–3 konkrete gemeinsame nächste Schritte** mit Umsetzungszeitpunkt.
- Damit „wiederkehrend“ auch über mehrere Retros funktioniert, bleiben die letzten sechs KI-Themen nur auf diesem Gerät gespeichert und werden beim nächsten Mal als Vergleich mitgegeben. „Meine Einträge löschen“ entfernt sie ebenfalls.

## Technik
- Neue geschützte Cloud-Funktion `retro-insights`, aufgerufen über die bestehende Backend-Verbindung.
- AI Gateway mit dem voreingestellten Modell `openai/gpt-6.1-sol` über die Responses-Schnittstelle und strikt strukturierter JSON-Ausgabe.
- Gastzugänge werden mit ihrem vorhandenen privaten Token geprüft; angemeldete Nutzer über ihre Sitzung. Eingaben werden serverseitig begrenzt und validiert.
- Keine neue Datenbanktabelle: Antworten werden nur zur Verarbeitung gesendet; der Verlauf der KI-Themen liegt lokal im Browser.
- Neuer, fokussierter React-Dialog mit Lade-, Fehler-, Leer- und Wiederholungszuständen. Die vorhandene numerische Auswertung bleibt unverändert.

## Prüfung
- Tests für Antwortzusammenstellung, Partner-Zuordnung und lokalen Themenvergleich.
- Funktionstest mit strukturierter KI-Ausgabe sowie Ablehnung ungültiger oder fehlender Zugänge.
- Telefonansicht mit echten Beispielantworten; Ergebnis erneut laden und Verlauf über eine zweite Runde prüfen.
