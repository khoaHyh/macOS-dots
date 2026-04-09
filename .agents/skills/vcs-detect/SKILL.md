---
name: vcs-detect
description: Detect whether the current project uses git for version control and whether Graphite (`gt`) is available for stacked PR workflows. Run this BEFORE any VCS command to use the right tool.
---

# VCS Detection Skill

Detect whether the current directory is inside a Git repository before running VCS commands. If Graphite is installed, prefer `gt` for stacked PR workflows while continuing to use Git as the underlying VCS.

## Why This Matters

- Graphite is a workflow layer on top of Git, not a separate VCS
- Repos should still be detected with `git rev-parse --show-toplevel`
- Stacked branch operations are often better expressed with `gt` than raw Git

## Detection Logic

Use Git to detect the repository. Then optionally check whether `gt` is available.

**Priority order:**

1. `git rev-parse --show-toplevel` succeeds -> git repo
2. `command -v gt` succeeds -> Graphite is available for stack workflows
3. Git fails -> no VCS

## Detection Command

```bash
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  if command -v gt >/dev/null 2>&1; then
    echo "git+graphite"
  else
    echo "git"
  fi
else
  echo "none"
fi
```

## Command Mappings

| Operation | Git default | Graphite when available |
|-----------|-------------|-------------------------|
| Status | `git status` | `git status` |
| Log | `git log --oneline -10` | `gt ls` for stack shape, `git log --oneline -10` for commits |
| Diff | `git diff` | `git diff` |
| Create branch | `git checkout -b <name>` | `gt create -am "<type>(<scope>): <description>" [branch-name]` |
| Update current branch | `git add -A && git commit -m "<type>(<scope>): <description>"` | `gt modify -a` or `gt modify --commit -am "<type>(<scope>): <description>"` |
| Submit PRs | `gh pr create` | `gt submit` / `gt submit --stack` |
| Sync with trunk | `git fetch && git rebase origin/main` | `gt sync` or `gt restack` |
| Set stack parent | N/A | `gt track --parent <branch>` |

## Usage

Before any VCS operation:

1. Run the detection command
2. If the result is `git+graphite`, use Git for repository state and `gt` for stacked-PR operations
3. If the result is `git`, use regular Git commands
4. If the result is `none`, warn the user the directory is not version controlled

## Example Integration

```
User: Show me the git log
Agent: [Runs detection] -> Result: git+graphite
Agent: [Runs `gt ls` to inspect the stack, then `git log --oneline -10` for commit history]
```
