import { summarizeRoiMetrics } from "./core";

const report = summarizeRoiMetrics({
  baseline: {
    promptFootprint: 1200,
    alwaysOnAgents: 8,
    timeToFirstActionMs: 2100,
    tokenCalls: 14,
  },
  candidate: {
    promptFootprint: 500,
    alwaysOnAgents: 3,
    timeToFirstActionMs: 900,
    tokenCalls: 6,
  },
});

for (const [label, metrics] of Object.entries(report)) {
  console.log(`${label}=${JSON.stringify(metrics)}`);
}
