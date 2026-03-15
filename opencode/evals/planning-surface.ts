import { join } from "node:path";
import { readUtf8 } from "./lib/read";

const canonicalPlanTokens = [".specs/<filename>.md", "`.specs/` as the canonical"] as const;

function hasCanonicalPlanToken(input: string): boolean {
  return canonicalPlanTokens.some((token) => input.includes(token));
}

export function inspectPlanningSurface(rootDir = join(import.meta.dir, "..", "..")) {
  const planSpec = readUtf8(rootDir, "opencode", "command", "plan-spec.md");
  const plannotate = readUtf8(rootDir, "opencode", "command", "plannotate.md");
  const skill = readUtf8(rootDir, ".agents", "skills", "spec-planner", "SKILL.md");
  const combined = [planSpec, plannotate, skill].join("\n");

  return {
    canonicalPlanDirectory: hasCanonicalPlanToken(combined) ? ".specs" : "unknown",
    dialogueFirst: combined.includes("dialogue-first"),
  };
}
