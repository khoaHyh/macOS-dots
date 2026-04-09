import test from "node:test";
import assert from "node:assert/strict";

import {
  abbreviateModel,
  buildLoadedSummaryRows,
  chooseSessionTitle,
  formatCompactNumber,
  formatRecentSessionRow,
  formatCompactContextSegment,
  formatContextSegment,
  formatFooterModelSegment,
  formatFooterVcsSegment,
  formatPlanWindowUsage,
  formatRemainingWindowLabel,
  getStartupLogoAscii,
  limitRecentSessions,
  parseCodexRateLimitPercents,
  parseGraphiteBranchInfoSummary,
  normalizeGlyphPreference,
  resolveGlyphMode,
} from "./liteline-utils.ts";

test("formatCompactNumber formats token-like values", () => {
  assert.equal(formatCompactNumber(999), "999");
  assert.equal(formatCompactNumber(1_200), "1.2k");
  assert.equal(formatCompactNumber(12_500), "12.5k");
  assert.equal(formatCompactNumber(1_250_000), "1.3m");
});

test("formatContextSegment includes percent and remaining when known", () => {
  const text = formatContextSegment({ tokens: 48_500, contextWindow: 200_000, percent: 24.25 });
  assert.equal(text, "ctx 24% 48.5k/200k (151.5k left)");
});

test("formatContextSegment handles unknown token estimates", () => {
  const text = formatContextSegment({ tokens: null, contextWindow: 128_000, percent: null });
  assert.equal(text, "ctx ? 128k");
});

test("formatCompactContextSegment trims footer context copy for nerd glyphs", () => {
  const text = formatCompactContextSegment(
    { tokens: 48_500, contextWindow: 200_000, percent: 24.25 },
    "nerd",
  );

  assert.equal(text, "\uE70F 24% 48.5k/200k");
});

test("formatCompactContextSegment falls back cleanly in ascii mode", () => {
  const text = formatCompactContextSegment(
    { tokens: null, contextWindow: 128_000, percent: null },
    "ascii",
  );

  assert.equal(text, "◫ ? 128k");
});

test("formatFooterModelSegment adds a powerline-style model glyph and compact thinking label", () => {
  assert.equal(
    formatFooterModelSegment("gpt-5.3-codex", "high", "nerd"),
    "\uEC19 gpt-5.3-codex · hi",
  );
  assert.equal(
    formatFooterModelSegment("gpt-5.3-codex", "off", "ascii"),
    "◈ gpt-5.3-codex",
  );
});

test("formatFooterVcsSegment keeps git and graphite details compact", () => {
  assert.equal(
    formatFooterVcsSegment({ gitBranch: "main", graphiteStack: "stack", glyphMode: "nerd" }),
    "\uF126 main · gt stack",
  );
  assert.equal(
    formatFooterVcsSegment({ gitBranch: null, graphiteStack: "stack", glyphMode: "ascii" }),
    "gt stack",
  );
});

test("parseGraphiteBranchInfoSummary treats any successful branch info output as a stack marker", () => {
  assert.equal(parseGraphiteBranchInfoSummary(""), null);
  assert.equal(parseGraphiteBranchInfoSummary("Branch: feature/login"), "stack");
});

test("abbreviateModel trims provider prefix when present", () => {
  assert.equal(abbreviateModel("openai", "gpt-5.3-codex"), "gpt-5.3-codex");
  assert.equal(abbreviateModel("openai", "openai/gpt-5.3-codex"), "gpt-5.3-codex");
});

test("normalizeGlyphPreference accepts supported values", () => {
  assert.equal(normalizeGlyphPreference("nerd"), "nerd");
  assert.equal(normalizeGlyphPreference("ASCII"), "ascii");
  assert.equal(normalizeGlyphPreference("auto"), "auto");
  assert.equal(normalizeGlyphPreference("invalid"), "auto");
});

test("resolveGlyphMode honors explicit env override", () => {
  assert.equal(
    resolveGlyphMode({
      envOverride: "0",
      preference: "nerd",
      termProgram: "WezTerm",
      term: "xterm-256color",
      hasKitty: false,
      hasWezterm: true,
    }),
    "ascii",
  );

  assert.equal(
    resolveGlyphMode({
      envOverride: "true",
      preference: "ascii",
      termProgram: "Terminal.app",
      term: "xterm-256color",
      hasKitty: false,
      hasWezterm: false,
    }),
    "nerd",
  );
});

test("resolveGlyphMode auto-detects known nerd-font terminals", () => {
  assert.equal(
    resolveGlyphMode({
      preference: "auto",
      termProgram: "WezTerm",
      term: "xterm-256color",
      hasKitty: false,
      hasWezterm: false,
    }),
    "nerd",
  );

  assert.equal(
    resolveGlyphMode({
      preference: "auto",
      termProgram: undefined,
      term: "vt100",
      hasKitty: false,
      hasWezterm: false,
    }),
    "ascii",
  );
});

test("resolveGlyphMode treats Ghostty tmux env as nerd-font capable", () => {
  assert.equal(
    resolveGlyphMode({
      preference: "auto",
      termProgram: undefined,
      term: "screen-256color",
      hasKitty: false,
      hasWezterm: false,
      hasGhosttyResourcesDir: true,
    }),
    "nerd",
  );
});

test("buildLoadedSummaryRows keeps labels concise and pluralized", () => {
  const rows = buildLoadedSummaryRows({
    contextFiles: 1,
    extensions: 2,
    skills: 3,
    prompts: 1,
    themes: 0,
  });

  assert.deepEqual(rows, [
    "1 context file",
    "2 extensions",
    "3 skills",
    "1 prompt",
    "0 themes",
  ]);
});

test("limitRecentSessions bounds list for compact welcome header", () => {
  const sessions = ["a", "b", "c", "d"];
  assert.deepEqual(limitRecentSessions(sessions, 3), ["a", "b", "c"]);
  assert.deepEqual(limitRecentSessions([], 3), ["none yet"]);
});

test("formatPlanWindowUsage shows percent and remaining tokens", () => {
  assert.equal(
    formatPlanWindowUsage("5h", 1_000_000, 5_000_000),
    "5h 20% used • 4m left",
  );
});

test("formatPlanWindowUsage handles zero or missing limits", () => {
  assert.equal(formatPlanWindowUsage("5h", 50_000, 0), "5h 50k used • limit unset");
  assert.equal(formatPlanWindowUsage("7d", 0, undefined), "7d 0 used • limit unset");
});

test("getStartupLogoAscii returns the configured liteline logo", () => {
  assert.deepEqual(getStartupLogoAscii(), [
    "▀████████████▀",
    "  ███    ███  ",
    "  ███    ███  ",
    "  ███    ███  ",
    " ▄███▄  ▄███▄ ",
  ]);
});

test("chooseSessionTitle prefers explicit session name over first user text", () => {
  assert.equal(
    chooseSessionTitle({
      sessionName: "Refactor liteline recent sessions",
      firstUserText: "This should not be used",
      fallback: "Mar 22 14:05",
      maxWidth: 40,
    }),
    "Refactor liteline recent sessions",
  );
});

test("chooseSessionTitle falls back to first user text and compacts whitespace", () => {
  assert.equal(
    chooseSessionTitle({
      firstUserText: "  Build    a custom   pi header with recent sessions   ",
      fallback: "Mar 22 14:05",
      maxWidth: 28,
    }),
    "Build a custom pi header…",
  );
});

test("chooseSessionTitle falls back when no session metadata exists", () => {
  assert.equal(
    chooseSessionTitle({ fallback: "Mar 22 14:05", maxWidth: 28 }),
    "Mar 22 14:05",
  );
});

test("formatRecentSessionRow preserves time suffix while truncating long titles", () => {
  assert.equal(
    formatRecentSessionRow({
      active: true,
      title: "Refactor liteline recent sessions to preserve time suffix",
      timeAgo: "17h ago",
      maxWidth: 44,
    }),
    "* Refactor liteline recent… (17h ago)",
  );
});

test("formatRecentSessionRow keeps short titles intact", () => {
  assert.equal(
    formatRecentSessionRow({
      active: false,
      title: "Fix header spacing",
      timeAgo: "just now",
      maxWidth: 44,
    }),
    "- Fix header spacing (just now)",
  );
});

test("formatRemainingWindowLabel shows percent left for bounded usage", () => {
  assert.equal(
    formatRemainingWindowLabel("Session", 1_100_000, 5_000_000),
    "Session (78% left)",
  );
  assert.equal(
    formatRemainingWindowLabel("Weekly", 9_000_000, 50_000_000),
    "Weekly (82% left)",
  );
});

test("formatRemainingWindowLabel handles missing limits concisely", () => {
  assert.equal(formatRemainingWindowLabel("Session", 10_000, undefined), "Session (limit unset)");
});

test("parseCodexRateLimitPercents extracts session and weekly remaining from app-server payload", () => {
  const parsed = parseCodexRateLimitPercents({
    rateLimits: {
      limitId: "codex",
      primary: { usedPercent: 23, windowDurationMins: 300, resetsAt: 1774210316 },
      secondary: { usedPercent: 19, windowDurationMins: 10080, resetsAt: 1774721327 },
    },
  });

  assert.deepEqual(parsed, {
    sessionPercentLeft: 77,
    weeklyPercentLeft: 81,
  });
});

test("parseCodexRateLimitPercents falls back to multi-bucket codex entry", () => {
  const parsed = parseCodexRateLimitPercents({
    rateLimitsByLimitId: {
      codex: {
        limitId: "codex",
        primary: { usedPercent: 22, windowDurationMins: 300, resetsAt: 1 },
        secondary: { usedPercent: 20, windowDurationMins: 10080, resetsAt: 2 },
      },
    },
  });

  assert.deepEqual(parsed, {
    sessionPercentLeft: 78,
    weeklyPercentLeft: 80,
  });
});
