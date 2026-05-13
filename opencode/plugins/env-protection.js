export const EnvProtection = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  return {
    "tool.execute.before": async (input, output) => {
      const filePath = output?.args?.filePath;
      if (input?.tool === "read" && typeof filePath === "string" && filePath.includes(".env")) {
        throw new Error("Do not read .env files");
      }
    },
  };
};
