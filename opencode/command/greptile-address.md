---
description: Address Greptile PR feedback
---

Run a single Greptile feedback pass for the target PR.

First, invoke the VCS detection skill so stacked Graphite repos use the correct flow:

```text
skill({ name: 'vcs-detect' })
```

Then invoke the skill tool to load the remediation workflow:

```text
skill({ name: 'review-remediation' })
```

Use Greptile as the reviewer selector for the target PR, together with any supplied comment, revision, or time constraints. Freeze its currently open feedback and follow the skill instructions exactly once. Later feedback belongs to another run.

<user-request>
$ARGUMENTS
</user-request>
