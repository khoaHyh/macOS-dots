---
description: Commit the current branch with Graphite and submit it safely
agent: Scuba
---

Commit the current Git branch with Graphite and submit the current branch or stack for review.

## Usage

Use one of these forms:

```text
/gt-commit-submit <type>(<scope>): <message>
/gt-commit-submit <branch-name> :: <type>(<scope>): <message>
```

If the current branch is already Graphite-tracked, reuse it and update it with `gt modify`.
If the current branch is not Graphite-tracked and the user provides `branch-name :: message`, create a new tracked branch with `gt create`.
If the current branch is not Graphite-tracked and no branch name is provided, require the `branch-name :: message` form.

## Before Starting

First, invoke the skill tool to detect the VCS:

```text
skill({ name: 'vcs-detect' })
```

Continue only if the repo is inside Git and `gt` is available.

Load the Graphite workflow skill:

```text
skill({ name: 'graphite' })
```

When needed, use context7 to fetch the latest Graphite documentation and best practices.

## Your Task

Work only on the current branch. Do not split the work into multiple PRs unless the user asked for a stack. Use Git for staging and Graphite for tracked-branch and PR submission steps.

### 1. Parse the user request

- If `$ARGUMENTS` contains `::`, treat the text before it as the branch name and the text after it as the Conventional Commit message.
- Otherwise, treat all of `$ARGUMENTS` as the Conventional Commit message and try to reuse the current tracked branch.
- Require a non-empty Conventional Commit message in the form `<type>(<scope>): <message>`.

### 2. Run preflight checks

Run these commands first:

```bash
git status --short --branch
git diff --stat
git log --oneline -10
gt branch info
gt ls
```

If there are blockers, stop and explain instead of mutating anything further if any of these are true:

- `git status` reports merge conflicts or an unresolved rebase
- `gt branch info` fails because the branch is untracked and the user did not provide a branch name
- the working tree includes unrelated changes you cannot safely stage around
- Graphite reports a stack-parent problem that must be fixed before submission

### 3. Choose whether to create or modify

- If the user explicitly provided a branch name, stage the intended files and run `gt create -am "<type>(<scope>): <message>" <branch-name>`.
- Otherwise, if `gt branch info` succeeds for the current branch, stage the intended files and run `gt modify --commit -am "<type>(<scope>): <message>"`.
- Do not guess a branch name when Graphite says the current branch is untracked.

### 4. Submit for review

Run this sequence in order:

```bash
gt submit
```

If the user explicitly asked to submit the full stack, use:

```bash
gt submit --stack
```

### 5. Verify the result

After submission, run:

```bash
git status --short --branch
gt ls
```

Confirm that:

- the branch was committed with the requested Conventional Commit message
- the current branch or stack was submitted successfully
- the working tree is clean after the Graphite operation unless there are intentional remaining edits

<user-request>
$ARGUMENTS
</user-request>
