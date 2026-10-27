import { homedir } from "node:os";
import { basename, dirname, isAbsolute, relative } from "node:path";
import type { ExtensionAPI, ToolRenderers } from "@earendil-works/pi-coding-agent";
import { Text, truncateToWidth, visibleWidth, type Component } from "@earendil-works/pi-tui";

type CallRenderer = NonNullable<ToolRenderers["renderCall"]>;
type ResultRenderer = NonNullable<ToolRenderers["renderResult"]>;
type RenderContext = Parameters<CallRenderer>[2];
type Theme = Parameters<CallRenderer>[1];
type Result = Parameters<ResultRenderer>[0];
type NestedCall = { name: string; status: string; error?: string };
type Summary = { calls: NestedCall[]; lines: number; truncated: boolean; error: string };

const CORE_TOOLS = new Set(["read", "bash", "powershell", "codemode", "edit", "write", "grep", "find", "ls"]);
const NO_SUMMARY: Summary = { calls: [], lines: 0, truncated: false, error: "" };
const string = (value: unknown): string => typeof value === "string" ? value : "";

// Arguments and results may contain terminal controls. Summaries must stay on one safe line.
function plain(value: string): string {
  return value
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\x00-\x1f\x7f-\x9f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pathLabel(path: string, cwd: string): string {
  if (!isAbsolute(path)) return path;
  const local = relative(cwd, path);
  if (local && local !== ".." && !local.startsWith("../")) return local;
  const home = homedir();
  return path.startsWith(`${home}/`) ? `~/${path.slice(home.length + 1)}` : path;
}

function callLabel(name: string, rawArgs: unknown, cwd: string): string {
  const args = rawArgs && typeof rawArgs === "object" ? rawArgs as Record<string, unknown> : {};
  const path = string(args.path ?? args.file_path);
  if (name === "read" && basename(path) === "SKILL.md") return `skill · ${basename(dirname(path))}`;
  if (name === "read" && /^(AGENTS(?:\.override)?|CLAUDE)\.md$/i.test(basename(path))) {
    return `instructions · ${pathLabel(path, cwd)}`;
  }
  if (name === "codemode") return "code";
  if (name === "bash" || name === "powershell") return `${name} · ${string(args.command) || "…"}`;
  const label = pathLabel(path, cwd);
  const range = name === "read" && (args.offset || args.limit)
    ? `:${args.offset || 1}${args.limit ? ` (+${args.limit})` : ""}` : "";
  const target = string(args.pattern ?? args.query ?? args.url);
  return [name, target, `${label}${range}`].filter(Boolean).join(" · ");
}

function summarize(result: Result): Summary {
  const details = result.details;
  const calls: NestedCall[] = Array.isArray(details?.calls)
    ? details.calls.filter((call: NestedCall) => call && typeof call.name === "string") : [];
  const output = result.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .replace(/^Script (?:completed|failed)\nWall time [\d.]+ seconds\nOutput:\n/, "");
  const lines = output.split("\n").filter((line) => line.trim());
  const failed = calls.find((call) => call.status === "error" || call.status === "cancelled");
  return {
    calls,
    lines: lines.length,
    truncated: Boolean(details?.truncation?.truncated || details?.fullOutputPath),
    // The tail of a shell result typically carries the actual failure and exit status.
    error: failed
      ? `${failed.name}: ${failed.error || failed.status}`
      : lines.slice(-3).join("\n"),
  };
}

function nestedSummary(calls: NestedCall[]): string {
  const labels: Record<string, string> = { read: "read", bash: "command", powershell: "command" };
  const counts = new Map<string, number>();
  for (const call of calls) {
    const label = labels[call.name] ?? call.name;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => `${count} ${name}${count === 1 ? "" : "s"}`).join(", ");
}

function compactLine(name: string, context: RenderContext, summary: Summary, theme: Theme, width: number): string {
  const failed = summary.calls.filter((call) => call.status === "error").length;
  const cancelled = summary.calls.filter((call) => call.status === "cancelled").length;
  const pending = context.isPartial;
  const color = context.isError || failed ? "error" : cancelled || pending ? "warning" : "success";
  const icon = context.isError || failed ? "✗" : cancelled ? "⊘" : pending ? "…" : "✓";
  const parts = [plain(callLabel(name, context.args ?? {}, context.cwd))];
  if (failed) parts.push(`${failed} failed`);
  if (cancelled) parts.push(`${cancelled} cancelled`);
  if (summary.truncated) parts.push("truncated");
  if (name === "codemode" && summary.calls.length) parts.push(plain(nestedSummary(summary.calls)));
  if ((name === "bash" || name === "powershell") && summary.lines) parts.push(`${summary.lines} ${summary.lines === 1 ? "line" : "lines"}`);
  if (context.durationMs !== undefined) {
    parts.push(context.durationMs < 1000 ? `${Math.round(context.durationMs)}ms` : `${(context.durationMs / 1000).toFixed(1)}s`);
  }
  const suffix = parts.length > 1 ? ` · ${parts.slice(1).join(" · ")}` : "";
  // Shorten the command first, so long invocations do not push notices/timing off-screen.
  const titleWidth = Math.max(Math.min(12, Math.max(0, width - 2)), width - 2 - visibleWidth(suffix));
  return `${theme.fg(color, icon)} ${theme.fg("toolTitle", truncateToWidth(parts[0], titleWidth))}` +
    theme.fg("muted", suffix);
}

function padded(component: Component, context: RenderContext): Component {
  return {
    render(width) {
      const pad = Math.min(Math.max(0, context.outputPad), Math.max(0, width - 1));
      return component.render(Math.max(1, width - pad * 2)).map((line) =>
        `${" ".repeat(pad)}${truncateToWidth(line, Math.max(0, width - pad))}`);
    },
    invalidate() { component.invalidate(); },
    handleMouse(event) { return component.handleMouse?.({ ...event, x: event.x - context.outputPad }); },
  };
}

export default function compactRows(pi: ExtensionAPI) {
  pi.registerToolRenderer((name, next) => {
    const original = next();
    // Do not take over question/permission dialogs or another extension's rich custom UI.
    if (!CORE_TOOLS.has(name) && (original?.renderCall || original?.renderResult)) return original;

    return {
      renderShell: "self",
      renderCall(args, theme, context) {
        if (context.expanded) {
          const component = original?.renderCall?.(args, theme, { ...context, lastComponent: undefined })
            ?? new Text(`${name}\n${JSON.stringify(args, null, 2)}`, 0, 0);
          return padded(component, context);
        }
        // Result rendering happens after call rendering. Read its summary at layout time so a
        // finished result can update the *same* header without adding a second content line.
        return padded({
          render(width) {
            return [truncateToWidth(compactLine(name, context, context.state.compactRows ?? NO_SUMMARY, theme, width), width)];
          },
          invalidate() {},
        }, context);
      },
      renderResult(result, options, theme, context) {
        const summary = summarize(result);
        context.state.compactRows = summary;
        if (options.expanded) {
          const component = original?.renderResult?.(result, options, theme, { ...context, lastComponent: undefined })
            ?? new Text(result.content.filter((block) => block.type === "text").map((block) => block.text).join("\n"), 0, 0);
          return padded(component, context);
        }
        const hasFailure = context.isError || summary.calls.some((call) => call.status === "error" || call.status === "cancelled");
        if (!hasFailure) return { render: () => [], invalidate() {} };
        const lines = (summary.error || "Tool failed; expand for details").split("\n").slice(0, 3).map(plain);
        return padded({
          render(width) { return lines.map((line) => theme.fg("error", truncateToWidth(`  ${line}`, width))); },
          invalidate() {},
        }, context);
      },
    };
  });

  pi.registerCommand("details", {
    description: "Toggle compact tool rows; /details compact|detailed|status",
    handler: async (args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("/details requires Pi's terminal UI", "warning");
        return;
      }
      const action = args.trim().toLowerCase();
      const current = ctx.ui.getToolsExpanded();
      if (action === "status") {
        ctx.ui.notify(`Tool details: ${current ? "detailed" : "compact"} (individual rows may differ)`, "info");
        return;
      }
      if (!["", "toggle", "compact", "detailed"].includes(action)) {
        ctx.ui.notify("Usage: /details [compact|detailed|status]", "warning");
        return;
      }
      const expanded = action === "detailed" ? true : action === "compact" ? false : !current;
      // Pi skips same-value changes. An explicit mode must also reset individually clicked rows.
      if (current === expanded) ctx.ui.setToolsExpanded(!expanded);
      ctx.ui.setToolsExpanded(expanded);
    },
  });
}
