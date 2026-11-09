# Roadmap

## Current request
- [ ] Add before/after mood cards, persisted independent answers, comparison in evaluation and print; verify mobile/desktop and connected guests.
- [x] Status dot on "Partner einladen", jump to first card after joining, "schreibt gerade …" hint, automatic daily history saving (no save button), desktop arrows with arrow-key hint, fonts loaded with the page, year review after 12 retros (best category, biggest change, latest Memory photo). Last card was already remembered. Two-device typing hint and join jump not exercised live.
- [x] Simplify sharing, remove join name entry, close after successful join, consolidate status and confirm disconnection; two guests verified through creation, sharing fallback, nameless join, cancellation and confirmed leave; seven focused tests pass.
- [x] Add private invitation links and capability-protected guest connections without registration. Two real guests verified on mobile/desktop: invitation accepted, independent 1/5 and 5/5 ratings, live text readback, evaluation and reload. Integration test verifies room isolation, invalid/invite credentials rejected for reads, direct table reads expose no rows and leave revokes access; 17 focused tests pass. Guest history remains on-device.
- [x] Show independent category-coloured partner markers on Health Check scales, preserving own-answer-first and local slider values; 13 relevant tests pass and mobile/desktop checks with saved local comparison answers pass. Real connected-account verification remains blocked below.
- [x] Show partner edits without reload: immediate member updates and foreground catch-up with effect cleanup. Actual hook tested with simulated service: direct live updates and missed-event catch-up visible without reload; 5 relevant tests pass. Real-account verification remains blocked below.
- [x] Show pending/accepted invitation status and resend the existing pending invite through native sharing. 15 relevant tests pass; simulated mobile/desktop status transitions and same-link sharing verified.
- [x] Verify invitation acceptance with two connected guests, replacing the registration-dependent check.
- [x] Enlarge evaluation further, match category CTA colours, show Verlauf only for past retros and compare current results in trends. Mobile/desktop verified with and without dated local history; 190 tests pass. Connected-account checks remain blocked by unavailable signed-up accounts.
- [x] Restore smooth earlier question family; Health Check category in outlined black pill above top-aligned question, scale 28px below. Mobile/desktop verified; 188 tests pass.
- [x] Remove email, Google and Lovable sign-in from Zu zweit verbinden; retain link sharing without exposing private answers anonymously.
- [x] Auswertung: answered topics only, darker green partner, larger chart and bottom-left Verlauf CTA expanding the saved timeline below the chart. Exact-pair filtering tested; mobile/desktop and two local dated retros verified; 188 tests pass.
- [x] Remove Intro connection; Setup uses card CTA and bottom sheet with explanation and authenticated share/copy actions. Opening/closing verified on mobile and desktop; authenticated sharing awaits a signed-up account.
- [x] Simplify Health Check to one topic per card in shared question typography; remove captions, top controls and evaluation CTA. Chart has full axis labels and open missing-answer marks; mobile/desktop checked.
- [x] Add Setup partner connection; publish Setup and current question alongside all existing text and scale answers in the read-only live partner view.
- [x] Verify live partner updates with two connected guests: independent ratings and live text readback without reload.
- [x] Save dated Health Check snapshots locally or privately for connected partners; cloud schema and access policies confirmed.
- [x] Show chronological partner trends with per-topic selection; two local retros saved and read after reload on mobile/desktop, both partner lines and +4/-4 changes verified.
- [ ] Verify cloud history saving in an authenticated browser — blocked: no signed-up auth users; session minting failed.
- [x] Add a private partner connection on Intro with live notes and selections.
- [x] Replace Health Check content after its first two cards with the eight screenshot categories, two per card.
- [x] Add Auswerten with both partners' results in a radar chart; verified two authenticated browsers, live text readback, independent ratings and outsider access denial. 179 tests passed.

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
- [x] Superseded: the old statement-scale appearance decision no longer applies to the replaced Health Check cards; historical answer data is preserved.
- [x] Setup card back to yesterday's caps: at most 500px wide and 720px tall, always in that 500:720 proportion (measured 469×674 on an 873×755 window).
- [x] "Kamera öffnen": the camera glyph reads light orange (#FFE0B5) on the slide's purple tile — pale enough to clear 3.5:1 there.
- [x] Phones: the scale column names are as big as their column can hold in three lines — `min(calc(100cqw / 5 / 4.35), 18px)` (13.3px on a 393px phone, 9.9px on a 320px one, every name ≤3 lines, no word cut); tablet/desktop/paper keep their two-line size. 176 checks pass, print 18 pages.
- [x] Phones: the scale column names now read the helper sentence's size (12px, the app's floor) instead of the column-scaled three-line size; tablet/desktop/paper untouched. 176 checks pass, print 18 pages.
- [x] Big question headline back on the device's own "Stack Sans Notch", with the bundled "Stack Sans Notch Local" file demoted to fallback, in both the shared #root rule and the headline block (user: "headline nicht die mitgelieferte Schrift"); weight 400 kept. 176 checks pass.
