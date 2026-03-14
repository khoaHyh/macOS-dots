import { getFixture } from "./core";
import { evaluatePolicy } from "./policy";
import { formatFixtureOutput } from "./run-output";

const fixtureFlag = process.argv.indexOf("--fixture");
const fixtureName = fixtureFlag >= 0 ? process.argv[fixtureFlag + 1] : undefined;

if (!fixtureName) {
  console.error("Missing required --fixture <name>");
  process.exit(1);
}

try {
  const validated = getFixture(fixtureName);
  const fixture = evaluatePolicy({ fixture: validated.name });
  for (const line of formatFixtureOutput(fixture)) {
    console.log(line);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
