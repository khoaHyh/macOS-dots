import { Plugin } from "@opencode/plugin";

export default Plugin.define({
  id: "local.env-protection",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {
      const filePath = event.input?.filePath;
      if (event.tool === "read" && typeof filePath === "string" && filePath.includes(".env")) {
        throw new Error("Do not read .env files");
      }
    });
  },
});
