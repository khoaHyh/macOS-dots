import type { Plugin } from "@opencode-ai/plugin"
import os from "node:os"
import path from "node:path"

const SKILL_ENTRY_PATTERN = /\s*<skill>\s*<name>([^<]+)<\/name>[\s\S]*?<\/skill>/g
const POTETO_PROMPTS = [
  "Use `poteto-mode` as the operating style for this session.",
  "Load the `poteto-mode` skill in full before doing any work",
]

export function filterManualSkillCatalog(system: string, manualSkills: ReadonlySet<string>): string {
  if (POTETO_PROMPTS.some((prompt) => system.includes(prompt))) return system

  return system.replace(SKILL_ENTRY_PATTERN, (entry, name: string) =>
    manualSkills.has(name.trim()) ? "" : entry,
  )
}

async function discoverManualSkills(): Promise<Set<string>> {
  const manualSkills = new Set<string>()
  const roots = [path.join(os.homedir(), ".agents"), path.join(os.homedir(), ".claude")]

  for (const root of roots) {
    const glob = new Bun.Glob("skills/*/SKILL.md")
    for await (const file of glob.scan({ cwd: root, absolute: true, onlyFiles: true })) {
      const content = await Bun.file(file).text()
      const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
      if (!frontmatter || !/^disable-model-invocation:\s*true\s*$/m.test(frontmatter)) continue

      const name = frontmatter.match(/^name:\s*["']?([^"'#\r\n]+?)["']?\s*$/m)?.[1]
      if (name) manualSkills.add(name)
    }
  }

  return manualSkills
}

export const ManualSkillVisibility: Plugin = async () => {
  const manualSkills = await discoverManualSkills()

  return {
    "experimental.chat.system.transform": async (_input, output) => {
      output.system = output.system.map((system) => filterManualSkillCatalog(system, manualSkills))
    },
  }
}

export default ManualSkillVisibility
