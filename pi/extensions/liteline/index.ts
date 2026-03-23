import type { ExtensionAPI, ExtensionContext, ReadonlyFooterDataProvider } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { fetchCodexRateLimitUsage, type RateLimitUsage } from "./codex-rate-limit.ts";
import { discoverRecentSessions, type RecentSessionSummary } from "./session-history.ts";
import {
  abbreviateModel,
  buildLoadedSummaryRows,
  formatCompactContextSegment,
  formatFooterModelSegment,
  formatFooterVcsSegment,
  formatRecentSessionRow,
  getStartupLogoAscii,
  normalizeGlyphPreference,
  parseJjBookmarkSummary,
  resolveGlyphMode,
  type GlyphPreference,
} from "./liteline-utils.ts";

type SegmentColor = "accent" | "success" | "warning" | "error" | "muted";

interface LitelineSettings {
  glyphPreference: GlyphPreference;
  showModeSegment: boolean;
  showHeader: boolean;
  fiveHourLimitTokens?: number;
  weeklyLimitTokens?: number;
}

interface HeaderData {
  loadedRows: string[];
  recentSessions: RecentSessionSummary[];
}

interface NerdSegment {
  text: string;
  bg: number;
  fg: number;
}

const ANSI_RESET = "\x1b[0m";
const MAX_RECENT_SESSIONS = 3;
const JJ_REFRESH_MS = 4_000;
const RATE_LIMIT_REFRESH_MS = 60_000;
const APP_SERVER_TIMEOUT_MS = 4_000;

const PALETTE = {
  modeReadyBg: 25,
  modeBusyBg: 166,
  modelBg: 60,
  contextBg: 66,
  contextWarnBg: 136,
  contextErrorBg: 160,
  vcsBg: 31,
  fgDark: 234,
  fgLight: 231,
};

const DEFAULT_SETTINGS: LitelineSettings = {
  glyphPreference: "auto",
  showModeSegment: true,
  showHeader: true,
  fiveHourLimitTokens: undefined,
  weeklyLimitTokens: undefined,
};

function fg256(code: number): string {
  return `\x1b[38;5;${code}m`;
}

function bg256(code: number): string {
  return `\x1b[48;5;${code}m`;
}

function getAgentDir(): string {
  return join(process.env.HOME || process.env.USERPROFILE || homedir(), ".pi", "agent");
}

function safeReadJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};

  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore invalid user settings and fall back to defaults.
  }

  return {};
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.floor(value);
}

function readLitelineSettings(cwd: string): LitelineSettings {
  const globalSettings = safeReadJson(join(getAgentDir(), "settings.json"));
  const projectSettings = safeReadJson(join(cwd, ".pi", "settings.json"));

  const merged = {
    ...(typeof globalSettings.liteline === "object" && globalSettings.liteline ? globalSettings.liteline : {}),
    ...(typeof projectSettings.liteline === "object" && projectSettings.liteline ? projectSettings.liteline : {}),
  } as Record<string, unknown>;

  const showModeSegment = typeof merged.showModeSegment === "boolean"
    ? merged.showModeSegment
    : DEFAULT_SETTINGS.showModeSegment;

  const showHeader = typeof merged.showHeader === "boolean"
    ? merged.showHeader
    : DEFAULT_SETTINGS.showHeader;

  return {
    glyphPreference: normalizeGlyphPreference(merged.glyphPreference),
    showModeSegment,
    showHeader,
    fiveHourLimitTokens: parseOptionalNumber(merged.fiveHourLimitTokens),
    weeklyLimitTokens: parseOptionalNumber(merged.weeklyLimitTokens),
  };
}

function pathToTilde(path: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

function discoverContextPaths(cwd: string): string[] {
  const paths = new Set<string>();

  const globalContext = join(getAgentDir(), "AGENTS.md");
  if (existsSync(globalContext)) paths.add(pathToTilde(globalContext));

  let current = cwd;
  while (true) {
    const candidate = join(current, "AGENTS.md");
    if (existsSync(candidate)) paths.add(pathToTilde(candidate));

    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const projectContext = join(cwd, ".pi", "AGENTS.md");
  if (existsSync(projectContext)) paths.add(pathToTilde(projectContext));

  return [...paths].sort();
}

function discoverExtensionPaths(cwd: string): string[] {
  const paths = new Set<string>();
  const dirs = [join(getAgentDir(), "extensions"), join(cwd, ".pi", "extensions")];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;

        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const indexTs = join(fullPath, "index.ts");
          const indexJs = join(fullPath, "index.js");
          if (existsSync(indexTs)) paths.add(pathToTilde(indexTs));
          else if (existsSync(indexJs)) paths.add(pathToTilde(indexJs));
          continue;
        }

        if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
          paths.add(pathToTilde(fullPath));
        }
      }
    } catch {
      // Ignore one bad extension dir.
    }
  }

  return [...paths].sort();
}

function discoverSkillPaths(pi: ExtensionAPI): string[] {
  const skills = new Set<string>();

  for (const command of pi.getCommands()) {
    if (command.source !== "skill") continue;
    skills.add(pathToTilde(command.path || command.name));
  }

  return [...skills].sort();
}

function discoverPromptPaths(pi: ExtensionAPI): string[] {
  const prompts = new Set<string>();

  for (const command of pi.getCommands()) {
    if (command.source !== "prompt") continue;
    prompts.add(pathToTilde(command.path || command.name));
  }

  return [...prompts].sort();
}

function discoverThemePaths(ctx: ExtensionContext): string[] {
  const themes = new Set<string>();

  for (const theme of ctx.ui.getAllThemes()) {
    if (!theme.path) continue;
    themes.add(pathToTilde(theme.path));
  }

  return [...themes].sort();
}

function buildHeaderData(ctx: ExtensionContext, pi: ExtensionAPI): HeaderData {
  const loadedRows = buildLoadedSummaryRows({
    contextFiles: discoverContextPaths(ctx.cwd).length,
    extensions: discoverExtensionPaths(ctx.cwd).length,
    skills: discoverSkillPaths(pi).length,
    prompts: discoverPromptPaths(pi).length,
    themes: discoverThemePaths(ctx).length,
  });

  const recentSessions = discoverRecentSessions({
    sessionDir: ctx.sessionManager.getSessionDir(),
    currentSessionFile: ctx.sessionManager.getSessionFile(),
    maxSessions: MAX_RECENT_SESSIONS,
  });

  return { loadedRows, recentSessions };
}

function providerLabel(ctx: ExtensionContext): string {
  return ctx.model?.provider || "unknown provider";
}

function formatPercentLeft(label: string, value: number | undefined): string {
  if (value == null) return `${label} (n/a)`;
  return `${label} (${value}% left)`;
}

function planWindowLine(usage: RateLimitUsage): string {
  const session = formatPercentLeft("Session", usage.sessionPercentLeft);
  const weekly = formatPercentLeft("Weekly", usage.weeklyPercentLeft);
  return `${session} • ${weekly}`;
}

function padAnsi(text: string, width: number): string {
  const current = visibleWidth(text);
  if (current >= width) return truncateToWidth(text, width, "…", true);
  return text + " ".repeat(width - current);
}

function renderWelcomeHeader(
  theme: ExtensionContext["ui"]["theme"],
  modelLabel: string,
  providerLabelText: string,
  usageLabel: string,
  data: HeaderData,
  width: number,
): string[] {
  if (width < 68) {
    const simple = [
      theme.fg("accent", theme.bold("π liteline")),
      `Model: ${modelLabel}`,
      `Provider: ${providerLabelText}`,
      `Usage: ${usageLabel}`,
      `Loaded: ${data.loadedRows.join(", ")}`,
      `Recent: ${data.recentSessions.map((session) => `${session.title} (${session.timeAgo})`).join(" • ")}`,
    ];
    return simple.map((line) => truncateToWidth(line, Math.max(20, width), "…", true));
  }

  const boxWidth = Math.min(Math.max(72, width - 2), 120);
  const innerWidth = boxWidth - 2;
  const leftWidth = Math.min(40, Math.max(36, Math.floor(innerWidth * 0.42)));
  const rightWidth = innerWidth - leftWidth - 1;

  const startupLogo = getStartupLogoAscii();
  const leftLogo = startupLogo.map((line, index) => {
    if (index === 0 || index === startupLogo.length - 1) return theme.fg("accent", line);
    return theme.fg("muted", line);
  });

  const leftRows = [
    "",
    theme.bold("Welcome back!"),
    "",
    ...leftLogo,
    "",
    theme.fg("accent", modelLabel),
    theme.fg("dim", providerLabelText),
    theme.fg("muted", usageLabel),
  ];

  const rightRows = [
    theme.fg("warning", theme.bold("Tips")),
    `${theme.fg("dim", "/")} for commands`,
    `${theme.fg("dim", "!")} to run bash`,
    `${theme.fg("dim", "Shift+Tab")} cycle thinking`,
    theme.fg("dim", "─".repeat(Math.max(8, rightWidth - 1))),
    theme.fg("warning", theme.bold("Loaded")),
    ...data.loadedRows.map((row) => `${theme.fg("success", "✓")} ${row}`),
    theme.fg("dim", "─".repeat(Math.max(8, rightWidth - 1))),
    theme.fg("warning", theme.bold("Recent sessions")),
    ...data.recentSessions.map((session) =>
      formatRecentSessionRow({
        active: session.active,
        title: session.title,
        timeAgo: session.timeAgo,
        maxWidth: Math.max(18, rightWidth - 2),
      }),
    ),
  ];

  const maxRows = Math.max(leftRows.length, rightRows.length);
  const lines: string[] = [];

  const title = ` ${theme.fg("accent", theme.bold("pi agent"))} `;
  const titleWidth = visibleWidth(title);
  const leadRule = 2;

  if (titleWidth + leadRule > innerWidth) {
    lines.push(theme.fg("dim", `╭${"─".repeat(innerWidth)}╮`));
  } else {
    const trailRule = Math.max(0, innerWidth - leadRule - titleWidth);
    lines.push(
      theme.fg("dim", `╭${"─".repeat(leadRule)}`) +
      title +
      theme.fg("dim", `${"─".repeat(trailRule)}╮`),
    );
  }

  for (let i = 0; i < maxRows; i++) {
    const left = padAnsi(leftRows[i] ?? "", leftWidth);
    const right = padAnsi(rightRows[i] ?? "", rightWidth);
    lines.push(`${theme.fg("dim", "│")}${left}${theme.fg("dim", "│")}${right}${theme.fg("dim", "│")}`);
  }

  lines.push(theme.fg("dim", `╰${"─".repeat(innerWidth)}╯`));
  return lines.map((line) => truncateToWidth(line, width, "…", true));
}

function segmentColorForUsage(percent: number | null | undefined): SegmentColor {
  if (percent == null) return "muted";
  if (percent >= 90) return "error";
  if (percent >= 70) return "warning";
  return "success";
}

function segmentBgForUsage(percent: number | null | undefined): number {
  if (percent == null) return PALETTE.contextBg;
  if (percent >= 90) return PALETTE.contextErrorBg;
  if (percent >= 70) return PALETTE.contextWarnBg;
  return PALETTE.contextBg;
}

function renderNerdSegments(segments: NerdSegment[]): string {
  if (segments.length === 0) return "";

  let result = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    result += `${bg256(segment.bg)}${fg256(segment.fg)} ${segment.text} `;

    const next = segments[i + 1];
    if (next) {
      result += `${bg256(next.bg)}${fg256(segment.bg)}`;
    }
  }

  return result + ANSI_RESET;
}

function renderAsciiSegments(
  theme: ExtensionContext["ui"]["theme"],
  entries: Array<{ text: string; color: SegmentColor }>,
): string {
  return entries
    .map((entry) => {
      const segmentText = `[${entry.text}]`;
      return theme.fg(entry.color, segmentText);
    })
    .join(" ");
}

export default function litelineExtension(pi: ExtensionAPI) {
  let enabled = true;
  let settings: LitelineSettings = DEFAULT_SETTINGS;
  let glyphMode: "nerd" | "ascii" = "ascii";
  let agentBusy = false;
  let currentCtx: ExtensionContext | null = null;
  let headerData: HeaderData | null = null;
  let rateLimitUsage: RateLimitUsage = {};

  let jjBookmark: string | null = null;
  let lastJjRefresh = 0;
  let lastRateLimitRefresh = 0;
  let requestFooterRender: (() => void) | null = null;
  let requestHeaderRender: (() => void) | null = null;

  function recalcGlyphMode(): void {
    glyphMode = resolveGlyphMode({
      envOverride: process.env.LITELINE_NERD_FONTS,
      preference: settings.glyphPreference,
      termProgram: process.env.TERM_PROGRAM,
      term: process.env.TERM,
      hasKitty: Boolean(process.env.KITTY_WINDOW_ID),
      hasWezterm: Boolean(process.env.WEZTERM_EXECUTABLE),
      hasGhosttyResourcesDir: Boolean(process.env.GHOSTTY_RESOURCES_DIR),
    });
  }

  async function refreshRateLimitUsage(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - lastRateLimitRefresh < RATE_LIMIT_REFRESH_MS) return;
    lastRateLimitRefresh = now;

    const next = await fetchCodexRateLimitUsage(APP_SERVER_TIMEOUT_MS);
    if (!next) return;

    rateLimitUsage = next;
    requestHeaderRender?.();
  }

  function installHeader(ctx: ExtensionContext): void {
    if (!settings.showHeader) {
      ctx.ui.setHeader(undefined);
      return;
    }

    const data = headerData ?? buildHeaderData(ctx, pi);

    ctx.ui.setHeader((tui, theme) => ({
      dispose() {
        requestHeaderRender = null;
      },
      invalidate() {},
      render(width: number): string[] {
        requestHeaderRender = () => tui.requestRender();
        const model = abbreviateModel(ctx.model?.provider, ctx.model?.id);
        const thinking = pi.getThinkingLevel();

        return renderWelcomeHeader(
          theme,
          `${model} ${thinking}`,
          providerLabel(ctx),
          planWindowLine(rateLimitUsage),
          data,
          width,
        );
      },
    }));
  }

  function installFooter(ctx: ExtensionContext): void {
    ctx.ui.setFooter((tui, theme, footerData: ReadonlyFooterDataProvider) => {
      requestFooterRender = () => tui.requestRender();

      const unsubBranch = footerData.onBranchChange(() => {
        void refreshJjBookmark();
        tui.requestRender();
      });

      return {
        dispose() {
          unsubBranch();
          requestFooterRender = null;
        },
        invalidate() {},
        render(width: number): string[] {
          const activeCtx = currentCtx ?? ctx;
          const model = abbreviateModel(activeCtx.model?.provider, activeCtx.model?.id);
          const thinking = pi.getThinkingLevel();
          const usage = activeCtx.getContextUsage();

          const modeText = agentBusy ? "BUSY" : "READY";
          const modelText = formatFooterModelSegment(model, thinking, glyphMode);
          const contextText = formatCompactContextSegment(usage, glyphMode);

          const gitBranch = footerData.getGitBranch();
          const vcsText = formatFooterVcsSegment({ gitBranch, jjBookmark, glyphMode });

          if (glyphMode === "nerd") {
            const nerdSegments: NerdSegment[] = [];

            if (settings.showModeSegment) {
              nerdSegments.push({
                text: modeText,
                bg: agentBusy ? PALETTE.modeBusyBg : PALETTE.modeReadyBg,
                fg: PALETTE.fgLight,
              });
            }

            nerdSegments.push({ text: modelText, bg: PALETTE.modelBg, fg: PALETTE.fgLight });
            nerdSegments.push({
              text: contextText,
              bg: segmentBgForUsage(usage?.percent),
              fg: PALETTE.fgLight,
            });
            nerdSegments.push({ text: vcsText, bg: PALETTE.vcsBg, fg: PALETTE.fgLight });

            const rendered = renderNerdSegments(nerdSegments);
            return [truncateToWidth(rendered, width, "…", true)];
          }

          const asciiEntries: Array<{ text: string; color: SegmentColor }> = [];
          if (settings.showModeSegment) {
            asciiEntries.push({ text: modeText, color: agentBusy ? "warning" : "accent" });
          }
          asciiEntries.push({ text: modelText, color: "accent" });
          asciiEntries.push({ text: contextText, color: segmentColorForUsage(usage?.percent) });
          asciiEntries.push({ text: vcsText, color: gitBranch || jjBookmark ? "success" : "muted" });

          const rendered = renderAsciiSegments(theme, asciiEntries);
          return [truncateToWidth(rendered, width, "…", true)];
        },
      };
    });
  }

  function applyUi(ctx: ExtensionContext): void {
    if (!enabled) {
      ctx.ui.setHeader(undefined);
      ctx.ui.setFooter(undefined);
      return;
    }

    headerData = buildHeaderData(ctx, pi);
    installHeader(ctx);
    installFooter(ctx);
    void refreshRateLimitUsage(true);
  }

  async function refreshJjBookmark(force = false): Promise<void> {
    if (!currentCtx) return;

    const now = Date.now();
    if (!force && now - lastJjRefresh < JJ_REFRESH_MS) return;
    lastJjRefresh = now;

    const rootCheck = await pi.exec("jj", ["root"], { timeout: 1_200 }).catch(() => null);
    if (!rootCheck || rootCheck.code !== 0) {
      if (jjBookmark !== null) {
        jjBookmark = null;
        requestFooterRender?.();
      }
      return;
    }

    const bookmarkResult = await pi
      .exec("jj", ["log", "-r", "@", "--no-graph", "-T", "bookmarks"], { timeout: 1_200 })
      .catch(() => null);

    const nextBookmark = bookmarkResult && bookmarkResult.code === 0
      ? parseJjBookmarkSummary(bookmarkResult.stdout)
      : null;

    if (nextBookmark !== jjBookmark) {
      jjBookmark = nextBookmark;
      requestFooterRender?.();
    }
  }

  function boot(ctx: ExtensionContext): void {
    currentCtx = ctx;
    settings = readLitelineSettings(ctx.cwd);
    recalcGlyphMode();
    applyUi(ctx);
    void refreshJjBookmark(true);
  }

  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;
    boot(ctx);
  });

  pi.on("session_switch", async (_event, ctx) => {
    if (!ctx.hasUI) return;
    boot(ctx);
  });

  pi.on("model_select", async (_event, ctx) => {
    currentCtx = ctx;
    requestFooterRender?.();
    if (enabled && settings.showHeader) {
      installHeader(ctx);
    }
  });

  pi.on("agent_start", async () => {
    agentBusy = true;
    requestFooterRender?.();
  });

  pi.on("agent_end", async (_event, ctx) => {
    agentBusy = false;
    requestFooterRender?.();
    if (enabled && settings.showHeader) {
      installHeader(ctx);
    }
    void refreshRateLimitUsage(true);
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName === "bash" || event.toolName === "edit" || event.toolName === "write") {
      void refreshJjBookmark();
    }
  });

  pi.registerCommand("liteline", {
    description: "Toggle liteline UI and style options",
    handler: async (args, ctx) => {
      const input = (args || "").trim().toLowerCase();

      if (!input) {
        enabled = !enabled;
        applyUi(ctx);
        ctx.ui.notify(enabled ? "Liteline enabled" : "Liteline disabled", "info");
        return;
      }

      if (input === "status") {
        ctx.ui.notify(
          `liteline: ${enabled ? "on" : "off"} | glyphs=${glyphMode} (${settings.glyphPreference}) | mode=${settings.showModeSegment ? "on" : "off"} | header=${settings.showHeader ? "on" : "off"}`,
          "info",
        );
        return;
      }

      if (input === "nerd" || input === "ascii" || input === "auto") {
        settings.glyphPreference = input;
        recalcGlyphMode();
        applyUi(ctx);
        ctx.ui.notify(`Liteline glyphs: ${glyphMode} (${settings.glyphPreference})`, "info");
        return;
      }

      if (input === "mode on" || input === "mode off") {
        settings.showModeSegment = input.endsWith("on");
        applyUi(ctx);
        ctx.ui.notify(`Liteline mode segment: ${settings.showModeSegment ? "on" : "off"}`, "info");
        return;
      }

      if (input === "header on" || input === "header off") {
        settings.showHeader = input.endsWith("on");
        applyUi(ctx);
        ctx.ui.notify(`Liteline header: ${settings.showHeader ? "on" : "off"}`, "info");
        return;
      }

      ctx.ui.notify(
        "Usage: /liteline [status|nerd|ascii|auto|mode on|mode off|header on|header off]",
        "warning",
      );
    },
  });
}
