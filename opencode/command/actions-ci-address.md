---
description: Address GitHub Actions CI failures once for the current PR/branch
agent: Scuba
---

Run a single GitHub Actions CI remediation pass for the target PR/branch.

First, invoke the skill tool to load the one-pass workflow:

```text
skill({ name: 'actions-ci-address' })
```

Then follow the skill instructions exactly once.

<user-request>
$ARGUMENTS
</user-request>
