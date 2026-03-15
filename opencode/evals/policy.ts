import { getFixture } from "./core";
import type { Fixture, FixtureName } from "./core";

type PolicyInput = {
  fixture: FixtureName;
  keywordHint?: string;
  codebaseDiscoveryNeeded?: boolean;
  externalResearchNeeded?: boolean;
  dialecticRequested?: boolean;
  firstPassFailed?: boolean;
  unresolvedAmbiguity?: boolean;
};

export function evaluatePolicy(input: PolicyInput): Fixture {
  let result = getFixture(input.fixture);

  if (!result.escalation.length) {
    if (input.codebaseDiscoveryNeeded) {
      result = { ...result, escalation: ["explore"], escalationReason: "codebase-discovery" };
    } else if (input.externalResearchNeeded) {
      result = { ...result, escalation: ["librarian"], escalationReason: "external-research" };
    }
  }

  if (input.dialecticRequested) {
    result = { ...result, review: "dialectic" };
  }

  if (input.firstPassFailed && input.unresolvedAmbiguity && !result.escalation.includes("oracle")) {
    result = {
      ...result,
      escalation: [...result.escalation, "oracle"],
      escalationReason: "unresolved-first-pass",
    };
  }

  if (result.escalation.length > 2) {
    result = { ...result, escalation: result.escalation.slice(0, 2) };
  }

  return result;
}
