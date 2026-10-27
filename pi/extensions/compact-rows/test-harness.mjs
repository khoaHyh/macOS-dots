import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";

const install = resolve(homedir(), ".local/share/pi/install");
const root = process.env.PI_TEST_PACKAGE_ROOT ?? resolve(install, "releases",
  readFileSync(resolve(install, "current-version"), "utf8").trim(), "node_modules/@earendil-works/pi-coding-agent");
const fromPi = (path) => import(pathToFileURL(resolve(root, path)).href);
const sdk = await fromPi("dist/index.js");
const { loadExtensions } = await fromPi("dist/core/extensions/loader.js");
const { codemodeRenderers } = await fromPi("dist/extensions/codemode/renderer.js");
export const { visibleWidth } = await import(pathToFileURL(resolve(root, "../../@earendil-works/pi-tui/dist/index.js")).href);
const { Text, TuiAltScreen, TuiMainScreen, ProcessTerminal } = await import(pathToFileURL(resolve(root, "../../@earendil-works/pi-tui/dist/index.js")).href);
export { Text, TuiAltScreen, TuiMainScreen, ProcessTerminal };

sdk.initTheme("dark", false);
const cwd = dirname(fileURLToPath(import.meta.url));
const native = new Map([
  ["bash", sdk.createBashToolDefinition(cwd)],
  ["read", sdk.createReadToolDefinition(cwd)],
  ["edit", sdk.createEditToolDefinition(cwd)],
  ["write", sdk.createWriteToolDefinition(cwd)],
  ["codemode", codemodeRenderers],
]);

export const textResult = (text, details) => ({ content: [{ type: "text", text }], details });
export const plainLines = (row, width = 96) => row.render(width).map(stripVTControlCharacters);
export const contentLines = (row, width = 96) => plainLines(row, width).filter((line) => line.trim());

export async function fixture(requestRender = () => {}) {
  const loaded = await loadExtensions([resolve(cwd, "index.ts")], cwd);
  if (loaded.errors.length) throw new Error(JSON.stringify(loaded.errors));
  const extension = loaded.extensions[0];
  const rows = [];
  let expanded = false;
  const notifications = [];
  const ui = {
    getToolsExpanded: () => expanded,
    setToolsExpanded(value) {
      if (expanded === value) return;
      expanded = value;
      for (const row of rows) row.setExpanded(value);
      requestRender();
    },
    notify(message, type) { notifications.push({ message, type }); },
  };
  return {
    rows, notifications,
    expanded: () => expanded,
    async details(args = "", mode = "tui") {
      await extension.commands.get("details").handler(args, { mode, ui });
    },
    row(name, args, result, options = {}) {
      const base = options.original ?? native.get(name);
      const renderers = extension.toolRenderers[0](name, () => base);
      const row = new sdk.ToolExecutionComponent(name, `fixture-${rows.length}`, args,
        { showImages: false }, renderers, { requestRender }, cwd);
      row.setArgsComplete();
      row.markExecutionStarted();
      row.setExpanded(expanded);
      if (result) row.updateResult({ ...result, isError: options.isError ?? false, durationMs: 123 }, options.partial ?? false);
      rows.push(row);
      return row;
    },
  };
}
