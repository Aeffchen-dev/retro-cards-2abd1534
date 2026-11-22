# Retro-Auswertung verbessern

## 0. Vorher reparieren
Die letzte Setup-Änderung (Partner als verbundene Karte) wurde mitten im Umbau unterbrochen und ist noch nicht fertig. Ich schließe sie zuerst sauber ab (Code korrekt verschachteln, grünen Verbindungspunkt gestalten) und prüfe dann, dass die App wieder läuft.

## Was die Auswertung heute ist
Eine Liste „Auf einen Blick“ mit Text: Schnitt, Partner-Schnitt, Trend, Unterschiede, Stärken, Gesprächsthemen, Fairness, nächste Schritte, Intimität, plus ein Gesprächsimpuls.

## Neu: übersichtlich statt einer langen Liste
1. **Kopfzeile mit zwei großen Zahlen:** dein Schnitt und der deines Partners nebeneinander (z. B. „3,8 · 4,1“), darunter der Trend als Pfeil mit Farbe („▲ +0,4 seit letztem Monat“).
2. **Themen als kleine Balken:** Jedes der acht Themen eine Zeile mit zwei kurzen Balken (du und Partner, jeweils in eurer Farbe). So sieht man sofort, wo ihr euch einig seid und wo nicht.
3. **Drei klare Kästen:**
   - **Das läuft gut:** Themen, die ihr beide mit 4 oder 5 bewertet habt.
   - **Darüber reden:** Themen mit 2 oder weniger oder mit mindestens 2 Punkten Unterschied, jeweils mit einer passenden Gesprächsfrage.
   - **Bis zur nächsten Retro:** eure Ideen-Antworten als Checkliste.
4. **Stimmung vorher/nachher:** Wenn ihr den Stimmungscheck ausgefüllt habt, zeigt ein Smiley-Paar, wie sich eure Stimmung verändert hat.
5. **Faire Verteilung:** Die Arbeitsverteilung als ein kleiner geteilter Balken („Alex 60 % · Sam 40 %“) statt nur einer Zahl.
6. **Fehlende Antworten freundlich:** Statt „–“ steht „Noch offen – zurück zum Health Check“ mit Sprung zur Karte.
7. **Druck/PDF:** Dieselbe Auswertung, in Schwarz-Weiß lesbar, passt auf eine Seite.

## Technische Details
- Reine Berechnung in `retro-summary.ts` erweitern (gemeinsame Stärken, Gesprächsthemen mit Fragen je Kategorie, Stimmungsänderung, Arbeitsanteile aus vorhandenen Antwort-Schlüsseln); Tests dazu.
- `RetroSummary.tsx` neu gliedern; Partnername über `partnerDisplayName`; Farben aus vorhandenen Partner- und Kartentokens.
- Gesprächsfragen je Kategorie als feste deutsche Liste (von mir formuliert, anpassbar).
