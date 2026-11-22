# Gemeinsame Sitzung: Namen, Rechte, Slider – klar und einheitlich

## So ist es heute
- **Namen:** Auf Karten mit Schreibfeldern heißt dein Partner so, wie er sich selbst im Setup nennt; fehlt das, der Name, den du im Setup für ihn eingetragen hast; sonst „Partner".
- **Lücke:** Die Health-Check-Slider und die Auswertung nutzen noch den beim Beitritt gespeicherten Namen – dort kann weiterhin „Gast" stehen.
- **Bearbeiten:** Jeder schreibt nur in seine eigenen Felder und verschiebt nur sein eigenes Emoji bzw. seinen eigenen Regler. Die Antworten des anderen sind nur lesbar.
- **Slider:** Die Auswahl des anderen erscheint als zweite Markierung auf derselben Skala, aber erst, wenn du selbst geantwortet hast.

## Was ich ändere
1. **Ein Name überall:** Slider, Auswertung, Diagramm, Verlauf, Emoji-Label und Verbindungsliste nutzen dieselbe Namensregel. „Gast" taucht nirgends mehr auf.
2. **Setup des Partners sichtbar:** Auf der Setup-Karte siehst du die Einträge deines Partners (Name, Emoji) als nicht bearbeitbare Zeile mit „von [Name] eingetragen". Dein eigenes Feld bleibt deins.
3. **Feld-Beschriftungen:** Jede Partner-Antwort unter einem Schreibfeld trägt „[Name] schreibt:" mit dem richtigen Namen; auf beiden Geräten aus Sicht des jeweiligen Lesers (bei dir heißt er Sam, bei Sam heißt du Alex).
4. **Klar, was man bearbeiten kann:** Partner-Antworten bekommen ein kleines Schloss-Symbol und den Hinweis „Nur [Name] kann das ändern". Eigene Felder bleiben wie gehabt.
5. **Slider des Partners:** Die zweite Markierung trägt den Namen direkt daneben (wie beim Emoji), in der Partnerfarbe, nicht verschiebbar. Solange du noch nicht geantwortet hast, steht unter der Skala „[Name] hat schon geantwortet – antworte zuerst, um es zu sehen".

## Technische Details
- `HealthCheckRatings` und Auswertung: `otherName` über `partnerDisplayName(partner.display_name, live.setup.name1, setupData.name2)` statt `s.partnerName`; Name als Prop aus `RetroCards` übergeben.
- Setup: read-only Partnerzeile aus `live.setup`.
- `PostItField` read-only Block: Label + Schloss-Icon; `StatementScale` comparison: Label rechts neben dem Marker, Hinweis bei verstecktem Ergebnis.
- Tests: Namensregel auf Slider/Auswertung; Hinweis erscheint nur, wenn Partner geantwortet hat und man selbst nicht.
