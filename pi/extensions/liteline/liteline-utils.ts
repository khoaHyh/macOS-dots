import type { ContextUsage } from "@mariozechner/pi-coding-agent";

export type GlyphPreference = "auto" | "nerd" | "ascii";
export type GlyphMode = "nerd" | "ascii";

interface GlyphModeInput {
  envOverride?: string;
  preference?: GlyphPreference;
  termProgram?: string;
  term?: string;
  hasKitty?: boolean;
  hasWezterm?: boolean;
  hasGhosttyResourcesDir?: boolean;
}

const NERD_TERM_PROGRAMS = new Set(["iterm.app", "wezterm", "ghostty", "kitty", "alacritty"]);

function parseBooleanLike(input: string | undefined): boolean | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();

  if (["1", "true", "yes", "on", "nerd"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "ascii"].includes(normalized)) return false;
  return null;
}

export function normalizeGlyphPreference(value: unknown): GlyphPreference {
  if (typeof value !== "string") return "auto";

  const normalized = value.trim().toLowerCase();
  if (normalized === "nerd" || normalized === "ascii" || normalized === "auto") {
    return normalized;
  }

  return "auto";
}

export function resolveGlyphMode(input: GlyphModeInput): GlyphMode {
  const envOverride = parseBooleanLike(input.envOverride);
  if (envOverride === true) return "nerd";
  if (envOverride === false) return "ascii";

  const preference = input.preference ?? "auto";
  if (preference === "nerd") return "nerd";
  if (preference === "ascii") return "ascii";

  if (input.hasKitty || input.hasWezterm || input.hasGhosttyResourcesDir) return "nerd";

  const termProgram = input.termProgram?.toLowerCase();
  if (termProgram && NERD_TERM_PROGRAMS.has(termProgram)) return "nerd";

  const term = input.term?.toLowerCase() || "";
  if (term.includes("kitty") || term.includes("wezterm") || term.includes("alacritty")) {
    return "nerd";
  }

  return "ascii";
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);

  if (abs < 1_000) return `${Math.round(value)}`;
  if (abs < 1_000_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export function formatPlanWindowUsage(label: string, usedTokens: number, limitTokens: number | undefined): string {
  const used = Math.max(0, usedTokens);

  if (!limitTokens || limitTokens <= 0) {
    return `${label} ${formatCompactNumber(used)} used • limit unset`;
  }

  const total = Math.max(1, limitTokens);
  const remaining = Math.max(0, total - used);
  const percent = Math.max(0, Math.min(100, Math.round((used / total) * 100)));

  return `${label} ${percent}% used • ${formatCompactNumber(remaining)} left`;
}

export function formatRemainingWindowLabel(label: string, usedTokens: number, limitTokens: number | undefined): string {
  if (!limitTokens || limitTokens <= 0) {
    return `${label} (limit unset)`;
  }

  const total = Math.max(1, limitTokens);
  const remaining = Math.max(0, total - Math.max(0, usedTokens));
  const percentLeft = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
  return `${label} (${percentLeft}% left)`;
}

export function formatContextSegment(usage: ContextUsage): string {
  if (usage.tokens == null || usage.percent == null) {
    return `ctx ? ${formatCompactNumber(usage.contextWindow)}`;
  }

  const used = Math.max(0, usage.tokens);
  const total = Math.max(1, usage.contextWindow);
  const remaining = Math.max(0, total - used);
  const percent = Math.max(0, Math.min(100, Math.round(usage.percent)));

  return `ctx ${percent}% ${formatCompactNumber(used)}/${formatCompactNumber(total)} (${formatCompactNumber(remaining)} left)`;
}

function footerGlyphs(glyphMode: GlyphMode): { model: string; context: string; branch: string } {
  if (glyphMode === "nerd") {
    return {
      model: "\uEC19",
      context: "\uE70F",
      branch: "\uF126",
    };
  }

  return {
    model: "◈",
    context: "◫",
    branch: "⎇",
  };
}

function compactThinkingLabel(thinking: string): string | null {
  switch (thinking.trim().toLowerCase()) {
    case "minimal": return "min";
    case "low": return "low";
    case "medium": return "med";
    case "high": return "hi";
    case "xhigh": return "xhi";
    default: return null;
  }
}

export function formatCompactContextSegment(
  usage: ContextUsage | null | undefined,
  glyphMode: GlyphMode,
): string {
  const icons = footerGlyphs(glyphMode);
  const contextWindow = usage?.contextWindow;

  if (contextWindow == null) {
    return `${icons.context} ?`;
  }

  if (usage.tokens == null || usage.percent == null) {
    return `${icons.context} ? ${formatCompactNumber(contextWindow)}`;
  }

  const used = Math.max(0, usage.tokens);
  const total = Math.max(1, contextWindow);
  const percent = Math.max(0, Math.min(100, Math.round(usage.percent)));
  return `${icons.context} ${percent}% ${formatCompactNumber(used)}/${formatCompactNumber(total)}`;
}

export function formatFooterModelSegment(model: string, thinking: string, glyphMode: GlyphMode): string {
  const icons = footerGlyphs(glyphMode);
  const compactThinking = compactThinkingLabel(thinking);

  if (!compactThinking) {
    return `${icons.model} ${model}`;
  }

  return `${icons.model} ${model} · ${compactThinking}`;
}

export function formatFooterVcsSegment(options: {
  gitBranch: string | null;
  graphiteStack: string | null;
  glyphMode: GlyphMode;
}): string {
  const icons = footerGlyphs(options.glyphMode);
  const parts: string[] = [];

  if (options.gitBranch) {
    parts.push(`${icons.branch} ${options.gitBranch}`);
  }

  if (options.graphiteStack) {
    parts.push(`gt ${options.graphiteStack}`);
  }

  if (parts.length === 0) {
    return "no-vcs";
  }

  return parts.join(" · ");
}

export function parseGraphiteBranchInfoSummary(rawOutput: string): string | null {
  const normalized = rawOutput.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return "stack";
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildLoadedSummaryRows(counts: {
  contextFiles: number;
  extensions: number;
  skills: number;
  prompts: number;
  themes: number;
}): string[] {
  return [
    pluralize(counts.contextFiles, "context file", "context files"),
    pluralize(counts.extensions, "extension", "extensions"),
    pluralize(counts.skills, "skill", "skills"),
    pluralize(counts.prompts, "prompt", "prompts"),
    pluralize(counts.themes, "theme", "themes"),
  ];
}

export function limitRecentSessions(entries: string[], maxItems: number): string[] {
  if (entries.length === 0) return ["none yet"];
  return entries.slice(0, Math.max(1, maxItems));
}

export function getStartupLogoAscii(): string[] {
  return [
    "▀████████████▀",
    "  ███    ███  ",
    "  ███    ███  ",
    "  ███    ███  ",
    " ▄███▄  ▄███▄ ",
  ];
}

function truncateWithEllipsis(text: string, maxWidth: number): string {
  if (maxWidth <= 0 || text.length <= maxWidth) return text;
  if (maxWidth === 1) return "…";

  const sliced = text.slice(0, maxWidth - 1).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace >= Math.floor((maxWidth - 1) * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${safe.trimEnd()}…`;
}

export function chooseSessionTitle(options: {
  sessionName?: string;
  firstUserText?: string;
  fallback: string;
  maxWidth?: number;
}): string {
  const maxWidth = options.maxWidth ?? 32;
  const preferred = [options.sessionName, options.firstUserText]
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .find((value) => value && value.length > 0);

  return truncateWithEllipsis(preferred || options.fallback, maxWidth);
}

export function formatRecentSessionRow(options: {
  active: boolean;
  title: string;
  timeAgo: string;
  maxWidth: number;
}): string {
  const prefix = options.active ? "* " : "- ";
  const suffix = ` (${options.timeAgo})`;
  const availableTitleWidth = Math.max(1, options.maxWidth - prefix.length - suffix.length);
  const title = truncateWithEllipsis(options.title, availableTitleWidth);
  return `${prefix}${title}${suffix}`;
}

function normalizePercentLeft(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(100 - value)));
}

export function parseCodexRateLimitPercents(payload: unknown): {
  sessionPercentLeft?: number;
  weeklyPercentLeft?: number;
} {
  const root = (typeof payload === "object" && payload !== null ? payload : {}) as Record<string, unknown>;

  const rateLimits = (typeof root.rateLimits === "object" && root.rateLimits !== null)
    ? root.rateLimits as Record<string, unknown>
    : undefined;

  const byLimitId = (typeof root.rateLimitsByLimitId === "object" && root.rateLimitsByLimitId !== null)
    ? root.rateLimitsByLimitId as Record<string, unknown>
    : undefined;

  const codexEntry = rateLimits
    ?? (typeof byLimitId?.codex === "object" && byLimitId.codex !== null
      ? byLimitId.codex as Record<string, unknown>
      : undefined);

  const primary = (typeof codexEntry?.primary === "object" && codexEntry.primary !== null)
    ? codexEntry.primary as Record<string, unknown>
    : undefined;
  const secondary = (typeof codexEntry?.secondary === "object" && codexEntry.secondary !== null)
    ? codexEntry.secondary as Record<string, unknown>
    : undefined;

  return {
    sessionPercentLeft: normalizePercentLeft(primary?.usedPercent),
    weeklyPercentLeft: normalizePercentLeft(secondary?.usedPercent),
  };
}

export function abbreviateModel(provider: string | undefined, modelId: string | undefined): string {
  if (!modelId) return "unknown-model";

  const prefix = provider ? `${provider}/` : "";
  if (prefix && modelId.startsWith(prefix)) {
    return modelId.slice(prefix.length);
  }

  return modelId;
}
