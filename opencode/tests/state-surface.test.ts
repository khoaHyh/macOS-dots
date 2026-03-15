import { describe, expect, test } from "bun:test";
import { inspectStateSurface } from "../evals/state-surface";

describe("state surface", () => {
  test("uses .specs as the canonical state root", () => {
    expect(inspectStateSurface()).toEqual({
      canonicalStateRoot: ".specs",
    });
  });
});
