# Roadmap

## Done
- [x] Added a separate question-font preview with round, technical and serif tabs on the same sample card; the deck typography and saved answers stay unchanged.
- [x] Big question headline reads a smooth face: the chain is now `"Stack Sans Notch", "Stack Sans Text", "Figtree", Arial, sans-serif` at weight 400 in both the shared `#root` rule and the `.retro-title, .retro-heading` block, so the bundled sliced "Stack Sans Notch Local" file can never paint the headline again (user: "headline nicht die mitgelieferte Schrift" → "nein die andere" → "Ohne Einschnitte"). 176 checks pass, build OK, print 18 pages.
- [x] Every font family back to yesterday's: the scale's column names read in the deck's own body face (Figtree) again, the upright companion face (Stack Sans Text) and its `#root` rule are gone (user: "revert all font families to the ones from yesterday"); the display face (Stack Sans Notch, weight 400) and the body face were already yesterday's and stayed. 175 checks pass, print 18 pages.
- [x] Scale pens split again: the answer dot's outline circle and the rule it rides draw **2px** ("OUTLINE CIRCLE SLIDER DOT AND SLIDR LINE STROKE WIDT" → "2PX"), the five grey smileys' round outline stands a step finer at **1.8px**, the grey smileys' mouth draws **1.4px** and every other face's mouth (Health Check, the dragged dot) **1.6px**; the dot's 2px white ring is gone, so the white stops exactly at its own edge.
- [x] Smileys, one drawing: every face in the deck (scale smileys, Health Check faces, printed average-mood face, answer dot) is built from the scale's own anchor mouths, so the **mouth now draws one pixel on all of them** and the **eyes are filled dots a step bigger** (0.8 → 1 grid unit, 3.67px at the 44px face) while each outline keeps its own weight (2.4px on the scale, 2.2px in Health Check).
- [x] Scale pens: one shared 2.4px pen for the rule, the five grey smileys and the answer dot's own face (the 20% step between scale and answer is retired), and every vertical line — the column guides, the dividers between columns and the work-split's boundary — is a single pixel.
- [x] Info row: the ℹ glyph is 12px and rides the sentence's first line; the sentence starts at exactly the same x as "Notizen öffnen"; 8px hairline gaps; the mark stands in an unfilled 32px column at the row's edge.
- [x] Grey scale smileys: outline only, no fill, no plate; the guides keep their grey.
- [x] Big question text back to the display face's regular weight: `#root .question-font` (and the statement that shares its rule) paints at 400, one step below the 500 it wore; the family is a variable 200–700 face, so the step is visible. 177 checks pass.
- [x] Notes button: grey field with a grey ring, black pencil outside edit mode (pink X and pink pencil kept where they belong).
- [x] Answer dot: subtle 2px white outline; the circle is drawn at rest too, so the resting marker and the dragged one are the same object; the arrow hint inside paints at 1px and stays the horizontal left-right arrow.
- [x] Scale rule: the card's own ink, about 2px with round ends; the pen is a step heavier and shared by rule, smileys and dot.
- [x] Column names: always the card's ink, whatever column the answer rests in.
- [x] Statement wording, print and clear flow unchanged: 170 checks pass, print stays 18 pages.

## Open
- [x] Every card in the slider now wears one measure: the container's height capped at 88% (345×636 on a phone, 500×764 on a 1440×900 desktop), no per-card exception, no desktop-only ceiling, no card scrolling its own content; 175 checks pass.
- [x] "Notizen öffnen": the grey pencil tile lost its outline everywhere (user: "EDIT PEN BACKGROUND NO OURLINE"); the ℹ-Icon stays as it is (user: "So lassen"); the big question font draws one weight heavier (400 → 500); the grey vertical guides confirmed at 1px; 176 checks pass.
- [ ] The rule now passes straight behind the unfilled smileys (their own ask: "grey full = grey outline no fill"). If they'd rather the line stopped at each face's edge, the faces need a plate of the card's surface again — waiting on the user's call.
- [x] Setup card back to yesterday's caps: at most 500px wide and 720px tall, always in that 500:720 proportion (measured 469×674 on an 873×755 window).
- [x] "Kamera öffnen": the camera glyph reads light orange (#FFE0B5) on the slide's purple tile — pale enough to clear 3.5:1 there.
- [x] Phones: the scale column names are as big as their column can hold in three lines — `min(calc(100cqw / 5 / 4.35), 18px)` (13.3px on a 393px phone, 9.9px on a 320px one, every name ≤3 lines, no word cut); tablet/desktop/paper keep their two-line size. 176 checks pass, print 18 pages.
- [x] Phones: the scale column names now read the helper sentence's size (12px, the app's floor) instead of the column-scaled three-line size; tablet/desktop/paper untouched. 176 checks pass, print 18 pages.
- [x] Big question headline back on the device's own "Stack Sans Notch", with the bundled "Stack Sans Notch Local" file demoted to fallback, in both the shared #root rule and the headline block (user: "headline nicht die mitgelieferte Schrift"); weight 400 kept. 176 checks pass.
