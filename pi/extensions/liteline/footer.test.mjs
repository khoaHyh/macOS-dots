import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";

const install = resolve(homedir(), ".local/share/pi/install");
const root = process.env.PI_TEST_PACKAGE_ROOT ?? resolve(install, "releases",
  readFileSync(resolve(install, "current-version"), "utf8").trim(), "node_modules/@earendil-works/pi-coding-agent");
const fromPi = (path) => import(pathToFileURL(resolve(root, path)).href);
const { loadExtensions } = await fromPi("dist/core/extensions/loader.js");
const { initTheme, theme } = await fromPi("dist/modes/interactive/theme/theme.js");
const { visibleWidth } = await fromPi("../../@earendil-works/pi-tui/dist/index.js");
const cwd = dirname(fileURLToPath(import.meta.url));
initTheme("dark", false);

async function fixture(t) {
  const home = mkdtempSync(resolve(process.env.TMPDIR || "/tmp", "liteline-test-"));
  // No real settings, session history, CLI execution, or account requests.
  const overrides = {
    HOME: home, PATH: home, TERM_PROGRAM: "rex", TERM: "xterm-256color",
    LITELINE_NERD_FONTS: "", KITTY_WINDOW_ID: "", WEZTERM_EXECUTABLE: "", GHOSTTY_RESOURCES_DIR: "",
  };
  const previous = Object.fromEntries(Object.keys(overrides).map((key) => [key, process.env[key]]));
  Object.assign(process.env, overrides);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(home, { recursive: true });
  });

  const loaded = await loadExtensions([resolve(cwd, "index.ts")], home);
  assert.deepEqual(loaded.errors, []);
  loaded.runtime.getCommands = () => [];
  loaded.runtime.getThinkingLevel = () => "high";
  const extension = loaded.extensions[0];
  let footer;
  let usage = { tokens: 0, contextWindow: 272_000, percent: 0 };
  let branch = "main";
  const ctx = {
    hasUI: true, mode: "tui", cwd: home,
    model: { provider: "openai", id: "gpt-6.1-sol" },
    getContextUsage: () => usage,
    sessionManager: { getSessionDir: () => home, getSessionFile: () => undefined },
    ui: {
      getAllThemes: () => [], setHeader() {}, notify() {},
      setFooter(factory) {
        footer?.dispose?.();
        footer = factory?.({ requestRender() {} }, theme, {
          getGitBranch: () => branch, onBranchChange: () => () => {},
        });
      },
    },
  };
  const emit = async (name) => {
    for (const handler of extension.handlers.get(name) ?? []) await handler({}, ctx);
  };
  await emit("session_start");
  t.after(() => footer?.dispose?.());
  return {
    emit,
    command: (args) => extension.commands.get("liteline").handler(args, ctx),
    render: (width = 120) => footer.render(width),
    setUsage(value) { usage = value; },
    setBranch(value) { branch = value; },
  };
}

const backgroundCodes = (line) => line.match(/\x1b\[48;5;\d+m/g) ?? [];

test("footer keeps square colored blocks regardless of terminal or icon preference", async (t) => {
  const app = await fixture(t);
  for (const mode of ["auto", "ascii", "nerd"]) {
    await app.command(mode);
    const [line] = app.render();
    assert.equal(backgroundCodes(line).length, 4, `${mode}: each segment needs its own background`);
    const plain = stripVTControlCharacters(line);
    assert.match(plain, /READY.*gpt-6\.1-sol · hi.*0% 0\/272k.*main/);
    assert.doesNotMatch(plain, /[\[\]\uE0B0-\uE0B3]/, `${mode}: no brackets or powerline arrows`);
    assert.equal(line.trimEnd().endsWith("\x1b[0m"), true, "background must not leak beyond the footer");
  }
});

test("footer preserves busy, usage warnings, mode toggle, and narrow-width bounds", async (t) => {
  const app = await fixture(t);
  await app.emit("agent_start");
  assert.match(stripVTControlCharacters(app.render()[0]), /BUSY/);
  for (const [percent, background] of [[0, 66], [75, 136], [95, 160]]) {
    app.setUsage({ tokens: percent * 2720, contextWindow: 272_000, percent });
    assert(app.render()[0].includes(`\x1b[48;5;${background}m`));
  }
  await app.command("mode off");
  assert.doesNotMatch(stripVTControlCharacters(app.render()[0]), /BUSY|READY/);
  assert.equal(backgroundCodes(app.render()[0]).length, 3);
  app.setUsage(null);
  app.setBranch(null);
  assert.match(stripVTControlCharacters(app.render()[0]), /\?.*no-vcs/);
  for (const width of [1, 2, 8, 32, 64, 120]) {
    const lines = app.render(width);
    assert.equal(lines.length, 1);
    assert(visibleWidth(lines[0]) <= width, `overflow at ${width} columns`);
  }
});
