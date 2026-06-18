---
description: Run a lightweight adversarial code review pass
argument-hint: "[uncommitted | base:<branch> | commit:<sha> | pr:<number>]"
---

Run one report-only adversarial review pass. Do not edit files, resolve comments,
trigger remote reviews, or install tools unless the user explicitly asks.

First, invoke the VCS detection skill:

```text
skill({ name: 'vcs-detect' })
```

## Scope

Use `$ARGUMENTS` to choose the review target:

- `uncommitted`: review staged, unstaged, and untracked local changes.
- `base:<branch>`: review the current branch against the named base branch.
- `commit:<sha>`: review one commit.
- `pr:<number>`: review the PR diff; use Greptile only if the user explicitly asks for Greptile.

If no scope is provided, run:

```bash
git status --short --branch
git diff --name-only
git diff --cached --name-only
```

Then choose `uncommitted` when local changes exist. If the worktree is clean and
the branch has commits ahead of its base, choose `base:<default-branch>`. If the
target is still ambiguous, ask one short clarification question.

## Reviewer

Prefer Codex CLI for local review because it can review uncommitted diffs. Run
`command -v codex` first and run at most one Codex review pass.

```bash
codex review --uncommitted "Adversarially review this diff. Only report concrete, high-signal issues: correctness bugs, security vulnerabilities, data loss, race conditions, API contract breaks, migration/deploy-window failures, and missing tests for risky behavior. Ignore style, naming, formatting, and speculative maintainability comments. For every finding, include the execution path or reproduction scenario."
```

For branch or commit scopes, use the matching Codex review form:

```bash
codex review --base <branch> "Adversarially review this diff. Only report concrete, high-signal issues."
codex review --commit <sha> "Adversarially review this commit. Only report concrete, high-signal issues."
```

If `codex` is unavailable, do not install it. Review the relevant `git diff`
directly with the same rubric, include untracked files shown by `git status`, and
mention that the external reviewer was not run.

Use Greptile only for PR or committed-branch review when explicitly requested.
Do not use this command to address existing Greptile comments; route that to
`/greptile-address` instead.

## Output

Report findings first, ordered by severity. For each finding include:

- `file:line`
- the concrete failure mode
- the execution path or reproduction scenario
- the smallest safe fix direction
- whether a test is needed

If no concrete issues are found, say so directly and list any review scope or
tooling limitations.

<user-request>
$ARGUMENTS
</user-request>
