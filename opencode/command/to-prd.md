---
description: Turn current context into a PRD and publish it to the project issue tracker
argument-hint: "[optional PRD steering or scope notes]"
---

Turn the current conversation and codebase context into a PRD, then publish it to the project issue tracker.

First, invoke the skill tool to load the workflow:

```text
skill({ name: 'to-prd' })
```

Then follow the skill instructions exactly.

Do not interview the user for new requirements. Explore the repo as needed, use the project's domain glossary and ADRs, sketch the major modules to build or modify, and check that module/test expectations match the user before publishing.

If the issue tracker or triage label vocabulary is not available, run the `setup-matt-pocock-skills` workflow before creating the PRD issue. Apply the `needs-triage` label when publishing.

<user-request>
$ARGUMENTS
</user-request>
