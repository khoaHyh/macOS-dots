---
name: greptile-address
description: Run one Greptile review-address pass on a pull request. Trigger or wait for checks once, analyze Greptile comments once, fix actionable feedback once, resolve addressed threads, and report what remains. Use when the user wants a one-shot version of greploop.
---

# Greptile Address

Execute exactly one Greptile feedback pass for a PR. Do not run iterative retries.

## Inputs

- **PR number** (optional): If omitted, detect the PR from the current branch.

## Preconditions

Before any VCS command, load `vcs-detect` and branch on its result:

- `git+graphite`: use Git for read-only repository inspection and Graphite for branch mutation/submission.
- `git`: use normal Git flows.
- `none`: stop and tell the user the directory is not version controlled.

If `git+graphite`, check whether the current branch is Graphite-tracked before making mutations:

```bash
gt branch info
```

If `gt branch info` fails because the branch is untracked, stop instead of falling back to raw `git commit` + `git push`.

## One-Pass Workflow

1. Identify the PR and branch:

```bash
gh pr view --json number,headRefName -q '{number: .number, branch: .headRefName}'
```

2. Ensure checks are current once:
   - If local commits are not published yet, publish them using the detected VCS flow.
   - Wait for checks once:

```bash
gh pr checks <PR_NUMBER> --watch
```

3. Fetch the latest Greptile review and inline comments:

```bash
gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/reviews
gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/comments
```

4. Read only the latest Greptile review (`greptile-apps[bot]` or `greptile-apps-staging[bot]`) and classify open comments as:
   - **Actionable**: needs code or test changes
   - **Informational**: no code change required
   - **Already addressed**: covered by newer commits

5. Apply fixes for actionable comments once.

6. Resolve threads that are addressed or informational using queries from `references/graphql-queries.md`.

7. If files changed, create one commit and publish once using the detected VCS flow.

- `git+graphite`:

```bash
git add <intended-files>
gt modify --commit -am "fix(review): address Greptile feedback"
gt submit --stack
```

- `git`:

```bash
git add <intended-files>
git commit -m "fix(review): address Greptile feedback"
git push
```

- Do not use raw `git commit` + `git push` when Graphite is available and the current branch is Graphite-tracked.
- If Graphite is available but the current branch is untracked, stop and report that the branch must be tracked or handled with a Graphite-aware flow before continuing.

8. Stop. Do not trigger a second Greptile run unless the user explicitly asks.

## Reporting

Return a concise result summary with:

- PR number and branch
- Greptile confidence score (if present)
- Actionable comments fixed
- Threads resolved
- Remaining unresolved comments

Use this format:

```text
Greptile Address complete.
  Confidence:    X/5 (if available)
  Fixed:         N comments
  Resolved:      N threads
  Remaining:     N
```

If anything remains unresolved, list file + short reason for each remaining comment.

## Resource

- `references/graphql-queries.md` - GraphQL snippets for listing and resolving review threads.
