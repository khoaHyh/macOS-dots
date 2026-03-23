# AGENTS.md

Global defaults for my personal pi coding agent setup.

## Preferences

- Keep edits minimal and focused.
- Prefer deterministic checks over broad rewrites.
- Explain risky commands before running them.
- Never expose secrets from local machine files.

## Documentation lookup behavior

- For external libraries, frameworks, SDKs, CLIs, APIs, and tooling, proactively use the `find-docs` skill.
- In that workflow, use `ctx7 library` + `ctx7 docs` before implementation details whenever possible.
- If Context7 quota/auth blocks a lookup, state that clearly and then continue with best-effort guidance.

## Plan artifact policy

- Store plan/PRD working files under `.specs/`.
- Use unique filenames to avoid collisions and improve traceability: `<YYYYMMDD-HHMMSS>-<slug>.md`.
- Prefer invoking plannotator with an explicit plan path in `.specs/` (do not rely on default `PLAN.md`).
- Treat plan artifacts as local workflow files; do not commit them.

## Dotfiles context

This configuration is managed from `~/dev/macOS-dots/pi` and symlinked to `~/.pi/agent`.
