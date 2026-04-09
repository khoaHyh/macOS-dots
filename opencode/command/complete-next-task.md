---
description: Complete the next incomplete task from a PRD
agent: Bob
---

Complete one task from a PRD file. Implements the next task with `passes: false`, runs feedback loops, and commits.

## Usage

```
/complete-next-task <prd-name>
```

Where `<prd-name>` matches `.specs/<prd-name>/prd.json`.

## Before Starting

First, invoke the skill tool to detect the VCS:

```
skill({ name: 'vcs-detect' })
```

Use Git for repository operations. If Graphite is available, prefer `gt` for branch and stacked-PR operations.

## File Locations

**Canonical state root**: `.specs/`

Search for `.specs/<prd-name>/prd.json` from cwd upward.

Use this bash to find the state directory:

```bash
find_specs_state() {
  local prd="$1"
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/.specs/$prd/prd.json" ]]; then
      echo "$dir/.specs/$prd"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}
```

State layout:

```
<state-dir>/
├── prd.json       # Task list with passes field
└── progress.txt   # Cross-iteration memory
```

Legacy compatibility note:
- `.opencode/state/` may exist in older projects.
- Treat it as migration-only compatibility input, not a canonical destination for new state.

## Process

### 1. Get Bearings

- Read progress file - **CHECK 'Codebase Patterns' SECTION FIRST**
- Read PRD - find next task with `passes: false`
  - **Task Priority** (highest to lowest):
    1. Architecture/core abstractions
    2. Integration points
    3. Spikes/unknowns
    4. Standard features
    5. Polish/cleanup
- Check recent history (`git log --oneline -10`; if Graphite is available, also inspect stack state with `gt ls`)

### 2. Initialize Progress (if needed)

If progress.txt doesn't exist, create it:

```markdown
# Progress Log
PRD: <prdName from PRD>
Started: <YYYY-MM-DD>

## Codebase Patterns
<!-- Consolidate reusable patterns here -->

---
<!-- Task logs below - APPEND ONLY -->
```

### 3. Branch Setup

Extract `prdName` from PRD, then:
- Graphite: `gt create -am 'chore(<scope>): start <prdName>' <prdName>` when you want a new stacked branch with the initial commit included
- Git: `git checkout -b <prdName>` (or checkout if it already exists) when Graphite is unavailable or you need plain Git flow

### 4. Implement Task

Work on the single task until verification steps pass.

### 5. Feedback Loops (REQUIRED)

Before committing, run ALL applicable:
- Type checking
- Tests
- Linting
- Formatting

**Do NOT commit if any fail.** Fix issues first.

### 6. Update PRD

Set the task's `passes` field to `true` in the PRD file.

### 7. Update Progress

Append to progress.txt:

```markdown
## Task - [task.id]
- What was implemented
- Files changed
- **Learnings:** patterns, gotchas
```

If you discover a **reusable pattern**, also add to `## Codebase Patterns` at the TOP.

### 8. Commit

- Graphite: `gt modify --commit -am 'feat(<scope>): <description>'` for an existing tracked branch, or `gt create -am 'feat(<scope>): <description>' <prdName>/<task-id>` when creating a new stacked branch
- Git: `git add -A && git commit -m 'feat(<scope>): <description>'`

Suggested Graphite branch format: `<prdName>/<task-id>` (for example, `lib-relay-implementation/types-2`)

## Completion

If all tasks have `passes: true`, output:

```
<tasks>COMPLETE</tasks>
```

## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Patterns you establish will be copied. Corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

<user-request>
$ARGUMENTS
</user-request>
