import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { chooseSessionTitle } from "./liteline-utils.ts";

export interface RecentSessionSummary {
  active: boolean;
  title: string;
  timeAgo: string;
}

interface SessionSummaryOptions {
  sessionDir: string;
  currentSessionFile?: string;
  maxSessions: number;
}

interface SessionInfo {
  type?: string;
  name?: string;
  message?: {
    role?: string;
    content?: unknown;
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function parseSessionTimestamp(fileName: string): Date | null {
  const raw = basename(fileName, ".jsonl").split("_")[0] || "";
  const isoLike = raw.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ":$1:$2.$3Z");
  const parsed = new Date(isoLike);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimeAgo(mtimeMs: number): string {
  const diffMs = Math.max(0, Date.now() - mtimeMs);
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function safeMtime(filePath: string): number {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function extractFirstUserText(entry: SessionInfo): string | undefined {
  const message = entry.message;
  if (!message || message.role !== "user") return undefined;

  if (typeof message.content === "string") {
    return message.content;
  }

  if (!Array.isArray(message.content)) return undefined;

  for (const part of message.content) {
    const record = asRecord(part);
    if (!record || record.type !== "text") continue;

    const text = asNonEmptyString(record.text);
    if (text) return text;
  }

  return undefined;
}

function parseSessionInfoLine(line: string): SessionInfo | null {
  const record = asRecord(JSON.parse(line));
  if (!record) return null;

  const type = typeof record.type === "string" ? record.type : undefined;
  const name = typeof record.name === "string" ? record.name : undefined;

  const messageRecord = asRecord(record.message);
  const message = messageRecord
    ? {
        role: typeof messageRecord.role === "string" ? messageRecord.role : undefined,
        content: messageRecord.content,
      }
    : undefined;

  return {
    type,
    name,
    message,
  };
}

function readSessionTitle(filePath: string, fallback: string): string {
  let latestSessionName: string | undefined;
  let firstUserText: string | undefined;

  let raw = "";
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return fallback;
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let entry: SessionInfo | null = null;
    try {
      entry = parseSessionInfoLine(trimmed);
    } catch {
      continue;
    }

    if (!entry) continue;

    if (entry.type === "session_info") {
      const sessionName = asNonEmptyString(entry.name);
      if (sessionName) {
        latestSessionName = sessionName;
      }
      continue;
    }

    if (!firstUserText) {
      firstUserText = extractFirstUserText(entry);
    }
  }

  return chooseSessionTitle({
    sessionName: latestSessionName,
    firstUserText,
    fallback,
    maxWidth: 34,
  });
}

function listSessionFiles(sessionDir: string): string[] {
  try {
    return readdirSync(sessionDir)
      .filter((entry) => entry.endsWith(".jsonl"))
      .map((entry) => join(sessionDir, entry));
  } catch {
    return [];
  }
}

function buildFallbackLabel(filePath: string): string {
  const parsed = parseSessionTimestamp(filePath);
  if (!parsed) return basename(filePath);

  return `${parsed.toLocaleString("en-US", { month: "short" })} ${String(parsed.getDate()).padStart(2, "0")} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

export function discoverRecentSessions(options: SessionSummaryOptions): RecentSessionSummary[] {
  if (!existsSync(options.sessionDir)) return [];

  const files = listSessionFiles(options.sessionDir);
  files.sort((a, b) => safeMtime(b) - safeMtime(a));

  return files.slice(0, options.maxSessions).map((filePath) => ({
    active: Boolean(options.currentSessionFile && options.currentSessionFile === filePath),
    title: readSessionTitle(filePath, buildFallbackLabel(filePath)),
    timeAgo: formatTimeAgo(safeMtime(filePath)),
  }));
}
