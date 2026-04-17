---
description: Stress-test a plan against the repo's domain model and terminology
argument-hint: "[plan, spec, or feature to sharpen]"
---

Challenge this plan against the existing domain model, terminology, and context docs.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'domain-model' })
```

Then follow the skill instructions exactly.

When asking questions during the domain-model workflow, use the question tool.

<user-request>
$ARGUMENTS
</user-request>
