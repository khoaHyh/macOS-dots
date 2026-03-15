# ADR 0002: Scuba Codex Integration Flexibility

## Status
Accepted

## Context
ADR 0001 established a lean v1 kernel with explicit default constraints to avoid unnecessary orchestration overhead. As Scuba evolves toward deeper codex-style execution, those defaults should not be interpreted as hard runtime ceilings.

## Decision
- ADR 0001 remains the baseline architecture for normal operation.
- Explicit user direction may authorize deeper Scuba orchestration when needed to complete work safely and reliably.
- One-hop escalation remains the default, but bounded multi-hop escalation is allowed when first-pass execution is inconclusive and additional specialist input is justified.
- Core safety constraints remain mandatory (non-destructive behavior, clear verification, and transparent reporting).

## Consequences
- Scuba can integrate richer codex-style orchestration without being blocked by v1 default caps.
- The harness remains controlled: deeper orchestration must be justified by evidence, not routine keyword triggers.
- Future tests and policy checks should prefer capability-based guarantees over fixed-count structural limits.
