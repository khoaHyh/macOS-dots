import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { discoverRecentSessions } from "./session-history.ts";

test("discoverRecentSessions returns empty list for missing directory", () => {
  const result = discoverRecentSessions({
    sessionDir: "/tmp/does-not-exist-liteline-sessions",
    maxSessions: 3,
  });

  assert.deepEqual(result, []);
});

test("discoverRecentSessions reads titles, active state, and recency", () => {
  const dir = mkdtempSync(join(tmpdir(), "liteline-sessions-"));

  try {
    const newest = join(dir, "2026-03-22T20-16-57-624Z_demo-a.jsonl");
    const older = join(dir, "2026-03-21T20-38-54-253Z_demo-b.jsonl");

    writeFileSync(newest, [
      JSON.stringify({ type: "session_info", name: "Refactor footer rendering" }),
      JSON.stringify({
        type: "message",
        message: {
          role: "user",
          content: [{ type: "text", text: "Fallback user content" }],
        },
      }),
      "",
    ].join("\n"));

    writeFileSync(older, [
        JSON.stringify({
          type: "message",
          message: {
            role: "user",
            content: [{ type: "text", text: "Investigate gt stack footer behavior" }],
          },
        }),
        "",
    ].join("\n"));

    const now = Date.now();
    utimesSync(newest, new Date(now - 10_000), new Date(now - 10_000));
    utimesSync(older, new Date(now - 60_000), new Date(now - 60_000));

    const result = discoverRecentSessions({
      sessionDir: dir,
      currentSessionFile: newest,
      maxSessions: 5,
    });

    assert.equal(result.length, 2);
    assert.equal(result[0]?.active, true);
    assert.equal(result[0]?.title, "Refactor footer rendering");
    assert.equal(result[1]?.active, false);
    assert.match(result[1]?.title ?? "", /Investigate gt stack footer/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
