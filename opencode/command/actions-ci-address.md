---
description: Address GitHub Actions CI failures once for the current PR/branch
---

Run a single GitHub Actions CI remediation pass for the target PR/branch.

First, invoke the VCS detection skill so stacked Graphite repos use the correct flow:

```text
skill({ name: 'vcs-detect' })
```

Then invoke the skill tool to load the one-pass workflow:

```text
skill({ name: 'actions-ci-address' })
```

Then follow the skill instructions exactly once.

<user-request>
$ARGUMENTS
</user-request>
