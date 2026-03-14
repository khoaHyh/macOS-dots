import { describe, expect, test } from "bun:test";
import { inspectStateSurface } from "../evals/state-surface";

describe("state surface migration", () => {
  test("uses .specs as canonical task state root", () => {
    expect(inspectStateSurface().canonicalStateRoot).toBe(".specs");
  });

  test("does not advertise .opencode/state as canonical", () => {
    expect(inspectStateSurface().legacyCanonicalReferences).toEqual([]);
  });
});
