---
description: Generate hierarchical AGENTS.md files with study-gated, minimal guidance
agent: Scuba
---

Generate hierarchical `AGENTS.md` files (root + complexity-scored subdirectories) and create a symlinked `CLAUDE.md` next to each generated or updated `AGENTS.md`.

## Usage

```text
/init-deep
/init-deep --create-new
/init-deep --max-depth=2
```

- Default mode is update-in-place: modify existing `AGENTS.md` files and add new ones where warranted.
- `--create-new` means: read all existing `AGENTS.md` and `CLAUDE.md` first, then regenerate hierarchy from scratch.
- Default max depth is `3` when `--max-depth` is omitted.

## Hard Requirements

1) Use TodoWrite for all phases and update status in real time.
2) Start background `explore` agents immediately (parallel fan-out), then continue local discovery in parallel.
3) Always read existing agent context files before deciding placements, including in `--create-new` mode.
4) Root `AGENTS.md` is always present.
5) For every directory containing `AGENTS.md`, ensure `CLAUDE.md` is a symlink to `AGENTS.md`.
6) Apply findings from arXiv `2602.11988v1` before generating any content.

## Study Gate (Mandatory, Before Discovery)

Before writing any `AGENTS.md`, fetch and study:

`https://arxiv.org/html/2602.11988v1`

Extract and explicitly apply these findings while drafting files:

- LLM-generated context files often reduce success and increase cost.
- Context files tend to trigger broader exploration and more tool usage.
- Human-written files are only marginally better, and still increase cost.
- Minimal, high-signal, task-relevant requirements are preferred.
- Avoid redundant overviews and generic advice.

If the generated content does not reflect these findings, revise before file writes.

## Todo Setup

Create and maintain this list throughout execution:

- discovery: Fire explore probes + local structural analysis + read existing files
- scoring: Score directories and choose `AGENTS.md` locations
- generate: Generate/update `AGENTS.md` and create `CLAUDE.md` symlinks
- review: Deduplicate, trim, validate, and emit final report

Keep exactly one item `in_progress` at a time.

## Phase 1: Discovery + Analysis (Concurrent)

Mark `discovery` as `in_progress`.

### A) Launch parallel explore probes immediately

Run these in parallel using the `task` tool with `subagent_type="explore"`:

- Project structure: predict standard layout and report deviations only.
- Entry points: find main entry paths and non-standard organization.
- Conventions: detect config/tooling conventions and local rules.
- Anti-patterns: find explicit do-not rules (`DO NOT`, `NEVER`, `ALWAYS`, `DEPRECATED`).
- Build/CI: detect workflows and repository-specific build patterns.
- Test patterns: detect test structure, commands, and unusual practices.

### B) Dynamic additional fan-out based on project scale

Measure scale (exclude `node_modules`, `.git`, common build dirs). Compute:

- total files
- total lines in code files
- max directory depth
- count of files over 500 lines
- monorepo package/workspace count
- language count

Spawn additional explore probes using this policy:

- +1 explore probe per 100 files above 100
- +1 explore probe per 10k lines above 10k
- +2 probes if max depth >= 4
- +1 probe if large files > 10
- +1 probe per workspace/package in monorepo
- +1 probe per language beyond the first

Keep probes non-overlapping (hotspots, deep modules, shared utilities, boundaries, etc.).

### C) Main-session analysis while probes run

In parallel with probes:

- Perform structural analysis (dir depth distribution, file density, extension concentration).
- Locate all existing `AGENTS.md` and `CLAUDE.md`.
- Read all existing `AGENTS.md` and capture constraints, conventions, anti-patterns.
- If `--create-new`: preserve insights first, then remove old generated hierarchy after reading.
- If symbol tooling is available, collect codemap signals (symbols, exports, references).
- If symbol tooling is unavailable, use grep-based symbol density heuristics.

### D) Merge findings

Collect all probe outputs and merge with local analysis into one location model.

Mark `discovery` as `completed`.

## Phase 2: Scoring + Placement Decision

Mark `scoring` as `in_progress`.

Use this matrix:

- File count (3x), high if >20
- Subdir count (2x), high if >5
- Code ratio (2x), high if >70%
- Unique local patterns/config (1x)
- Module boundary signals (2x)
- Symbol density (2x), high if >30 symbols
- Export count (2x), high if >10 exports
- Reference centrality (3x), high if >20 refs

Decision rules:

- `.` root: always create/update
- Score >15: create/update `AGENTS.md`
- Score 8-15: create/update only if domain is distinct
- Score <8: skip (covered by parent)

Produce:

`AGENTS_LOCATIONS = [{ path, type, score, reason }]`

Mark `scoring` as `completed`.

## Phase 3: Generate Files

Mark `generate` as `in_progress`.

### File write rule

- If target `AGENTS.md` exists, use `Edit`.
- If target `AGENTS.md` does not exist, use `Write`.
- Never overwrite an existing file with `Write`.

### Content strategy (study-driven)

Given arXiv findings, optimize for minimal high-value context:

- Keep only repository-specific instructions that materially change agent behavior.
- Prefer concrete commands, boundaries, and gotchas.
- Avoid broad directory tours unless they are non-obvious and actionable.
- Remove generic best practices that apply to all repositories.
- Keep child files focused on local deltas from parent instructions.

### Root `AGENTS.md`

Generate first with sections:

- Overview (1-2 lines)
- Structure (only non-obvious layout)
- Where to look (task -> path mapping)
- Conventions (project-specific deviations)
- Anti-patterns (explicitly forbidden patterns)
- Commands (dev/test/build)
- Notes (critical gotchas)

Size target: 50-150 lines.

### Subdirectory `AGENTS.md` files

Generate in parallel for non-root locations.

Each child file:

- 30-80 lines
- never duplicates parent guidance
- includes only local conventions/constraints
- omits sections with no local signal

### CLAUDE symlink for each AGENTS file

For every directory that now has `AGENTS.md`, ensure `CLAUDE.md` symlinks to it.

Safe policy:

- If `CLAUDE.md` is already a symlink to `AGENTS.md`, keep it.
- If `CLAUDE.md` exists as a non-symlink file, back it up (`CLAUDE.md.bak.<timestamp>`), then create symlink.
- If `CLAUDE.md` is a symlink with wrong target, repoint it to `AGENTS.md`.

Recommended commands per directory:

```bash
if [ -e "CLAUDE.md" ] && [ ! -L "CLAUDE.md" ]; then
  mv "CLAUDE.md" "CLAUDE.md.bak.$(date +%Y%m%d%H%M%S)"
fi
ln -sfn "AGENTS.md" "CLAUDE.md"
```

Mark `generate` as `completed`.

## Phase 4: Review + Deduplicate

Mark `review` as `in_progress`.

For each generated/updated file:

- remove generic advice
- remove parent duplicates
- verify concise, telegraphic style
- verify section usefulness (drop empty/obvious sections)
- verify line-budget constraints

For each `CLAUDE.md`:

- verify it is a symlink
- verify target resolves to sibling `AGENTS.md`

Mark `review` as `completed`.

## Final Report Format

```text
=== init-deep Complete ===

Mode: {update | create-new}
Study: arXiv 2602.11988v1 applied

Files:
  [OK] ./AGENTS.md (root, {N} lines)
  [OK] ./CLAUDE.md -> AGENTS.md
  [OK] ./path/AGENTS.md ({N} lines)
  [OK] ./path/CLAUDE.md -> AGENTS.md

Dirs analyzed: {N}
AGENTS created: {N}
AGENTS updated: {N}
CLAUDE symlinks created: {N}
CLAUDE symlinks updated: {N}

Hierarchy:
  ./AGENTS.md
  ./CLAUDE.md -> AGENTS.md
  ./path/AGENTS.md
  ./path/CLAUDE.md -> AGENTS.md
```

## Anti-Patterns (Reject)

- static agent count independent of project complexity
- sequential-only discovery when work is parallelizable
- generating files before reading existing context
- skipping arXiv study gate or not applying its findings
- verbose generic content and duplicated parent material
- creating `AGENTS.md` without paired `CLAUDE.md` symlink

<user-request>
$ARGUMENTS
</user-request>
