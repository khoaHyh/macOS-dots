---
description: Run a lean pre-commit deslop pass on the current change
agent: Bob
argument-hint: "[optional: base:<ref> mode:report-only]"
---

Run a bespoke deslop pass tuned to this repo's OpenCode workflow.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'deslop' })
```

Then follow the skill instructions exactly.

<user-request>
$ARGUMENTS
</user-request>
