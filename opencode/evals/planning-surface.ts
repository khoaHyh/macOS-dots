import { readFileSync } from "node:fs";
import { join } from "node:path";

export function inspectPlanningSurface(rootDir = join(import.meta.dir, "..", "..")) {
  const planSpec = readFileSync(join(rootDir, "opencode", "command", "plan-spec.md"), "utf8");
  const plannotate = readFileSync(join(rootDir, "opencode", "command", "plannotate.md"), "utf8");
  const skill = readFileSync(join(rootDir, ".agents", "skills", "spec-planner", "SKILL.md"), "utf8");
  const combined = [planSpec, plannotate, skill].join("\\n");
  const legacyCanonicalReferences: string[] = [];

  if (combined.includes("`specs/<filename>.md`")) {
    legacyCanonicalReferences.push("specs/<filename>.md");
  }
  if (combined.includes("Spec written to: specs/<filename>.md")) {
    legacyCanonicalReferences.push("specs-confirmation");
  }

  return {
    canonicalPlanDirectory:
      combined.includes(".specs/<filename>.md") || combined.includes("`.specs/` as the canonical")
        ? ".specs"
        : "unknown",
    legacyCanonicalReferences,
    dialogueFirst: combined.includes("dialogue-first"),
  };
}
