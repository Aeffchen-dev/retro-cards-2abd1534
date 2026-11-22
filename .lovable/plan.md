# Setup-Karte in der gemeinsamen Sitzung aufräumen

## Ziel
Sobald ihr verbunden seid, zeigt die Setup-Karte klar: oben „Du“ (bearbeitbar), darunter dein Partner (nur lesbar). Kein doppeltes Feld mehr, kein Teilen-Knopf bei jemandem, der schon verbunden ist.

## Was sich ändert
1. **Deine Zeile:** Das Schild heißt „Du“ statt „Partner 1“. Dein Name- und Emoji-Feld bleiben wie gehabt.
2. **Partner-Zeile, wenn verbunden:**
   - Statt eines leeren Eingabefelds plus Lesezeile gibt es einen Block: großes Emoji, Name (so wie er ihn selbst eingetragen hat), darunter klein „verbunden“ mit grünem Punkt.
   - Hat er noch nichts eingetragen: dein vorgemerkter Name in grau und „trägt seinen Namen noch ein …“.
   - Ohne Schloss-Text; die Optik zeigt, dass es nicht änderbar ist (graue Fläche ohne Cursor).
   - Kein „Link teilen“ mehr in dieser Zeile.
3. **Weitere Partner:** Bleiben wie jetzt (Feld + „Link teilen“), solange sie noch nicht verbunden sind; nach dem Beitritt sehen sie gleich aus wie Punkt 2.
4. **Für den eingeladenen Partner auf seinem Handy:** Gleiche Darstellung – er sieht sich selbst oben als „Du“ und dich darunter verbunden. Der Knopf „Partner hinzufügen“ und der Schalter „Nicht monogam“ sind für ihn ausgeblendet, das bleibt Sache der Person, die eingeladen hat.
5. **Ohne Verbindung:** Alles bleibt genau wie heute.

## Technische Details
- In `RetroCards.tsx` Setup-Block: bei `live` Partner-Slot als neue kleine Komponente `SetupPartnerCard` (Emoji, Name via `partnerDisplayName`, Status aus `partnerSession.online`) rendern statt Input + `PartnerConnection`; die in der letzten Runde ergänzte `setup-partner-own`-Lesezeile entfällt.
- Gast erkennt man an `!partnerSession.isOwner`; dann „Partner hinzufügen“/„Nicht monogam“ ausblenden.
- Farben aus vorhandenen Setup-Tokens; Druck unverändert.
- Test: Partner-Slot zeigt Name aus Partner-Setup, fällt auf vorgemerkten Namen zurück, nie „Gast“.
