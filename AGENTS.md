# AGENTS.md

## Scope and Purpose

This repository stores macOS dotfiles and related shell/editor tooling. These instructions govern all agent edits in `/Users/khuynh/dev/macOS-dots` unless a nested `AGENTS.md` provides narrower rules.

## Repository Scope

- Scope: repository root and all tracked files.
- Applies to: editing, verification, cleanup, and documentation updates.
- Nested overrides are preferred for app-specific rules (for example `~/.config` or package-specific directories).

## Core Operating Principles

- Non-destructive by default.
- Treat every edit as a machine-affecting configuration change.
- Keep changes minimal and tightly scoped to the request.
- Prefer deterministic, auditable edits over command pipelines or broad rewrites.

## Before Editing

1. Confirm the request scope and affected paths.
2. Capture the workspace state:
   - `git status --short --branch`
   - `git diff --name-only`
3. Confirm target file style and local conventions by reading neighboring files.
4. For shell files, confirm expected interpreter (`bash` vs `zsh`) before editing.

## Command and Script Safety Rules

- Use existing tooling for file operations when available.
- Avoid destructive commands unless the user explicitly requests them:
  - `rm -rf`, `git clean`, hard resets, or branch rewrites
- Do not edit files outside repository root unless explicitly authorized.
- Do not make network bootstrap or package-manager install/remove calls without explicit approval.
- Never change secrets, credentials, API keys, or password stores.
- If a task needs unrelated settings or domains, request scope confirmation first.

## Validation Requirements

- Run lightweight checks on every touched file type:
  - `*.zshrc`, `*.zsh`, fish/zsh snippets: `zsh -n <file>`
  - `*.sh` launch scripts: `bash -n <file>`
  - JSON/TOML/YAML: parse check with language-native tooling where available
  - Shell lint when practical: `shellcheck <file>`
- Every edit must be reviewed manually before completion:
  - `git diff`
  - `git diff --name-only` to confirm only intended files changed

## Task Execution Pattern

- Keep edits one-file-first when possible.
- Use `Edit` for focused changes.
- Use `Write` only for full-file replacement.
- Add comments only for non-obvious logic.
- Prefer no-op checks and idempotent verification steps (for example dry-run commands).

## Change Scope Guidance

- Avoid mixing unrelated domains in one change.
- Group edits by purpose.
- Record rationale for each modified file.
- If a setup step is risky (service restart, permission edits, global tool install), split the change and verify incrementally.

## Repo Setup and Validation Checkpoints

When working on macOS-dots-specific tasks, use this standard sequence:

- `cd ~/.dotfiles` (or repo root) and confirm target files exist.
- If user-facing setup work is involved, validate:
  - symlinks expected by README are created,
  - shell startup points to repo-managed config files,
  - tmux/yabai/skhd changes are confined to config files.
- Expected command outcomes:
  - `git status --short` shows only intended files,
  - syntax checks above pass,
  - no unintended deletions or moved files.

## Prohibited Operations (Hard Rules)

- Never remove user data.
- Never run global `rm -rf` or `git clean`.
- Never auto-install/reconfigure system services unless user asks.
- Never commit unless the user explicitly requests a commit.
- Never expose secrets in logs, commits, summaries, or command output.

## Commit and Handoff Rules

- This repository defaults to no commit unless explicitly requested.
- If a commit is requested:
  - verify diff scope,
  - run required checks,
  - provide concise summary and rollback notes.

## Maintenance Notes

- If local behavior diverges from this file, update this guide before or together with the workflow change.
- If nested directories gain dedicated rules later, add a local override file rather than broadening this one.
