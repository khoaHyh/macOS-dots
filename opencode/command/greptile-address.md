---
description: Address Greptile PR feedback once without looping
agent: Bob
---

Run a single Greptile feedback pass for the target PR.

First, invoke the skill tool to load the one-pass workflow:

```text
skill({ name: 'greptile-address' })
```

Then follow the skill instructions exactly once.

<user-request>
$ARGUMENTS
</user-request>
