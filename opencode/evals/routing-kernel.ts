import { join } from "node:path";
import { parseJsonc } from "./lib/jsonc";
import { readUtf8 } from "./lib/read";

type AgentMode = "primary" | "subagent";

type AgentConfig = {
  mode?: AgentMode;
  prompt?: string;
};

type RoutingConfig = {
  default_agent?: string;
  agent?: Record<string, AgentConfig>;
};

function readConfig(rootDir: string): RoutingConfig {
  return parseJsonc<RoutingConfig>(readUtf8(rootDir, "opencode.jsonc"));
}

function listAgents(agentMap: Record<string, AgentConfig>, mode: AgentMode): string[] {
  return Object.entries(agentMap)
    .filter(([, agent]) => agent.mode === mode)
    .map(([name]) => name)
    .sort();
}

export function inspectRoutingKernel(rootDir = join(import.meta.dir, "..")) {
  const config = readConfig(rootDir);
  const agentMap = config.agent ?? {};

  return {
    defaultAgent: config.default_agent,
    primaryAgents: listAgents(agentMap, "primary"),
    specialistAgents: listAgents(agentMap, "subagent"),
    scubaPrompt: agentMap.Scuba?.prompt,
  };
}
