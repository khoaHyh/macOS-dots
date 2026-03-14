# ADR 0001: V1 Kernel Contract

## Status
Accepted

## Context
This repository currently mixes a local OpenCode config surface in `opencode/`, OmO-oriented configuration in `opencode/oh-my-opencode.json`, Plannotator-oriented commands in `opencode/command/`, and reusable skills in `.agents/skills/`.

The v1 custom harness needs to preserve the useful ideas from OmO without inheriting OmO's full orchestration complexity. It also needs to align with the user's preference for a config-first OpenCode setup similar to `.config/opencode`, not a standalone orchestration plugin package.

## Decision: Implementation Model
- `opencode/` is the checked-in source of truth for the harness.
- The harness is implemented as a config-first OpenCode surface that is intended to back `.config/opencode` through the user's existing dotfiles workflow.
- Plugins remain thin helpers only for cross-cutting hooks or protections that cannot be expressed cleanly with native OpenCode agents, commands, skills, and config.
- V1 must not become a standalone orchestration plugin package.

## Decision: Primary Agents
V1 has exactly 3 primary agents:

1. `PlanB` - dialogue-first planning agent
2. `Bob` - default build agent for ordinary repo-local work
3. `Scuba` - explicit codex-style deep-work agent

No other agent may be primary in v1.

## Decision: Specialist Subagents
The following are available as non-primary specialist subagents only:

- `explore` - focused codebase/pattern search
- `librarian` - external docs/examples/research
- `oracle` - strategic consultation and complex architecture/debugging guidance
- `momus` - higher-rigor review specialist

These specialists must be invoked explicitly or by documented escalation triggers. They must not add default cognitive or token overhead to ordinary tasks.

## Decision: Review Model
- Default review mode is `light`.
- `momus` is available as a higher-rigor review subagent.
- `dialectic` remains an optional escalated review path, especially for plan and architecture disagreements.
- `momus` or `dialectic` must not run by default on ordinary tasks.

## Decision: Planning Source of Truth
- `.specs/` is the single source of truth for planning artifacts in v1.
- `specs/` and `.opencode/state/` are legacy surfaces and must not remain concurrent canonical stores.
- Any compatibility handling for `.opencode/state/` must be adapter logic only and must be explicitly marked temporary.

## Decision: Coexistence and Migration Strategy
- V1 initially coexists with current OmO and Plannotator surfaces while the new kernel is implemented and validated.
- Coexistence is transitional, not indefinite.
- New commands and docs should point to the v1 kernel first.
- Existing OmO/Plannotator surfaces are deprecated only after v1 routing, planning, review, and eval coverage are green.

## Decision: Escalation Rubric
Escalation is hybrid and explicit.

Auto-escalation is allowed only when one or more documented triggers are present, such as:

- risky file/domain boundaries
- large or cross-cutting changes
- unresolved ambiguity after first-pass analysis
- failed first implementation attempt with evidence
- explicit research or architecture needs

Auto-escalation is not allowed for:

- trivial repo-local edits
- ordinary low-risk file changes
- user-explicit `Scuba` runs unless a documented fallback condition is reached
- casual keyword matches without the full trigger policy being satisfied

Escalation depth is one hop by default.

## Decision: Admission Rubric
Every new agent, command, skill, or plugin must document:

- trigger
- user value
- token/call cost
- fallback behavior
- test coverage
- eval coverage
- removal condition

If a feature cannot explain why it exists or cannot be measured, it does not enter the v1 kernel.

## Decision: Lean Success Metrics
The v1 harness must be measured against a baseline using at least:

- prompt footprint
- always-on agent count
- time-to-first-action
- token/call counts on fixed eval fixtures

Claims that the harness is "leaner" or "higher ROI" must be supported by eval output, not manual impressions.

## Consequences
- The kernel remains understandable because only 3 primary agents exist in the default path.
- Specialist power is preserved without imposing OmO-level orchestration on every task.
- `.specs/` becomes the durable planning contract, reducing planning-state ambiguity.
- The config-first layout aligns with the user's dotfiles/OpenCode workflow and keeps plugin complexity low.

## Out of Scope for V1
- Full OmO background orchestration
- Always-on review gates
- A broad category matrix with many first-class agents
- Maintaining multiple canonical planning stores
- Standalone plugin-package architecture for the harness
