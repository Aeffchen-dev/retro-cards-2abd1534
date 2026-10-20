# Project rules
- Keep additional reflection-style slides in focused components using the existing notes persistence and print flow, so data clearing and exports remain consistent.
- Use Radix Slider for the relationship-work scale so pointer, touch and keyboard input share accessible, bounded behavior.
- Normalize workload shares with shared pure helpers and persist all changed partners in one state update; screen and print use the same normalized split to avoid mismatched totals.
- Represent workload as contiguous percentage-width segments; move adjoining boundaries with Radix sliders and reserve a separate avatar slot for each partner so zero shares cannot cause overlap.
- Paginate Risikofaktoren by available card space using one shared notes namespace, so extra pages preserve existing values and follow the same print and clearing flow.
- Morph shared face geometry through the current Risikofaktoren header expressions without opacity blending, so draggable markers match every evenly spaced scale anchor continuously.
- Size each printed page to the printable area (not the full sheet or the screen viewport) and anchor the print container to the sheet top, so every card lands on its own page without overflow or a blank first page.
- Keep absolutely positioned card content inside the card's own content box — clamp with CSS `min()` against the container and measure the live container while dragging — so nothing can make a card horizontally scrollable.