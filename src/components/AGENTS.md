# Component rules

Rules here apply to the deck's cards and scales in this directory; the project's
root `AGENTS.md` still holds the deck-wide ones.

- Represent workload as contiguous percentage-width segments; move adjoining boundaries with Radix sliders and reserve an avatar slot per partner so zero shares cannot overlap. Each circle steps 2px away from the boundary it rides (thumb transform / readOnly left calc, as Radix positions its own wrapper) so neighbours keep a 4px gap and a solid ink boundary line spanning the lane's own height centres in that gap. Name each partner in a row above the circles, print its share in one below, both centred on its colour run, clamped inside the lane and clear of the circles; both use `width: max-content` under a fixed `max-width`, so a narrow run can neither squeeze a name nor push a number off the card.
