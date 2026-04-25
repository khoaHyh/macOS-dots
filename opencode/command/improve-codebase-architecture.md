---
description: Find deepening opportunities to improve codebase architecture
argument-hint: "[optional: repo area, module, or architectural concern]"
---

Run the `improve-codebase-architecture` workflow for this codebase or target area.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'improve-codebase-architecture' })
```

Then follow the skill instructions exactly.

For OpenCode, when the skill refers to the Agent tool with `subagent_type=Explore`, use the `task` tool with `subagent_type="explore"`.

<user-request>
$ARGUMENTS
</user-request>
