---
name: actions-ci-address
description: Run one GitHub Actions CI remediation pass for the current PR/branch. Detect failing checks, inspect failed job logs, apply minimal fixes once, rerun flaky infrastructure failures once, and report what remains.
---

# Actions CI Address

Execute exactly one CI remediation pass for GitHub Actions failures.

## Inputs

- **PR number** (optional): If omitted, detect from current branch.
- **Run ID** (optional): If provided, analyze that run directly.

## Preconditions

Before doing anything else:

```bash
gh --version && gh auth status
```

If `gh` is missing or unauthenticated, stop and tell the user exactly what to run.

Before any VCS command, load `vcs-detect` and branch on its result:

- `git+graphite`: use Git for read-only repository inspection and Graphite for branch mutation/submission.
- `git`: use normal Git flows.
- `none`: stop and tell the user the directory is not version controlled.

If `git+graphite`, also check whether the current branch is Graphite-tracked before making mutations:

```bash
gt branch info
```

If `gt branch info` fails because the branch is untracked, stop instead of falling back to raw `git commit` + `git push`.

## One-Pass Workflow

1. Resolve target PR/branch:

```bash
git branch --show-current
gh pr view --json number,headRefName,url -q '{number: .number, branch: .headRefName, url: .url}'
```

- If PR exists, use it.
- If PR is not found, continue in branch-only mode.

2. Refresh CI state once:

- If in PR mode, wait once for checks:

```bash
gh pr checks <PR_NUMBER> --watch
```

3. Identify failing checks/jobs:

- PR mode:

```bash
gh pr checks <PR_NUMBER> --json name,state,bucket,link
```

- Branch mode:

```bash
gh run list --branch <BRANCH> --status failure --limit 5 --json databaseId,workflowName,displayTitle,url,headBranch
```

4. For each failed check, gather logs in a bounded way:

- Extract `RUN_ID` and (if present) `JOB_ID` from the check URL.
- If `JOB_ID` is available, download per-job logs to a temp file:

```bash
gh api repos/{owner}/{repo}/actions/jobs/<JOB_ID>/logs > "$TMPDIR/ci-job-<JOB_ID>.log"
```

- If only `RUN_ID` is available, inspect failed steps:

```bash
gh run view <RUN_ID> --log-failed
```

- Prefer actionable lines first (`##[error]`, `Error`, `FAIL`, `AssertionError`, `error TS`, `eslint`, `mypy`).

5. Classify each failure:

- **Actionable (code/config/test)**: deterministic issue requiring repo changes.
- **Rerun-only (infra/flake)**: network timeouts, 502/CDN issues, runner cancellation, transient service failures.
- **Already green**: no longer failing by the time logs are checked.

Use `references/failure-signals.md` for common patterns.

6. Apply fixes for actionable failures once:

- Implement the smallest targeted fix. However, the failure is something fundamental where a small fix would be a band-aid fix, stop here and give the analysis to the user.
- Run targeted local validation for the failing surface.

7. For rerun-only failures, rerun once:

```bash
gh run rerun <RUN_ID> --failed
```

8. If files changed, commit once and publish once using the detected VCS flow:

- Commit message style:

```text
fix(ci): address failing GitHub Actions checks
```

- `git+graphite`:

```bash
git add <intended-files>
gt modify --commit -am "fix(ci): address failing GitHub Actions checks"
gt submit --stack
```

- `git`:

```bash
git add <intended-files>
git commit -m "fix(ci): address failing GitHub Actions checks"
git push
```

- Do not use raw `git commit` + `git push` when Graphite is available and the current branch is Graphite-tracked.
- If Graphite is available but the current branch is untracked, stop and report that the branch must be tracked or handled with a Graphite-aware flow before continuing.

9. Stop after this pass.

## Reporting

Return concise results in this format:

```text
Actions CI Address complete.
  PR/Branch:      <pr-or-branch>
  Analyzed:       <N failed checks/jobs>
  Fixed:          <N actionable failures>
  Rerun-only:     <N infrastructure/flaky failures>
  Remaining:      <N>
```

If anything remains, list each item as:

- `<workflow/job>` — `<reason still failing or pending>`
