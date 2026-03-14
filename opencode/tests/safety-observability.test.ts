import { describe, expect, test } from "bun:test";
import { EnvProtection } from "../plugin/env-protection";
import { formatFixtureOutput } from "../evals/run-output";

describe("safety and observability", () => {
  test("blocks reading .env files", async () => {
    const plugin = await EnvProtection({ project: undefined, client: undefined, $: undefined, directory: undefined, worktree: undefined });
    await expect(plugin["tool.execute.before"]({ tool: "read" }, { args: { filePath: "/tmp/.env" } })).rejects.toThrow(/Do not read \.env files/);
  });

  test("allows reading non-env files", async () => {
    const plugin = await EnvProtection({ project: undefined, client: undefined, $: undefined, directory: undefined, worktree: undefined });
    await expect(plugin["tool.execute.before"]({ tool: "read" }, { args: { filePath: "/tmp/readme.md" } })).resolves.toBeUndefined();
  });

  test("run output includes route, review, reason and escalation context", () => {
    const lines = formatFixtureOutput({
      name: "risky-change",
      route: "Bob",
      review: "momus",
      escalation: ["oracle"],
      reason: "risk-threshold",
      source: "automatic",
    });
    expect(lines).toContain("ROUTE=Bob");
    expect(lines).toContain("REVIEW=momus");
    expect(lines).toContain("REASON=risk-threshold");
    expect(lines).toContain("ESCALATION=oracle");
    expect(lines).toContain("ESCALATION_REASON=risk-threshold");
  });
});
