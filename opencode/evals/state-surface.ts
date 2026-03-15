import { join } from "node:path";
import { readUtf8 } from "./lib/read";

export function inspectStateSurface(rootDir = join(import.meta.dir, "..", "..")) {
  const completeNextTask = readUtf8(rootDir, "opencode", "command", "complete-next-task.md");

  const canonicalStateRoot = completeNextTask.includes(".specs/<prd-name>/prd.json") ? ".specs" : "unknown";
  return {
    canonicalStateRoot,
  };
}
