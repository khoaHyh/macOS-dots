---
name: worktrees
description: >
  Local Git worktrees on this Mac under ~/dev/worktrees. Use when creating,
  reusing, listing, or removing a worktree, or before editing a canonical
  ~/dev/<repo> checkout.
---

# Git worktrees

This layout is for **local** agents on this Mac. Do not create it on a Cursor
cloud VM.

```text
~/dev/<repo>                              # canonical; stays on main
~/dev/worktrees/<repo-slug>__<branch-slug>
```

Example: `~/dev/worktrees/platform__scheduling-eng-292-selected-crew-booking-tracer`

Keep `~/dev/<repo>` on `main`. Do development in the linked worktree. Use
another path only when the human asks.

One task uses one linked worktree. Local agents working on that task share it.

Cloud isolation (`.cursor/worktrees`, `~/.cursor/cursorfs-clone/...`) is a
different layout. After `cursorfs-clone`, call `move_agent_to_cloned_root`.
To resume locally, move back to the matching `~/dev/worktrees/...` path.

## Create or reuse a worktree

1. Create `~/dev/worktrees` if it is missing.
2. Inspect any matching path. Reuse it when it is already on `<branch>` and task ownership is established by the user-selected path, current task context, or its handoff. Account for every existing change as shared task state; scoped in-progress changes are not grounds for a second checkout. Stop when ownership is ambiguous.
3. Only when no matching path exists, create one from `~/dev/<repo>` (leave it on `main`):

```bash
git worktree add -b <branch> ~/dev/worktrees/<repo-slug>__<branch-slug>
```

Omit `-b` when `<branch>` already exists.

4. Enter the worktree. Then `gt track` / `gt create` as needed.

```bash
git status --short --branch
```

Creation or reuse is complete when `git worktree list` contains the path and
its expected branch, and every staged, unstaged, and untracked change is
accounted for. A newly created worktree starts clean.

## Remove a worktree

1. Account for every staged, unstaged, and untracked change:

```bash
git -C ~/dev/worktrees/<repo-slug>__<branch-slug> status --short --branch
```

2. Remove the checkout from the canonical repo:

```bash
git -C ~/dev/<repo> worktree remove ~/dev/worktrees/<repo-slug>__<branch-slug>
```

3. Delete the local branch only when its commits are integrated or
   intentionally discarded:

```bash
git -C ~/dev/<repo> branch -d <branch>
```

Removal is complete when the path is absent from both the filesystem and
`git -C ~/dev/<repo> worktree list`.
