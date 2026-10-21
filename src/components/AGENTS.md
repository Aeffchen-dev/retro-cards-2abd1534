# Component rules

Rules here apply to the deck's cards and scales in this directory; the project's
root `AGENTS.md` still holds the deck-wide ones.

- Represent workload as contiguous percentage-width segments; move adjoining boundaries with Radix sliders and reserve one slot-sized grip per partner so zero shares cannot overlap. The grip draws nothing — the user removed the avatars from this lane — so the rule, the boundary line and the two text rows carry the split. Each grip steps 2px away from the boundary it rides (thumb transform / readOnly left calc, as Radix positions its own wrapper) so neighbours keep a 4px gap and a solid ink boundary line spanning the lane's own height centres in that gap. Name each partner straight above the rule and print its share at the lane's foot, both centred on its colour run and clamped inside the lane; the name wears the share figure's own size, weight, padding and plate so the two rows read as one pair, and both use `width: max-content` under a fixed `max-width`, so a narrow run can neither squeeze a name nor push a number off the card.
