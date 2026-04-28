---
description: Diagnose hard bugs and regressions with a feedback-loop-first workflow
argument-hint: "[bug report, failing behavior, or performance regression]"
---

Run the `diagnose` workflow for this bug or regression.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'diagnose' })
```

Then follow the skill instructions exactly.

<user-request>
$ARGUMENTS
</user-request>
