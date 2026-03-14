import { readFileSync } from "node:fs";
import { join } from "node:path";

export function inspectRoutingKernel(rootDir = join(import.meta.dir, "..")) {
  const config = JSON.parse(readFileSync(join(rootDir, "opencode.jsonc"), "utf8"));
  const agents = config.agent ?? {};
  const primaryAgents = Object.entries(agents)
    .filter(([, value]) => (value as { mode?: string }).mode === "primary")
    .map(([name]) => name)
    .sort();
  const specialistAgents = Object.entries(agents)
    .filter(([, value]) => (value as { mode?: string }).mode === "subagent")
    .map(([name]) => name)
    .sort();

  return {
    defaultAgent: config.default_agent,
    primaryAgents,
    specialistAgents,
  };
}
