---
description: Address Greptile PR feedback once without looping
---

Run a single Greptile feedback pass for the target PR.

First, invoke the VCS detection skill so stacked Graphite repos use the correct flow:

```text
skill({ name: 'vcs-detect' })
```

Then invoke the skill tool to load the one-pass workflow:

```text
skill({ name: 'greptile-address' })
```

Then follow the skill instructions exactly once.

<user-request>
$ARGUMENTS
</user-request>
