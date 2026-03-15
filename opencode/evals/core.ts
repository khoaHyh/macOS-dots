const fixtureNames = ["explicit-scuba", "planning-flow", "risky-change", "trivial-build"] as const;

export type FixtureName = (typeof fixtureNames)[number];

export type Fixture = {
  name: FixtureName;
  route: "PlanB" | "Bob" | "Scuba";
  review: "light" | "reviewer" | "dialectic";
  escalation: string[];
  reason: string;
  source?: "explicit" | "automatic";
  planPath?: string;
  escalationReason?: string;
};

type FixtureTemplate = Omit<Fixture, "escalation"> & { escalation: readonly string[] };

export type RoiMetrics = {
  promptFootprint: number;
  alwaysOnAgents: number;
  timeToFirstActionMs: number;
  tokenCalls: number;
};

const fixtures = {
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
    review: "reviewer",
    escalation: ["oracle"],
    reason: "risk-threshold",
    source: "automatic",
    escalationReason: "risk-threshold",
  },
  "trivial-build": {
    name: "trivial-build",
    route: "Bob",
    review: "light",
    escalation: [],
    reason: "default-low-risk",
  },
} satisfies Record<FixtureName, FixtureTemplate>;

function isFixtureName(input: string): input is FixtureName {
  return fixtureNames.includes(input as FixtureName);
}

function cloneFixture(fixture: FixtureTemplate): Fixture {
  return {
    ...fixture,
    escalation: [...fixture.escalation],
  };
}

export function listFixtureNames(): FixtureName[] {
  return [...fixtureNames];
}

export function getFixture(name: string): Fixture {
  if (!isFixtureName(name)) {
    throw new Error(`Unknown fixture: ${name}`);
  }
  return cloneFixture(fixtures[name]);
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
