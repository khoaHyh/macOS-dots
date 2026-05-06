---
description: Create/update root and justified nested AGENTS.md guidance
---

Create or update a root `AGENTS.md` and only those nested `AGENTS.md` files whose subtrees have materially different agent guidance. Optionally create a symlinked `CLAUDE.md` next to each created or updated `AGENTS.md`, but never overwrite an existing real `CLAUDE.md`.

The goal is compact instruction files that help future OpenCode sessions avoid mistakes and ramp up quickly. Every line should answer: "Would an agent likely miss this without help?" If not, leave it out.

User-provided focus or constraints (honor these):
$ARGUMENTS

## Evidence gate

Apply these findings from AGENTS.md studies, including arXiv:2602.11988 and arXiv:2601.20404:

- Broad LLM-generated context files can reduce success and increase cost.
- Context files tend to trigger more exploration, testing, and tool use.
- Developer-written guidance helps most when it is minimal, specific, and actionable.
- Repository overviews are often redundant and do not reliably improve file discovery.
- Concise root `AGENTS.md` files can improve efficiency when they encode actionable project context.

Do not create or expand an `AGENTS.md` unless it adds high-signal guidance that is not already obvious from filenames, scripts, or existing docs.

If the user explicitly asks to refresh the research, fetch the latest paper/docs before writing.

## How to investigate

Read the highest-value sources first:

- `README*`, root manifests, workspace config, lockfiles
- build, test, lint, formatter, typecheck, and codegen config
- CI workflows and pre-commit / task runner config
- existing instruction files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`)
- repo-local OpenCode config such as `opencode.json`

If architecture is still unclear after reading config and docs, inspect a small number of representative code files to find the real entrypoints, package boundaries, and execution flow. Prefer reading the files that explain how the system is wired together over random leaf files.

Prefer executable sources of truth over prose. If docs conflict with config or scripts, trust the executable source and only keep what you can verify.

## Hierarchy planning

Before writing files, build a candidate `AGENTS.md` map.

Create or update a nested `AGENTS.md` only for a subtree that has at least one of:

- its own manifest or task runner (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `Justfile`, etc.)
- different build, test, lint, format, deploy, or verification commands
- different language/framework conventions from the repo root
- generated files, migrations, fixtures, secrets, hardware, or external-service risks specific to that subtree
- an existing nested instruction file worth preserving or correcting
- a nested README/config that establishes a real subproject boundary

Do not create nested files merely because a directory exists.

Skip generated/vendor/cache/build directories such as `.git`, `node_modules`, `dist`, `build`, `target`, `coverage`, `.next`, `.turbo`, vendored dependencies, lockfile-only directories, and archive/output folders.

Use this map internally and include it in the final report:

| path | action | why this boundary exists | evidence read | notes |
| --- | --- | --- | --- | --- |

## What to extract

Look for the highest-signal facts for an agent working in each target scope:

- exact developer commands, especially non-obvious ones
- how to run a single test, a single package, or a focused verification step
- required command order when it matters, such as `lint -> typecheck -> test`
- monorepo or multi-package boundaries, ownership of major directories, and the real app/library entrypoints
- framework or toolchain quirks: generated code, migrations, codegen, build artifacts, special env loading, dev servers, infra deploy flow
- repo-specific style or workflow conventions that differ from defaults
- testing quirks: fixtures, integration test prerequisites, snapshot workflows, required services, flaky or expensive suites
- important constraints from existing instruction files worth preserving

Good `AGENTS.md` content is usually hard-earned context that took reading multiple files to infer.

## Questions

Only ask the user questions if the repo cannot answer something important and the answer would materially change which files are written or what safety guidance they contain. Use the `question` tool for one short batch at most.

Good questions:

- undocumented team conventions
- branch / PR / release expectations
- missing setup or test prerequisites that are known but not written down
- whether to replace a real `CLAUDE.md` with a symlink when a compatibility conflict exists

Do not ask about anything the repo already makes clear.

## Writing rules

Include only high-signal, repo-specific guidance such as:

- exact commands and shortcuts the agent would otherwise guess wrong
- architecture notes that are not obvious from filenames
- conventions that differ from language or framework defaults
- setup requirements, environment quirks, and operational gotchas
- references to existing instruction sources that matter

Exclude:

- generic software advice
- long tutorials or exhaustive file trees
- obvious language conventions
- speculative claims or anything you could not verify
- content better stored in another file referenced via `opencode.json` `instructions`

When in doubt, omit.

Prefer short sections and bullets. If the repo is simple, keep the file simple. If the repo is large, summarize the few structural facts that actually change how an agent should work.

If an `AGENTS.md` already exists at a target path, improve it in place rather than rewriting blindly. Preserve verified useful guidance, delete fluff or stale claims, and reconcile it with the current codebase.

## Root vs nested content contract

Root `AGENTS.md`:

- Contains repository-wide safety rules, workflow rules, and common validation guidance.
- Avoids detailed per-subtree instructions unless they apply globally.

Nested `AGENTS.md`:

- Starts with a clear scope statement.
- Includes a short ancestor note with the relative path to the nearest ancestor `AGENTS.md`, for example: `Also follow ../AGENTS.md; read it before edits if it is not already in context.`
- Lists only local differences, stricter rules, or subtree-specific commands.
- Must not weaken ancestor safety, security, or destructive-operation rules.
- Must be self-contained enough that an agent starting in this subtree will not miss critical constraints.

Recommended nested opening:

`These instructions apply to <path>/ and inherit <relative-path-to-ancestor>/AGENTS.md. Local rules below override only where they are stricter or more specific.`

## CLAUDE.md compatibility symlinks

For each created or updated `AGENTS.md`:

- If `CLAUDE.md` does not exist next to it, create a relative symlink `CLAUDE.md -> AGENTS.md`.
- If `CLAUDE.md` is already a symlink to `AGENTS.md`, leave it alone.
- If `CLAUDE.md` exists as a real file or points elsewhere, do not overwrite it; report the conflict and ask before changing it.

## Final report

After writing, report:

- files created, updated, skipped, and why
- the candidate `AGENTS.md` map
- any `CLAUDE.md` symlinks created or conflicts left unresolved
- validation commands run and any checks intentionally skipped
- a concise diff summary
