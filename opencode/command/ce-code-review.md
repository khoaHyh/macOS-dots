---
description: Structured code review using tiered persona agents
argument-hint: "[blank to review current branch, or provide PR link]"
---

Run a structured code review with the `ce-review` skill.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'ce-code-review' })
```

Then follow the skill instructions exactly.

<user-request>
$ARGUMENTS
</user-request>
