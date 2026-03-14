import type { Fixture } from "./core";

export function formatFixtureOutput(fixture: Fixture): string[] {
  const lines: string[] = [
    `FIXTURE=${fixture.name}`,
    `ROUTE=${fixture.route}`,
    `REVIEW=${fixture.review}`,
    `REASON=${fixture.reason}`,
    `ESCALATION=${fixture.escalation.join(",") || "none"}`,
  ];

  if (fixture.escalation.length) {
    lines.push(`ESCALATION_REASON=${fixture.escalationReason || fixture.reason}`);
  }
  if (fixture.source) {
    lines.push(`SOURCE=${fixture.source}`);
  }
  if (fixture.planPath) {
    lines.push(`PLAN_PATH=${fixture.planPath}`);
  }

  return lines;
}
