# Local 1Password access

In `oc` / `occ` sessions, use the executable at `$AGENT_1P_HELPER` for
operation-scoped access. Run `"$AGENT_1P_HELPER" contexts` to discover contexts
and the Environment selector's configuration status; this makes no live request.

- Select `agents` for references in the **Agents** vault, `staging` for
  **Agents – Staging**, and `environment` for the configured 1Password Environment.
  Ask for clarification when the requested resource does not identify a context.
- Invoke `"$AGENT_1P_HELPER" <context> -- <trusted-wrapper> [args...]` internally;
  the user continues to launch with `occ`, without profile commands.
- Prefer the repository's owning secret-consuming wrapper. Environment mode
  supplies authentication and the selector, not Environment values; preserve the
  wrapper's allowlist (including the Foundation wrapper's four-field boundary).
- Keep retrieved secrets inside their intended consumer. Avoid bare `op`, token
  exports, secret-printing commands, and broad Environment injection. If the
  selected account fails, report that operation's error; do not try another account.
- Missing local configuration is distinct from denied or failed live access.
  Do not run authentication/vault-list probes on startup. Read access does not
  authorize deployments, AWS apply operations, or runtime database access.

This helper routes existing read-only accounts to trusted local consumers; it is
not a sandbox. Same-user code can access Keychain, and a consumer can disclose
its supplied credential. Global instructions guide behavior, not OS isolation.
