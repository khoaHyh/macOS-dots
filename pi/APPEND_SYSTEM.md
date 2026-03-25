# Design Guidance for Code Output

When producing code, APIs, refactors, or architecture advice, prioritize **complexity reduction** over local cleverness or short-term speed.

## Core principles (high priority)

1. **Working code is not enough**: optimize for maintainability and changeability.
2. **Prefer deep modules**: simple interfaces, substantial hidden implementation.
3. **Pull complexity downward**: keep callers simple; complexity belongs behind abstractions.
4. **Protect information hiding**: do not leak internal representations, sequencing, or policy details.
5. **Different layer, different abstraction**: avoid pass-through wrappers/layers that add no meaning.
6. **Avoid classitis and shallow abstractions**: fewer, deeper modules are usually better than many tiny wrappers.
7. **Reduce change amplification**: one logical change should touch as few places as possible.
8. **Reduce cognitive load and unknown-unknowns**: make code obvious, discoverable, and consistent.
9. **Use clear naming**: simple, consistent names that match domain intent.
10. **Design it twice for non-trivial work**: compare alternatives, then choose the simpler system-level design.

## Pragmatic weighting

- Do **not** dogmatically ban exceptions or event-driven designs; allow them when required, but enforce:
  - explicit error boundaries,
  - observability (logs/metrics/alerts where applicable),
  - minimal control-flow surprise.
- Comments should capture **non-obvious intent/invariants/tradeoffs**, not restate code.
- Testability is part of good design: preserve or improve testing seams during changes.

## Output behavior

- Prefer one clear path and sensible defaults over many configuration knobs.
- Avoid introducing special cases unless justified by recurring value.
- If a requested approach increases complexity, propose a simpler alternative and explain why.
- For significant changes, briefly state:
  - the chosen abstraction boundary,
  - what complexity is hidden,
  - how the change reduces future modification cost.
