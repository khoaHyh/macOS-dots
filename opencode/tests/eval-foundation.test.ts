import { describe, expect, test } from "bun:test";
import { getFixture, listFixtureNames, summarizeRoiMetrics } from "../evals/core";

describe("eval foundation", () => {
  test("lists the baseline fixtures", () => {
    expect(listFixtureNames()).toEqual([
      "explicit-scuba",
      "planning-flow",
      "risky-change",
      "trivial-build",
    ]);
  });

  test("returns structured fixture data", () => {
    expect(getFixture("trivial-build")).toEqual({
      name: "trivial-build",
      route: "Bob",
      review: "light",
      escalation: [],
      reason: "default-low-risk",
    });
  });

  test("throws for missing fixtures", () => {
    expect(() => getFixture("does-not-exist")).toThrow(/Unknown fixture/);
  });

  test("summarizes ROI metrics for baseline and candidate", () => {
    expect(
      summarizeRoiMetrics({
        baseline: { promptFootprint: 1200, alwaysOnAgents: 8, timeToFirstActionMs: 2100, tokenCalls: 14 },
        candidate: { promptFootprint: 500, alwaysOnAgents: 3, timeToFirstActionMs: 900, tokenCalls: 6 },
      }),
    ).toEqual({
      baseline: { promptFootprint: 1200, alwaysOnAgents: 8, timeToFirstActionMs: 2100, tokenCalls: 14 },
      candidate: { promptFootprint: 500, alwaysOnAgents: 3, timeToFirstActionMs: 900, tokenCalls: 6 },
      deltas: { promptFootprint: -700, alwaysOnAgents: -5, timeToFirstActionMs: -1200, tokenCalls: -8 },
    });
  });
});
