import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readUtf8(rootDir: string, ...segments: string[]): string {
  return readFileSync(join(rootDir, ...segments), "utf8");
}
