# Feedback des Partners auf eigener Folie

## Was sich ändert
- Auf der Folie **"Gegenseitiges Feedback"** schreibst du nur noch deine eigenen Antworten (Spiegeln, Danke, Ungesagt) – die Vorschau "[Name] schreibt:" unter den Feldern entfällt.
- **Direkt danach** erscheint – nur wenn ein Partner verbunden ist – eine neue Folie **"Feedback von [Name]"** mit seinen drei Antworten, voll lesbar, nicht bearbeitbar (Schloss-Hinweis wie bisher).
- Hat der Partner ein Feld noch leer: grauer Hinweis "[Name] schreibt noch …"; Antworten erscheinen live.
- Ohne verbundenen Partner bleibt das Deck unverändert (keine leere Extrafolie).
- Export/PDF: eigene Feedback-Seite wie bisher, Partner-Feedback als eigene Seite danach (nur wenn verbunden).

## Technisch
- Neue Slide-ID `SLIDE_REFLECTION_PARTNER` in `RetroCards.tsx`, in `slides` nur eingefügt wenn `live` existiert, direkt nach `SLIDE_REFLECTION`; Pill "Feedback", gleiche Farben über `pillColorOf`/`labelColorOf(SLIDE_REFLECTION)`.
- Inhalt: `REFLECTION_FIELDS` als `PostItField readOnly` mit `live.reflection[key]`; `partnerValue` aus der eigenen Feedback-Folie entfernen (Screen + Print).
- Swiper-Index-Navigation (z. B. `slides.indexOf`) bleibt ID-basiert, daher keine Verschiebungsfehler.
- Test: Folie erscheint nur mit Partner und steht direkt nach Feedback.
