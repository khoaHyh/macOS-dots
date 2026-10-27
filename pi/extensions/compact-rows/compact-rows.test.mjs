import assert from "node:assert/strict";
import test from "node:test";
import { contentLines, fixture, plainLines, textResult, Text, visibleWidth } from "./test-harness.mjs";

const script = 'const result = await tools.read({path: "settings.json"});\ntext(result); // SCRIPT_END';
const output = Array.from({ length: 20 }, (_, i) => `OUTPUT_${i + 1}`).join("\n");
const codeResult = textResult(output, { calls: [
  { name: "read", args: '{"path":"settings.json"}', status: "ok" },
  { name: "read", args: '{"path":"other.json"}', status: "ok" },
] });

test("successful collapsed tools use one content line, including codemode and skill reads", async () => {
  const app = await fixture();
  const cases = [
    ["bash", { command: 'rg "pattern" src' }, textResult(output), /bash · rg "pattern" src · 20 lines/],
    ["codemode", { code: script }, codeResult, /code · 2 reads/],
    ["read", { path: "/skills/diagnosing-bugs/SKILL.md" }, textResult(output), /skill · diagnosing-bugs/],
    ["read", { path: "/project/AGENTS.md" }, textResult(output), /instructions · \/project\/AGENTS.md/],
    ["edit", { path: "src/main.ts", oldText: "old", newText: "new" }, textResult("updated", { diff: "-old\n+new" }), /edit · src\/main.ts/],
    ["write", { path: "new.txt", content: output }, textResult("written"), /write · new.txt/],
    ["unknown_tool", { query: "something" }, textResult(output), /unknown_tool · something/],
  ];
  for (const [name, args, result, expected] of cases) {
    const row = app.row(name, args, result);
    for (const width of [16, 40, 96]) {
      const lines = contentLines(row, width);
      assert.equal(lines.length, 1, `${name} at ${width} columns`);
      assert(visibleWidth(lines[0]) <= width);
      assert(!lines[0].includes("OUTPUT_") && !lines[0].includes("SCRIPT_END"));
    }
    assert.match(contentLines(row).join("\n"), expected);
    assert.match(contentLines(row).join("\n"), /✓.*123ms/);
  }
});

test("expansion restores native scripts, complete output, read content and diffs", async () => {
  const app = await fixture();
  const code = app.row("codemode", { code: script }, codeResult);
  const read = app.row("read", { path: "/skills/example/SKILL.md" }, textResult("SKILL_BODY"));
  const edit = app.row("edit", { path: "main.ts" }, textResult("updated", { diff: "-REMOVED_LINE\n+ADDED_LINE", firstChangedLine: 1 }));
  await app.details("detailed");
  const codeText = plainLines(code).join("\n");
  assert.match(codeText, /SCRIPT_END/);
  assert.match(codeText, /OUTPUT_20/);
  assert.match(codeText, /settings.json/);
  assert.match(plainLines(read).join("\n"), /SKILL_BODY/);
  assert.match(plainLines(edit).join("\n"), /REMOVED_LINE/);
  assert.match(plainLines(edit).join("\n"), /ADDED_LINE/);
  await app.details();
  assert.equal(contentLines(code).length, 1);
  assert.doesNotMatch(plainLines(code).join("\n"), /SCRIPT_END|OUTPUT_20/);
});

test("outer errors and caught nested errors/cancellations never look successful", async () => {
  const app = await fixture();
  const cases = [
    ["bash", { command: "npm test" }, textResult("Tests starting\nAssertion failed: expected 200, received 500\nProcess exited with code 1"), { isError: true }, /Assertion failed/],
    ["codemode", { code: script }, textResult("Caught it; script completed", { calls: [
      { name: "read", args: "missing.ts", status: "error", error: "ENOENT: missing.ts" },
    ] }), {}, /ENOENT: missing.ts/],
    ["codemode", { code: script }, textResult("", { calls: [
      { name: "bash", args: "sleep 20", status: "cancelled" },
    ] }), {}, /bash: cancelled/],
  ];
  for (const [name, args, result, options, expected] of cases) {
    const row = app.row(name, args, result, options);
    const text = contentLines(row).join("\n");
    assert.match(text, expected);
    assert.match(text, /✗|⊘/);
    assert.doesNotMatch(text, /✓/);
    assert(contentLines(row).length <= 4);
  }
});

test("in-flight rows stay pending and completion updates the same header", async () => {
  const app = await fixture();
  const row = app.row("codemode", { code: script });
  assert.match(contentLines(row)[0], /… code/);
  assert.doesNotMatch(contentLines(row)[0], /✓/);
  row.updateResult(textResult("", { calls: [{ name: "read", status: "running" }] }), true);
  assert.match(contentLines(row)[0], /… code · 1 read/);
  row.updateResult({ ...codeResult, durationMs: 2100, isError: false });
  assert.match(contentLines(row)[0], /✓ code · 2 reads · 2.1s/);
  assert.equal(contentLines(row).length, 1);
});

test("truncation is visible without leaking a multi-line command or terminal controls", async () => {
  const app = await fixture();
  const row = app.row("bash", { command: "rg '🧑‍💻 日本語'\n\t src\u001b[31m\u001b]0;title\u0007" + " --glob '*.tsx'".repeat(15) },
    textResult(output, { truncation: { truncated: true }, fullOutputPath: "/tmp/full.log" }));
  assert.match(contentLines(row)[0], /truncated/);
  assert.doesNotMatch(contentLines(row)[0], /title/);
  for (const width of [1, 2, 6, 24, 40, 96]) {
    const lines = contentLines(row, width);
    assert(lines.length <= 1);
    for (const line of plainLines(row, width)) {
      assert(visibleWidth(line) <= width, `overflow at ${width}: ${line}`);
      assert.doesNotMatch(line, /[\n\r\t\u001b]/);
    }
  }
  await app.details("detailed");
  assert.match(plainLines(row).join("\n"), /Full output: \/tmp\/full.log/);
});

test("native mouse expansion and /details share state, including explicit mode resets", async () => {
  const app = await fixture();
  const row = app.row("bash", { command: "printf inspectable" }, textResult("INSPECTABLE_OUTPUT"));
  row.render(96);
  row.handleMouse({ type: "click", button: "left", x: 2, y: 1, width: 96, height: 4 });
  assert.match(plainLines(row).join("\n"), /INSPECTABLE_OUTPUT/);
  await app.details("compact");
  assert.doesNotMatch(plainLines(row).join("\n"), /INSPECTABLE_OUTPUT/);
  await app.details();
  assert.match(plainLines(row).join("\n"), /INSPECTABLE_OUTPUT/);
  await app.details("status");
  assert.match(app.notifications.at(-1).message, /detailed/);
  await app.details("typo");
  assert.match(app.notifications.at(-1).message, /Usage:/);
  assert(app.expanded());
  await app.details("compact", "rpc");
  assert(app.expanded());
  assert.match(app.notifications.at(-1).message, /terminal UI/);
});

test("custom interactive renderers are left intact and unregistered-tool details remain inspectable", async () => {
  const app = await fixture();
  const original = {
    renderShell: "self",
    renderCall: () => new Text("Question: choose a target", 0, 0),
    renderResult: () => new Text("Selected: staging", 0, 0),
  };
  const question = app.row("ask_user_question", {}, textResult("staging"), { original });
  assert.match(plainLines(question).map((line) => line.trimEnd()).join("\n"), /Question: choose a target\nSelected: staging/);
  const generic = app.row("unknown_tool", { query: "FULL_ARGUMENT" }, textResult("FULL_RESULT"));
  generic.setExpanded(true);
  assert.match(plainLines(generic).join("\n"), /FULL_ARGUMENT/);
  assert.match(plainLines(generic).join("\n"), /FULL_RESULT/);
});
