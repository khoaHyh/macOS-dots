import { describe, expect, test } from "bun:test"
import OrchestratorMinions from "../plugins/orchestrator-minions"

describe("orchestrator minions", () => {
  test("adds v1 orchestrator and minion agents", async () => {
    const plugin = await OrchestratorMinions({} as never)
    const config = { agent: {} }

    await plugin.config?.(config as never)

    expect(config.agent.orchestrator).toMatchObject({
      description: "Coordinates work by delegating implementation tasks to the minion subagent.",
      mode: "primary",
    })
    expect(config.agent.orchestrator.prompt).toContain("Delegate ALL actual work")
    expect(config.agent.orchestrator.prompt).toContain("background: true")

    expect(config.agent.minion).toMatchObject({
      description: "Subagent that executes focused tasks delegated by Orchestrator.",
      mode: "subagent",
      permission: { task: { "*": "deny" } },
    })
    expect(config.agent.minion.prompt).toContain("Do not delegate to other subagents")
  })

  test("preserves existing minion settings while denying nested tasks", async () => {
    const plugin = await OrchestratorMinions({} as never)
    const config = {
      agent: {
        minion: {
          color: "accent",
          model: "opencode-go/glm-5.1",
          permission: {
            bash: "ask",
            task: { general: "allow" },
          },
        },
      },
    }

    await plugin.config?.(config as never)

    expect(config.agent.minion).toMatchObject({
      color: "accent",
      model: "opencode-go/glm-5.1",
      permission: {
        bash: "ask",
        task: {
          general: "allow",
          "*": "deny",
        },
      },
    })
  })
})
