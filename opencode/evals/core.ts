export type FixtureName = "explicit-scuba" | "planning-flow" | "risky-change" | "trivial-build";

export type Fixture = {
  name: FixtureName;
  route: "PlanB" | "Bob" | "Scuba";
  review: "light" | "momus" | "dialectic";
  escalation: string[];
  reason: string;
  source?: "explicit" | "automatic";
  planPath?: string;
  escalationReason?: string;
};

export type RoiMetrics = {
  promptFootprint: number;
  alwaysOnAgents: number;
  timeToFirstActionMs: number;
  tokenCalls: number;
};

const fixtures: Record<FixtureName, Fixture> = {
  "explicit-scuba": {
    name: "explicit-scuba",
    route: "Scuba",
    review: "light",
    escalation: [],
    reason: "explicit-scuba",
    source: "explicit",
  },
  "planning-flow": {
    name: "planning-flow",
    route: "PlanB",
    review: "light",
    escalation: [],
    reason: "planning-request",
    planPath: ".specs/example-plan.md",
  },
  "risky-change": {
    name: "risky-change",
    route: "Bob",
    review: "momus",
    escalation: ["oracle"],
    reason: "risk-threshold",
    source: "automatic",
  },
  "trivial-build": {
    name: "trivial-build",
    route: "Bob",
    review: "light",
    escalation: [],
    reason: "default-low-risk",
  },
};

export function listFixtureNames(): FixtureName[] {
  return Object.keys(fixtures).sort() as FixtureName[];
}

export function getFixture(name: string): Fixture {
  if (!(name in fixtures)) {
    throw new Error(`Unknown fixture: ${name}`);
  }
  return fixtures[name as FixtureName];
}

export function summarizeRoiMetrics(input: { baseline: RoiMetrics; candidate: RoiMetrics }) {
  const { baseline, candidate } = input;
  return {
    baseline,
    candidate,
    deltas: {
      promptFootprint: candidate.promptFootprint - baseline.promptFootprint,
      alwaysOnAgents: candidate.alwaysOnAgents - baseline.alwaysOnAgents,
      timeToFirstActionMs: candidate.timeToFirstActionMs - baseline.timeToFirstActionMs,
      tokenCalls: candidate.tokenCalls - baseline.tokenCalls,
    },
  };
}
