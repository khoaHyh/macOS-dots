import { describe, expect, test } from "bun:test";
import { inspectRoutingKernel } from "../evals/routing-kernel";

describe("routing kernel", () => {
  test("exposes exactly three primary agents", () => {
    expect(inspectRoutingKernel().primaryAgents).toEqual(["Bob", "PlanB", "Scuba"]);
  });

  test("keeps the named specialists non-primary", () => {
    expect(inspectRoutingKernel().specialistAgents).toEqual([
      "explore",
      "librarian",
      "momus",
      "oracle",
    ]);
  });

  test("uses Bob as the default agent", () => {
    expect(inspectRoutingKernel().defaultAgent).toBe("Bob");
  });
});
