---
description: Triage issues through the configured issue-tracker workflow
argument-hint: "[issue number, URL, or triage request]"
---

Run the `triage` workflow for the requested issue-tracker task.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'triage' })
```

Then follow the skill instructions exactly.

<user-request>
$ARGUMENTS
</user-request>
