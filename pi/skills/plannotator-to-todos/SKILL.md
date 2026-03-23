---
name: plannotator-to-todos
description: Convert an approved Plannotator plan file into file-backed vertical-slice todos. Use when the user wants to go from `.specs/...` plan docs to executable todos in Pi.
allowed-tools: read write todo
---

# Plannotator Plan to Todos

Convert an approved plan file into independently grabbable vertical-slice todos.

## Scope

Use this skill when:

- the user has a completed or approved plan from Plannotator
- the plan exists as a markdown file
- they want executable task breakdown in the `todo` tool

Do not use this skill for first-pass planning from scratch.

## Plan file policy (repo-specific)

Plan files should live under `.specs/` and should not be committed.

Preferred naming pattern:

- `.specs/<YYYYMMDD-HHMMSS>-<slug>.md`

If the input is not already in `.specs/`, create a canonical snapshot there first and use that path as the parent reference.

## Process

### 1. Load and validate plan

- Read the plan file.
- Confirm it has enough detail to produce vertical slices.
- If it is ambiguous, ask focused clarification questions before creating todos.

### 2. Draft vertical slices

Break the plan into thin end-to-end slices (not horizontal layer tasks).

For each slice include:

- title
- blocked-by
- acceptance criteria
- user-visible value

### 3. Get user approval on breakdown

Show numbered slice list and ask for approval before creating todos.

Do not create todos until the user approves.

### 4. Create todos

Use one todo per approved slice in dependency order.

Always include tags:

- `prd`
- `vertical-slice`
- `prd:<slug>`

Where `<slug>` is derived once from the parent plan title and reused across all todos.

Use the parent reference path from `.specs/...` in each todo body.

### 5. Summarize

After creation, report:

- todo ids + titles
- shared `prd:<slug>` tag
- dependency graph using real todo ids
