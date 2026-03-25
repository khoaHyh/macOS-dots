# CI Failure Signals

Use this reference to quickly classify failures during one-pass CI remediation.

## Likely Actionable (code/config changes needed)

- `error TS` / `TypeError` / `SyntaxError`
- `AssertionError` / test assertion mismatch
- `eslint` / `ruff` / `mypy` violations
- Missing imports/modules caused by code or lockfile changes
- Workflow config mistakes introduced by the branch

## Likely Rerun-Only (infra/flaky)

- `ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`
- `HTTP 5xx` from registries or artifact/CDN downloads
- `The operation was canceled`
- Runner preemption/shutdown messages
- Known flaky test signatures that pass on rerun

## Decision Rule

1. If failure points to deterministic code path or static check output, fix in code/config.
2. If failure is clearly transient infra and no deterministic code signal exists, rerun once.
3. If evidence is mixed, prefer minimal code fix only when backed by logs.
