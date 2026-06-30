---
description: Run the computa-please workflow from brainstorm to spec, implementation, review, and final gate
argument-hint: "[request, spec path, review notes, or final-gate target]"
---

Run the `computa-please` workflow for this request.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'computa-please' })
```

Then follow the skill instructions exactly. Pass the user request through unchanged.

<user-request>
$ARGUMENTS
</user-request>
