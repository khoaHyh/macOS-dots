---
description: Find deepening opportunities informed by domain docs and ADRs
argument-hint: "[optional: repo area, module, or architectural concern to explore]"
---

Run the `improve-codebase-architecture` workflow for this codebase or target area.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'improve-codebase-architecture' })
```

Then follow the skill instructions exactly.

Use the skill's domain and architecture vocabulary: read `CONTEXT.md` and relevant ADRs first, surface numbered deepening opportunities, and do not propose interfaces until the user chooses a candidate.

For OpenCode, when the skill refers to the Agent tool with `subagent_type=Explore`, use the `task` tool with `subagent_type="explore"`.

If the workflow reaches the grilling loop, update `CONTEXT.md` or offer ADRs inline only when the skill says to do so.

<user-request>
$ARGUMENTS
</user-request>
