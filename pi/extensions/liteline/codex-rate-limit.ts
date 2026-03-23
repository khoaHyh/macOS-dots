import { spawn } from "node:child_process";
import { parseCodexRateLimitPercents } from "./liteline-utils.ts";

export interface RateLimitUsage {
  sessionPercentLeft?: number;
  weeklyPercentLeft?: number;
}

interface JsonRpcMessage {
  id?: number;
  result?: unknown;
  error?: unknown;
}

function parseJsonRpcMessage(line: string): JsonRpcMessage | null {
  try {
    const parsed = JSON.parse(line);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    return {
      id: typeof record.id === "number" ? record.id : undefined,
      result: record.result,
      error: record.error,
    };
  } catch {
    return null;
  }
}

export async function fetchCodexRateLimitUsage(timeoutMs: number): Promise<RateLimitUsage | null> {
  return await new Promise((resolve) => {
    const child = spawn("codex", ["app-server", "--listen", "stdio://"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let settled = false;
    let stdoutBuffer = "";
    let initializedHandshake = false;

    const finish = (result: RateLimitUsage | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (!child.stdin.destroyed) child.stdin.end();
      if (!child.killed) child.kill();
      resolve(result);
    };

    const writeMessage = (message: unknown) => {
      if (child.stdin.destroyed || settled) return;
      child.stdin.write(`${JSON.stringify(message)}\n`);
    };

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const message = parseJsonRpcMessage(trimmed);
      if (!message) return;

      if (message.error !== undefined) {
        finish(null);
        return;
      }

      if (message.id === 1 && message.result !== undefined && !initializedHandshake) {
        initializedHandshake = true;
        writeMessage({ jsonrpc: "2.0", method: "initialized", params: {} });
        writeMessage({ jsonrpc: "2.0", id: 2, method: "account/rateLimits/read", params: {} });
        return;
      }

      if (message.id === 2 && message.result !== undefined) {
        finish(parseCodexRateLimitPercents(message.result));
      }
    };

    child.stdout.on("data", (chunk: string | Buffer) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
    });

    child.once("error", () => finish(null));
    child.once("exit", () => {
      if (!settled) finish(null);
    });

    const timeout = setTimeout(() => finish(null), timeoutMs);

    writeMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        clientInfo: {
          name: "liteline",
          title: "Liteline",
          version: "0.1.0",
        },
      },
    });
  });
}
