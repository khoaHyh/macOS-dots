import { describe, expect, test } from "bun:test";
import { inspectPlanningSurface } from "../evals/planning-surface";

describe("planning flow", () => {
  test("uses .specs as the canonical plan location", () => {
    expect(inspectPlanningSurface().canonicalPlanDirectory).toBe(".specs");
  });

  test("does not keep legacy plan stores as canonical", () => {
    expect(inspectPlanningSurface().legacyCanonicalReferences).toEqual([]);
  });

  test("preserves dialogue-first planning guidance", () => {
    expect(inspectPlanningSurface().dialogueFirst).toBe(true);
  });
});
