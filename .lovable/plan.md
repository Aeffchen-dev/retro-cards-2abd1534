# Geteilte Sitzung: Feedback, Dates, Intimität, Vorhaben

1. **Feedback des Partners**: Hat der Partner ein Feld noch nicht ausgefüllt, bleibt es einfach leer – kein Text „… schreibt noch …“.
2. **Dates (Nicht monogam)**: Das zweite Feld („Notizen meines Partners“) zeigt live, was dein Partner in sein eigenes Feld schreibt (nur lesen, mit Schloss), statt ein leeres Feld zum Selbstausfüllen.
3. **Intimität**: Die Antworten des Partners (Herzen + Texte) stehen auf einer eigenen Karte direkt danach („Intimität von [Name]“), wie beim Feedback. Die eigene Karte zeigt nur noch deine Antworten. Ohne Partner gibt es die Zusatzkarte nicht.
4. **„Das nehmen wir uns vor“ (Ideas)**: Alle Verbundenen bearbeiten dieselben drei Felder gemeinsam; Änderungen erscheinen live bei allen. Die getrennte Partner-Vorschau unter den Feldern entfällt.
5. **Verlauf (letzte Health-Check-Karte)**: Statt Knopf „Verlauf“ mit Liniendiagramm und Tabelle steht unter dem Diagramm eine waagrechte Datumsleiste zum Wischen: „Heute“ plus die Daten früherer Retros. Ein Tipp auf ein Datum zeigt im Diagramm darüber die Werte dieses Tages; „Heute“ ist vorausgewählt. Gespeichert wird weiter automatisch, ein Eintrag pro Tag.
6. Druck/PDF: Partner-Intimität als eigene Seite nur bei verbundenem Partner.

## Technisch
- `RetroCards.tsx`: Placeholder auf Partner-Feedbackkarte entfernen; Dates-Feld des Partners `readOnly` aus `live` (Partner `p0` → lokales `p1`); neue `SLIDE_INTIMACY_PARTNER` nach Intimität, nur bei `live`.
- Ideas: gemeinsame Felder über die bestehende versionierte Setup-Merge-Logik (`shared-setup-data`-Muster, pro Feld versioniert), damit veraltete Antworten neuere Eingaben nicht überschreiben; Tests dafür. AGENTS.md-Regel „andere Antworten bleiben persönlich“ entsprechend für Ideas anpassen.
- `RetroSummary`/`HealthCheckChart` bekommt die gewählten Ergebnisse; `HealthCheckHistory.tsx` wird zur Datumsleiste (Chips, scrollbar, `swiper-no-swiping`); Löschen bleibt per langem Druck/Menü am Datum.
- Prüfung mit zwei verbundenen Testgeräten.
