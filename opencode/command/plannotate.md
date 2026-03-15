---
description: Open Plannotator for a confirmed plan review
agent: PlanB
---

Use this command to run an iterative planning discussion and only trigger Plannotator review when the plan is explicitly approved.

<user-request>
$ARGUMENTS
</user-request>

Context and behavior:
- Stay in planning mode (do not use edit/patch/bash/write actions).
- Keep the conversation dialogue-first and only introduce artifacts when they add value.
- Convert the request into implementation options and discuss trade-offs where relevant.
- If multiple choices exist, use the `question` tool with interactive options (do not ask the user to type A/B/C or numbers).
- After each round, confirm what was agreed before moving forward.
- Durable plan artifacts belong under `.specs/`.
- `specs/` and `.opencode/state/` are not canonical planning stores.
- Finalization is blocked until I say exactly `PLAN APPROVED`.

When I send `PLAN APPROVED`:
1) produce a final, actionable plan in markdown (goals, approach, file-level changes, risks, verification).
2) immediately call `submit_plan` with:
   - `plan`: the final plan markdown
   - `summary`: 1-2 line plan summary
3) wait for the tool/agent flow to complete and do not continue with additional planning text.

If `submit_plan` is unavailable, reply with:
`submit_plan is unavailable in this session. Here is the final plan for manual submission:` followed by the final plan markdown.
