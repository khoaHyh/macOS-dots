---
description: Compact the current conversation for another agent to continue
argument-hint: "[optional: next session focus]"
---

Run the `handoff` workflow for the current conversation.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'handoff' })
```

Then follow the skill instructions exactly.

Use any user arguments as the next session focus when tailoring the handoff document.

<user-request>
$ARGUMENTS
</user-request>
