# Compact tool rows

An opt-in, renderer-only extension for **Pi 1.4.0**. Inspired by OpenCode's verbosity controls, but uses Pi's public `registerToolRenderer` API rather than patching the transcript or replacing tools.

```text
✓ code · 2 reads · 123ms
✓ bash · rg "pattern" src · 12 lines · 123ms
✓ skill · diagnosing-bugs · 123ms
✗ bash · npm test · 2 lines · 123ms
  Assertion failed: expected 200, received 500
  Process exited with code 1
```

Each successful collapsed execution has one content line. Long commands and paths are shortened to the available terminal width. Pi still adds a blank separator between executions.

## Load from dotfiles

This extension lives in `~/dev/macOS-dots/pi/extensions/compact-rows`, available through the existing `~/.pi/agent` symlink. Pi discovers it automatically alongside your other personal extensions.

In a running Pi session, use:

```text
/reload
```

No `--extension` flag or settings change is needed. If you launched an earlier trial with an explicit worktree `--extension` flag, restart Pi without that flag to avoid loading two copies.

## Controls

| Control | Effect |
| --- | --- |
| `/details` | Toggle all tools between compact and detailed |
| `/details compact` | Collapse all tools, including individually expanded rows |
| `/details detailed` | Expand all tools |
| `/details status` | Report the global expansion state |
| `Ctrl+O` | Pi's normal global expansion control; uses the same state |
| Click a row in fullscreen mode | Expand/collapse that row using Pi's native mouse handling |

There is no second persisted verbosity setting. Existing native expansion state determines the initial view. Regular mode uses keyboard controls; its mouse belongs to the terminal. Your configured expansion keybinding still applies if you remapped `Ctrl+O`.

## What changes

- **Codemode:** one row of nested-call counts; no inline script, nested argument dump, or successful output preview while collapsed.
- **Bash / PowerShell:** one width-limited command row with output-line count and final duration. Counts are lines, **not inferred matches or test results**.
- **Reads:** one path row; `SKILL.md` becomes a skill-name row and `AGENTS.md`/`CLAUDE.md` become instruction rows.
- **Edit / write / grep / find / ls:** short action/target rows. Diffs and full output remain in the expanded view.
- **Tools without custom renderers:** generic compact rows; expanded arguments and text results remain inspectable, including unknown tools in resumed sessions.

Expanded views delegate to the next/native renderers, preserving their syntax highlighting, scripts, read contents, diffs, output, and notices. They use this extension's unboxed outer shell rather than restoring the native colored card. Pi still owns inline images.

## Safety and compatibility

- Errors show a failure icon and up to three single-line excerpts. Codemode nested errors/cancellations stay visible even if the script caught the failure and returned successfully. Expand for the full available details.
- Truncated/saved output is marked `truncated`; expand to see the native notice and full-output path. Expanding cannot recover output the underlying tool already discarded.
- Running rows use `…`, not a success tick. Final duration comes from Pi's result metadata.
- Existing non-core custom renderers are left untouched, including question dialogs and the local web-tool renderers. Those tools may remain more verbose.
- No private Pi imports or transcript monkey patches in production. No tool re-registration, execution interception, result/context rewriting, or model requests.
- No changes to startup, header/footer, theme, thinking display, reasoning effort, settings files, or on-disk sessions. The toggle invokes Pi's native expansion control, including its existing effects on other expandable components.
- Another renderer resolver earlier in extension load order can take precedence. Avoid stacking multiple renderer overrides for the same core tools when comparing behavior.
- Cross-message activity grouping is intentionally not implemented.

## Verification

No dependency installation or model credentials are needed. Tests use the installed Pi loader, native renderers, and real `ToolExecutionComponent` rather than a replacement UI:

```sh
base=~/dev/macOS-dots
node --test "$base/pi/extensions/compact-rows/compact-rows.test.mjs"
```

The test harness locates Pi via the managed install's `current-version`. For a different installation, set `PI_TEST_PACKAGE_ROOT` to the installed `@earendil-works/pi-coding-agent` directory.

Coverage: one-line collapsed output, complete expanded details, outer/nested failures, pending-to-complete state, terminal-width/control handling, truncation, native mouse expansion, command state, and custom-renderer composition. Development also exercised the renderer in real PTYs in fullscreen and regular modes, without calling a model.

## OpenCode research

Studied OpenCode `dev` at [`d76552c`](https://github.com/anomalyco/opencode/tree/d76552c/packages/tui/src/routes/session):

- `grouping/session.ts`: Low/Medium/High verbosity and activity/exploration/instruction grouping.
- `activity-summary.ts`: concise summaries of tool activity.
- `group-view.tsx`: expansion defaults and saved per-group overrides.
- `index.tsx`: thinking visibility, code execution details, shell output, and compact skill rows.

Borrowed the progressive-disclosure approach, not OpenCode's implementation. Thinking visibility remains separate from tool details; `/compact` remains Pi's context-compaction command, unrelated to this extension.
