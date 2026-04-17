---
description: Turn the current context into a PRD and submit it as a GitHub issue
argument-hint: "[optional extra steering]"
---

Turn the current conversation and codebase context into a PRD, then submit it as a GitHub issue.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'to-prd' })
```

Then follow the skill instructions exactly.

<user-request>
$ARGUMENTS
</user-request>
