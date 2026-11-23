# Verbesserungsvorschläge: Inhalt, Eingaben und allgemeine UX

Ausgewählt aus dem, was die App heute hat (Setup, Health Check, Risikofaktoren, Notizen, Ideas, Takeaways mit Auswertung, Archiv, geteilte Session). Bitte die Punkte abwählen, die nicht umgesetzt werden sollen.

## 1. Inhalt
- **Einstiegsfrage pro Runde:** Eine kurze, wechselnde Warm-up-Frage nach dem Setup („Was war diesen Monat ein schöner kleiner Moment?“), damit man nicht direkt mit Bewertungen startet.
- **Vorhaben vom letzten Mal:** Auf der Ideas-Karte die Vorhaben der vorigen Retro anzeigen, jeweils mit „geschafft / teilweise / nicht“. So schließt sich der Kreis zwischen den Runden.
- **Konkretere Takeaways:** Pro Takeaway optional „Wer?“ und „Bis wann?“, damit aus Vorsätzen Absprachen werden.
- **Sanftere Formulierungen bei schwierigen Themen:** Bei „Ungesagt“ und den Risikofaktoren ein kurzer Hinweis, wie man etwas als Ich-Botschaft formuliert.

## 2. Eingaben (Input-UX)
- **Fortschritt pro Karte:** Ein kleiner Punkt in der Pille zeigt, ob eine Karte schon ausgefüllt ist (leer / angefangen / fertig).
- **Notizen leichter öffnen:** Ein Tippen auf ein leeres Feld öffnet direkt die Schreibansicht, statt erst den Button zu suchen.
- **Gespeichert-Hinweis:** Nach dem Tippen kurz „Gespeichert“ (und in der geteilten Session „Für Partner sichtbar“) anzeigen, damit klar ist, dass nichts verloren geht.
- **Partner tippt gerade:** Ein kleiner Hinweis „Chris schreibt …“ direkt am passenden Feld statt allgemein.
- **Rückgängig beim Leeren:** Nach „Alles löschen“ ein paar Sekunden lang „Rückgängig“ anbieten.

## 3. Allgemeine UI/UX
- **Kapitel-Übersicht:** Ein Tippen auf die Pille öffnet eine kompakte Liste aller Karten zum direkten Springen (ersetzt die fehlende Seitenzahl, ohne sie wieder einzuführen).
- **Ruhigere Infotexte:** Lange ℹ-Sätze auf das Nötigste kürzen; Details nur beim Antippen.
- **Ende der Runde markieren:** Auf Takeaways ein klarer Abschluss „Retro abschließen“, der speichert, die Auswertung zeigt und das nächste Datum vorschlägt.
- **Erinnerung an die nächste Retro:** Datum aus „Dates“ als Kalendereintrag (.ics) exportieren.
- **Erste Nutzung:** Beim allerersten Öffnen eine 3-Schritte-Einführung (Wischen, Schieben, Notizen) statt Hinweise auf jeder Karte.

## Technische Details
- Fortschritt, Gespeichert-Hinweis und „schreibt …“ nutzen die bestehenden Antwort-Schlüssel und die vorhandene Tipp-Aktivität der Session; keine neuen Tabellen.
- Vorhaben vom letzten Mal lesen aus dem vorhandenen Archiv; Status wird als neuer Antwort-Schlüssel der laufenden Runde gespeichert.
- Kalender-Export als lokal erzeugte .ics-Datei.
- Tests für Fortschrittsstatus und Rückgängig-Logik.
