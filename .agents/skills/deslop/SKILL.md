---
name: deslop
description: Run a lean pre-commit deslop pass on a nearly finished change. Use after the code is functionally correct and before commit, push, or PR to fan out 3 focused review passes across repo standards, technical boundaries, and simplicity, then apply only the small worthwhile fixes.
---

# Deslop

Run a bounded review-readiness pass on code that already works. Optimize for a smaller, clearer diff, not for maximal critique volume.

## Inputs

- Optional `base:<ref>` token to set the diff base explicitly.
- Optional `mode:report-only` token to review without editing.
- Everything else in `$ARGUMENTS` is extra user context.

## When To Stop Early

Do not use this skill as a substitute for understanding the task.

Stop and tell the user what is blocking the pass if any of these are true:

- the change is still functionally broken or not yet understood
- the worktree is in the middle of a merge, rebase, or similar VCS conflict state
- there is no diff to review
- the right next step is design, planning, or debugging rather than cleanup

## Context Bundle

Collect only the context needed to review the changed area well:

- repo root `AGENTS.md`
- the changed files and enough nearby context to understand them
- neighboring examples when editing prompt-like surfaces such as `opencode/command/`, `opencode/skills/`, `.agents/skills/`, or `opencode/agents/`
- `opencode/docs/adr/0001-v1-kernel-contract.md` whenever the diff touches the harness surface under `opencode/` or `.agents/skills/`

Do not read the whole repository. Build a tight bundle for the changed area.

## Reviewers

Launch exactly 3 review passes in parallel as soon as the context bundle is ready.

### 1. Repo Standards

Use `project-standards-reviewer`.

Focus:

- `AGENTS.md` conformance
- config-first OpenCode layout expectations
- correct placement and naming for commands, skills, agents, and docs
- frontmatter quality and trigger clarity
- drift toward unnecessary harness complexity

### 2. Technical Boundary Reviewer

Pick exactly one reviewer for the current diff:

- `agent-native-reviewer` if the diff touches agent-facing surfaces such as `opencode/agents/`, `opencode/command/`, `opencode/skills/`, `.agents/skills/`, prompts, MCP/tool instructions, or any workflow where a human can do something but an agent might not be able to
- `kieran-typescript-reviewer` for TypeScript or JavaScript heavy diffs
- `kieran-python-reviewer` for Python heavy diffs
- `kieran-rails-reviewer` for Rails or Ruby app diffs
- `correctness-reviewer` as the fallback

Focus:

- type and source-of-truth drift
- broken contracts or ambiguous boundaries
- redundant validation inside trusted repo-owned flows
- accidental behavior regressions hidden inside cleanup

### 3. Simplicity

Use `code-simplicity-reviewer`.

Focus:

- wrapper creep
- prompt bloat
- dead helpers, dead branches, placeholders, and debug leftovers
- abstractions or indirection that do not clearly earn their keep
- places where the same result can be expressed more directly

## Workflow

1. Before any VCS command, load `vcs-detect` and branch on its result.
2. Parse `$ARGUMENTS` for `base:<ref>` and `mode:report-only`. Treat the rest as extra user context.
3. Resolve the diff scope.
   - Prefer `base:<ref>` when provided.
   - Otherwise compare the current work against the default branch merge-base.
4. Collect the context bundle.
5. Dispatch the 3 review passes in parallel. Give each the same context bundle plus its assigned review vector. Require findings first, ordered by severity, with file references.
6. While the reviewers run, inspect the diff yourself for obvious local slop:
   - placeholder text
   - mismatched frontmatter or command usage text
   - stale example files or dead references
   - duplicated prompt sections
   - needless casts, wrappers, or re-validation inside trusted boundaries
7. Run only narrow validation that matches the changed files. Prefer syntax and local consistency checks over broad test suites when deslop is being used as a final tightening pass.
8. Synthesize the reviewer output into these sections:
   - `Keep`
   - `Fix Now`
   - `Skip`
   - `Residual Risk`
9. If not in `mode:report-only`, apply only the local, deterministic, in-scope fixes.
10. Re-run the narrowest affected validation immediately after edits.

## What To Fix Automatically

Apply feedback immediately when it is clearly correct and keeps the diff small.

Prioritize:

- frontmatter mistakes, weak trigger descriptions, or broken command wording
- wrong file placement between reusable skills and project-local OpenCode surfaces
- stale scaffold files, placeholder text, dead helpers, dead references, and debug leftovers
- duplicated or overly indirect prompt/skill structure that can be simplified locally
- narrow type or boundary fixes that remove ambiguity without changing intended behavior
- agent-parity gaps on agent-facing surfaces when the capability already exists for a human

## What To Leave Alone

Do not auto-apply feedback when it is speculative, conflicting, behavior-changing, or larger than the current cleanup pass.

Leave it in `Skip` or `Residual Risk` when:

- reviewers disagree on the right fix
- the change would widen scope materially
- the feedback is architectural rather than cleanup-oriented
- the safer move is to preserve a stable working area

## Escalation

Escalate instead of guessing when the diff is too broad for a lean deslop pass.

Use `ce:review` or `reviewer` when any of these are true:

- the diff crosses many files or domains
- the change touches risky boundaries such as auth, permissions, external APIs, or data mutation
- the 3 reviewers disagree in a way that affects behavior or architecture
- the cleanup pass uncovers concerns that are larger than pre-commit tightening

Prefer `ce:review` when you want broader compound-engineering coverage. Prefer `reviewer` when you need a single higher-rigor adjudication pass.

## Output

Return findings first, then the short outcome summary.

Use this shape:

```text
Keep
- ...

Fix Now
- ...

Skip
- ...

Residual Risk
- ...
```

If fixes were applied, finish with a short note naming:

- what changed
- what was intentionally left alone
- what validation ran

## Stop Rules

- Do not turn a cleanup pass into a refactor.
- Do not rewrite stable prompts or commands just to make them prettier.
- Do not add helpers, files, or abstractions unless they clearly reduce complexity.
- Do not auto-apply every reviewer suggestion.
