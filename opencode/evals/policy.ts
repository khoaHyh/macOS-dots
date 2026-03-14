import type { Fixture, FixtureName } from "./core";

type PolicyInput = {
  fixture: FixtureName;
  keywordHint?: string;
  codebaseDiscoveryNeeded?: boolean;
  externalResearchNeeded?: boolean;
  dialecticRequested?: boolean;
};

export function evaluatePolicy(input: PolicyInput): Fixture {
  const { fixture, codebaseDiscoveryNeeded, externalResearchNeeded, dialecticRequested } = input;

  let result: Fixture;
  if (fixture === "explicit-scuba") {
    result = {
      name: "explicit-scuba",
      route: "Scuba",
      review: "light",
      escalation: [],
      reason: "explicit-scuba",
      source: "explicit",
    };
  } else if (fixture === "planning-flow") {
    result = {
      name: "planning-flow",
      route: "PlanB",
      review: "light",
      escalation: [],
      reason: "planning-request",
      planPath: ".specs/example-plan.md",
    };
  } else if (fixture === "risky-change") {
    result = {
      name: "risky-change",
      route: "Bob",
      review: "momus",
      escalation: ["oracle"],
      reason: "risk-threshold",
      source: "automatic",
      escalationReason: "risk-threshold",
    };
  } else {
    result = {
      name: "trivial-build",
      route: "Bob",
      review: "light",
      escalation: [],
      reason: "default-low-risk",
    };
  }

  if (!result.escalation.length) {
    if (codebaseDiscoveryNeeded) {
      result = { ...result, escalation: ["explore"], escalationReason: "codebase-discovery" };
    } else if (externalResearchNeeded) {
      result = { ...result, escalation: ["librarian"], escalationReason: "external-research" };
    }
  }

  if (dialecticRequested) {
    result = { ...result, review: "dialectic" };
  }

  if (result.escalation.length > 1) {
    result = { ...result, escalation: result.escalation.slice(0, 1) };
  }

  return result;
}
