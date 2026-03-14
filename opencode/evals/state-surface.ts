import { readFileSync } from "node:fs";
import { join } from "node:path";

export function inspectStateSurface(rootDir = join(import.meta.dir, "..", "..")) {
  const completeNextTask = readFileSync(join(rootDir, "opencode", "command", "complete-next-task.md"), "utf8");
  const legacyCanonicalReferences: string[] = [];

  if (completeNextTask.includes("Where `<prd-name>` matches .opencode/state")) {
    legacyCanonicalReferences.push("legacy-prd-path");
  }
  if (
    completeNextTask.includes(".opencode/state/") &&
    !completeNextTask.includes("Treat it as migration-only compatibility input")
  ) {
    legacyCanonicalReferences.push("legacy-state-canonical");
  }

  const canonicalStateRoot = completeNextTask.includes(".specs/<prd-name>/prd.json") ? ".specs" : "unknown";
  return {
    canonicalStateRoot,
    legacyCanonicalReferences,
  };
}
