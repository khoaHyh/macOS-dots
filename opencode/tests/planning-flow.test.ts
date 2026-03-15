import { describe, expect, test } from "bun:test";
import { inspectPlanningSurface } from "../evals/planning-surface";

describe("planning flow", () => {
  test("uses .specs as the canonical plan location", () => {
    expect(inspectPlanningSurface()).toEqual({
      canonicalPlanDirectory: ".specs",
      dialogueFirst: true,
    });
  });

  test("preserves dialogue-first planning guidance", () => {
    expect(inspectPlanningSurface().dialogueFirst).toBe(true);
  });

  test("does not expose legacy canonical references", () => {
    expect(inspectPlanningSurface()).not.toHaveProperty("legacyCanonicalReferences");
  });
});
