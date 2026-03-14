import { describe, expect, test } from "bun:test";
import { evaluatePolicy } from "../evals/policy";

describe("routing and review policy", () => {
  test("uses Bob + light review for trivial work", () => {
    expect(evaluatePolicy({ fixture: "trivial-build" })).toMatchObject({
      route: "Bob",
      review: "light",
      escalation: [],
      reason: "default-low-risk",
    });
  });

  test("honors explicit Scuba route without planner escalation", () => {
    expect(evaluatePolicy({ fixture: "explicit-scuba" })).toMatchObject({
      route: "Scuba",
      review: "light",
      escalation: [],
      reason: "explicit-scuba",
      source: "explicit",
    });
  });

  test("escalates risky changes with momus review", () => {
    expect(evaluatePolicy({ fixture: "risky-change" })).toMatchObject({
      route: "Bob",
      review: "momus",
      escalation: ["oracle"],
      reason: "risk-threshold",
      source: "automatic",
    });
  });

  test("routes planning flow to PlanB and .specs", () => {
    expect(evaluatePolicy({ fixture: "planning-flow" })).toMatchObject({
      route: "PlanB",
      review: "light",
      planPath: ".specs/example-plan.md",
    });
  });

  test("does not escalate on keyword noise alone", () => {
    expect(evaluatePolicy({ fixture: "trivial-build", keywordHint: "search" }).escalation).toEqual([]);
  });

  test("supports optional dialectic review escalation", () => {
    expect(evaluatePolicy({ fixture: "risky-change", dialecticRequested: true }).review).toBe("dialectic");
  });

  test("keeps escalation depth to one hop", () => {
    expect(evaluatePolicy({ fixture: "risky-change" }).escalation.length).toBeLessThanOrEqual(1);
  });
});
