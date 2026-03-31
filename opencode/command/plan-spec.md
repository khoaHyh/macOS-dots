---
description: Dialogue-driven spec development through skeptical questioning
agent: Plan
---

Develop implementation-ready specs through iterative dialogue and skeptical questioning.

Planning rules:

- Keep the interaction dialogue-first.
- Use targeted explore or librarian help only when it materially improves the spec.
- Treat `.specs/` as the canonical destination for durable plan/spec artifacts.
- Do not treat `specs/` or `.opencode/state/` as canonical planning stores.

First, invoke the skill tool to load the spec-planner skill:

```
skill({ name: 'spec-planner' })
```

Then follow the skill instructions to develop the spec.

<user-request>
$ARGUMENTS
</user-request>
