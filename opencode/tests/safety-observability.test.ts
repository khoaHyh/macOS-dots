import { describe, expect, test } from "bun:test";
import { EnvProtection } from "../plugin/env-protection";

describe("safety and observability", () => {
  test("blocks reading .env files", async () => {
    const plugin = await EnvProtection({ project: undefined, client: undefined, $: undefined, directory: undefined, worktree: undefined });
    await expect(plugin["tool.execute.before"]({ tool: "read" }, { args: { filePath: "/tmp/.env" } })).rejects.toThrow(/Do not read \.env files/);
  });

  test("allows reading non-env files", async () => {
    const plugin = await EnvProtection({ project: undefined, client: undefined, $: undefined, directory: undefined, worktree: undefined });
    await expect(plugin["tool.execute.before"]({ tool: "read" }, { args: { filePath: "/tmp/readme.md" } })).resolves.toBeUndefined();
  });
});
