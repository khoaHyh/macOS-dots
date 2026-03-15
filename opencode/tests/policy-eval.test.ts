import { describe, expect, test } from "bun:test";
import { evaluatePolicy } from "../evals/policy";

describe("policy eval", () => {
  test("uses explicit scuba route when explicitly requested", () => {
    expect(evaluatePolicy({ fixture: "explicit-scuba" })).toMatchObject({
      name: "explicit-scuba",
      route: "Scuba",
      review: "light",
      escalation: [],
      reason: "explicit-scuba",
      source: "explicit",
    });
  });

  test("adds external research escalation for low-risk fixtures", () => {
    expect(evaluatePolicy({ fixture: "planning-flow", externalResearchNeeded: true })).toMatchObject({
      name: "planning-flow",
      escalation: ["librarian"],
      escalationReason: "external-research",
    });
  });

  test("keeps pre-existing oracle escalation", () => {
    expect(evaluatePolicy({ fixture: "risky-change", firstPassFailed: true, unresolvedAmbiguity: true })).toMatchObject({
      name: "risky-change",
      escalation: ["oracle"],
      escalationReason: "risk-threshold",
    });
  });

  test("caps escalation fan-out at two agents", () => {
    const result = evaluatePolicy({
      fixture: "trivial-build",
      codebaseDiscoveryNeeded: true,
      firstPassFailed: true,
      unresolvedAmbiguity: true,
    });

    expect(result.escalation).toEqual(["explore", "oracle"]);
  });
});
