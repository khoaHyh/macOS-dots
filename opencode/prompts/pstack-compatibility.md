# Pstack compatibility

When following a skill installed from `cursor/plugins`, translate Cursor-specific orchestration to OpenCode:

- Use `explore` for read-only codebase searches, `general` for implementation, and `oracle` for judgment or adversarial review.
- Use background tasks when independent work can run concurrently. Omit Cursor-only task arguments such as `model` and `readonly`.
- Treat Cursor-only built-ins such as `babysit`, `create-skill`, and `loop` as workflow intent. Use the closest available OpenCode skill or tool, and state when no equivalent exists.
- OpenCode agent configuration controls model selection. Do not write `~/.cursor/rules/pstack-models.mdc`; explain this difference if `setup-pstack` is invoked.
