---
description: Commit the current jj change and push its bookmark safely
---

Commit the current Jujutsu change and push exactly one bookmark to `origin`.

## Usage

Use one of these forms:

```text
/jj-commit-push <type>(<scope>): <message>
/jj-commit-push <bookmark-name> :: <type>(<scope>): <message>
```

If the current change already has exactly one local bookmark, reuse it.
If the current change has no local bookmark, require the `bookmark-name :: message` form.
If the current change has multiple local bookmarks, do not guess.

## Before Starting

First, invoke the skill tool to detect the VCS:

```text
skill({ name: 'vcs-detect' })
```

Continue only if the repo uses `jj`. In colocated repos, prefer `jj` for all mutating operations.

Invoke the skill tool to see how to operate within a colocated repo:

```text
skill({ name: 'vcs-detect' })
```

When needed, use context7 to fetch the latest documentation and best practices for using jujutsu, especially in a repo that uses `git` as well.

## Your Task

Work only on the current `@` change. Do not create branches. Do not create a PR. Do not push more than one bookmark. Do not use `git` for mutating operations.

### 1. Parse the user request

- If `$ARGUMENTS` contains `::`, treat the text before it as the bookmark name and the text after it as the Conventional Commit message.
- Otherwise, treat all of `$ARGUMENTS` as the Conventional Commit message and try to reuse the current local bookmark on `@`.
- Require a non-empty Conventional Commit message in the form `<type>(<scope>): <message>`.

### 2. Run preflight checks

Run these commands first:

```bash
jj git colocation status
jj status
jj diff --summary
jj log -r "@ | @-" --no-graph -T 'change_id.short() ++ " | " ++ description.first_line() ++ "\n"'
jj bookmark list -r @
jj bookmark list --conflicted
jj resolve --list
jj git fetch --remote origin
jj bookmark list -r @ --all-remotes
```

If there are blockers, stop and explain instead of mutating anything further if any of these are true:

- `jj status` reports conflicts or conflicted bookmarks
- `jj resolve --list` reports unresolved conflicts
- `jj bookmark list --conflicted` is non-empty
- more than one local bookmark points at `@` and the user did not explicitly specify which bookmark to use
- no local bookmark points at `@` and the user did not provide a bookmark name
- `jj git fetch --remote origin` reveals a bookmark conflict or any other push-blocking remote state

### 3. Choose the bookmark to push

- If the user explicitly provided a bookmark name, run `jj bookmark set <bookmark-name> -r @` and use that bookmark.
- Otherwise, if exactly one local bookmark points at `@`, use it as-is.
- Never use `jj bookmark set --allow-backwards`.

### 4. Commit and push

Run this sequence in order:

```bash
jj describe -m "<type>(<scope>): <message>"
jj git push --bookmark <bookmark-name> --remote origin
jj new
```

### 5. Verify the result

After the push, run:

```bash
jj status
jj log -r "@ | @-" --no-graph -T 'change_id.short() ++ " | " ++ description.first_line() ++ "\n"'
jj bookmark list -r @-
```

Confirm that:

- the described change was pushed successfully
- the pushed bookmark points to `@-`
- the working copy is now a fresh empty change at `@`

<user-request>
$ARGUMENTS
</user-request>
