# macOS dotfiles

Personal macOS setup for shell, terminal, window management, and CLI tooling.

## What is configured

- `.zshrc`: oh-my-zsh, aliases, `nvm`, `pyenv`, `starship`, `thefuck`
- `.tmux.conf`: custom keybinds, TPM plugins, `tmux-gruvbox` theme
- `.gitconfig` + `themes.gitconfig`: git aliases and delta theme presets
- `starship.toml`: prompt config
- `aerospace/aerospace.toml`: source config for tiling and keyboard shortcuts
- `ghostty/config`: terminal defaults used by the `alt + enter` shortcut
- `scripts/open_iterm2.sh`: optional iTerm2 launcher script
- `scripts/configure_aerospace.sh`: generates a display-aware active AeroSpace config
- `opencode/`: local OpenCode agent/tool config
- `pi/`: global pi coding agent config (`settings.json`, `AGENTS.md`, prompts/skills/extensions/themes)

## Requirements

- macOS (Sonoma/Sequoia/Tahoe)
- Homebrew

Secret-enabled `pis` and `pics` sessions also require 1Password
CLI `2.33.0-beta.02` or later with Environment support, a read-only service
account for the selected Environment, and `OPENCODE_1P_ENV_ID` in
`~/.zshrc.private`. The launchers export that Environment selector to the agent
process so repository wrappers can use `op run --environment` without another
setup step.

Store the complete service account token in the login Keychain without placing
it in shell history or a command argument:

1. Copy the complete `ops_` token from 1Password.
2. Open Keychain Access and select the login Keychain.
3. Create or update a Password item named
   `opencode.1password.service-account` with the macOS username as its account.
4. Paste the token into the password field and save the item.

Do not use `security add-generic-password -w` without a value for this token.
Its interactive password reader truncates long values.

Use `agentenv` and `agentclear` to manage the same authentication in a direct
interactive shell. The Pi launchers scope it to the agent process and clear it
automatically on exit.

### OpenCode shortcuts

- `opencode`: plain OpenCode, without caffeinate.
- `oc`: local OpenCode with `caffeinate -id`.
- `occ`: cloud OpenCode with `caffeinate -id`, using the separately configured
  Mac launcher at `~/.local/bin/opencode-cloud`.

Run `source ~/.zshrc` in an existing shell to load changes. The old `occc`
shortcut is retired.

`oc` and `occ` start without inherited 1Password service-account, session,
account-selection, or Connect authentication, with desktop CLI integration
disabled. They pass only the nonsecret Environment selector and
`AGENT_1P_HELPER` location for 1Password access. `oc` preserves normal shared-server
behavior and all CLI arguments, including explicit `--server` / `--standalone`.
`occ` forwards arguments to the cloud launcher; model/MCP authentication and tool
execution remain on the VM. Pi/MCP environment helpers are unchanged.

For local sessions, global `opencode/AGENTS.md` tells the agent to choose a
context internally:
`agents` uses the existing `opencode.1password.service-account` Keychain item;
`staging` uses `opencode.1password.agents-staging`; `environment` uses the first
account plus `OPENCODE_1P_ENV_ID` (legacy `MCP_1P_ENV_ID` also works). Both items
use the macOS username as their account. No grants or credentials are changed.

`scripts/agent-1p contexts` reports configuration status without reading secrets
or checking live access. `scripts/agent-1p <context> -- <trusted-wrapper> [args...]`
reads one selected token just before executing the consumer and fails closed if
local configuration is missing or malformed. It clears conflicting inherited
authentication and never retries another account. Environment mode does **not**
inject all Environment values: the existing owning wrapper must retrieve only
its allowed fields. Consumers must keep secrets out of output, logs, and argv.
Context selection grants neither deployment/apply nor runtime database authority.

This reduces accidental credential inheritance, not malicious same-user access:
local code can access Keychain or disclose a credential supplied to it. There is
no sandbox, additional authentication service, or new secret cache.

#### Activation boundary

Implementation in a worktree does not activate this configuration. After review
and explicit approval, conflict-check the task patch against the canonical
checkout, apply it there, and confirm `scripts/agent-1p` is executable and the
existing `~/.zshrc` / `~/.config/opencode` links still target that checkout. Do
not repoint links or copy runtime `service.json` / credential files.

OpenCode v2.0.29 forwards the client's environment to session shells, but an
**existing shared daemon and its MCP children can retain old credentials**.
At an approved interruption point, finish running work, load the updated shell,
and confirm saved service-environment overrides do not reintroduce 1Password
authentication (inspect names/status only, not values). Then deliberately restart
the shared service from that clean launch context (`oc service restart`) and start
`oc`. This restart needs separate approval;
changing the client alone does not prove server/MCP cleanup. A daemon started
outside these clean launchers, or a remote connection (`occ` or explicit
`--server`), is outside that server-environment guarantee. This does not rotate
OpenCode's separate local API password or change existing sessions automatically.

Offline regression check: `zsh -f scripts/test-agent-1p.zsh`. It uses an empty
HOME, fake credentials, and stub consumers; it makes no live 1Password requests.

## TODOs

- Need a setup/bootstrap script to setup the symlinks and install all the necessary dependencies (`brew install ...`)

## Install

### 1) Clone

```bash
git clone git@github.com:khoaHyh/macOS-dots.git ~/dev/macOS-dots
cd ~/dev/macOS-dots
```

### 2) Install dependencies

```bash
# Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core tools
brew install zsh git vim neovim tmux starship bat fzf direnv git-delta thefuck pyenv rbenv go chruby jq

# Window management
brew install --cask nikitabobko/tap/aerospace

# Terminal apps
brew install --cask ghostty iterm2

# zsh plugin used by .zshrc
brew install zsh-autosuggestions

# Tmux plugin manager
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# Shell bootstrap tools
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

### 3) Symlink configs

```bash
mkdir -p ~/.config/aerospace ~/.config/scripts ~/.pi

ln -sf ~/dev/macOS-dots/.zshrc ~/.zshrc
ln -sf ~/dev/macOS-dots/.tmux.conf ~/.tmux.conf
ln -sf ~/dev/macOS-dots/.gitconfig ~/.gitconfig
ln -sf ~/dev/macOS-dots/.simplebarrc ~/.simplebarrc
ln -sf ~/dev/macOS-dots/starship.toml ~/.config/starship.toml
ln -sf ~/dev/macOS-dots/scripts/open_iterm2.sh ~/.config/scripts/open_iterm2.sh
ln -sf ~/dev/macOS-dots/scripts/refresh_simple_bar.sh ~/.config/scripts/refresh_simple_bar.sh
ln -sf ~/dev/macOS-dots/scripts/simple_bar_htop.sh ~/.config/scripts/simple_bar_htop.sh
[ -d ~/.pi/agent ] && [ ! -L ~/.pi/agent ] && mv ~/.pi/agent ~/.pi/agent.backup.$(date +%Y%m%d-%H%M%S)
ln -sfn ~/dev/macOS-dots/pi ~/.pi/agent
chmod +x ~/.config/scripts/open_iterm2.sh ~/.config/scripts/refresh_simple_bar.sh ~/.config/scripts/simple_bar_htop.sh
chmod +x ~/dev/macOS-dots/scripts/configure_aerospace.sh ~/dev/macOS-dots/scripts/aerospace_top_gap.swift
~/dev/macOS-dots/scripts/configure_aerospace.sh
```

### 4) Start AeroSpace and finalize

```bash
# If migrating from the previous yabai/skhd setup, stop the old services.
brew services stop yabai || true
brew services stop skhd || true
open -a AeroSpace
aerospace reload-config

exec zsh
```

Grant AeroSpace Accessibility permission in System Settings when prompted. The config sets `start-at-login = true`; `aerospace reload-config` applies that setting to the running app.

Open tmux and press `prefix + I` to install plugins.

## Quick shortcuts

### AeroSpace

| Shortcut                  | Action                   |
| ------------------------- | ------------------------ |
| `alt + enter`             | Open Ghostty             |
| `alt + j/k/l/;`           | Focus window             |
| `shift + alt + j/k/l/;`   | Move window              |
| `ctrl + alt + j/k/l/;`    | Focus monitor            |
| `ctrl + shift + alt + j/k/l/;` | Move window to monitor |
| `alt + h/v`               | Split horizontal/vertical |
| `alt + s/w/e`             | Stacked/tabbed/tile layout |
| `alt + 1..0`              | Switch workspace         |
| `shift + alt + 1..0`      | Move window to workspace |
| `alt + r`, then `h/j/k/l` | Resize window            |
| `shift + alt + space`     | Toggle float             |
| `alt + f`                 | Toggle fullscreen        |
| `shift + alt + f`         | Toggle macOS fullscreen  |
| `shift + alt + c`         | Reload AeroSpace config  |
| `ctrl + alt + cmd + r`    | Reload AeroSpace config  |

### tmux

| Shortcut           | Action           |
| ------------------ | ---------------- |
| `C-a`              | Prefix           |
| `Prefix + -`       | Split horizontal |
| `Prefix + _`       | Split vertical   |
| `Prefix + h/j/k/l` | Navigate panes   |
| `Prefix + H/J/K/L` | Resize pane      |
| `Prefix + r`       | Reload config    |

## Verify setup

```bash
ls -l ~/.zshrc ~/.tmux.conf ~/.gitconfig ~/.simplebarrc ~/.config/starship.toml ~/.config/aerospace/aerospace.toml
ls -ld ~/.pi/agent
pgrep -x AeroSpace
ls -la ~/.tmux/plugins/tpm
```

## Notes

- AeroSpace opens Ghostty with `alt + enter` and handles window-manager shortcuts without `skhd`.
- `scripts/refresh_simple_bar.sh` keeps Übersicht/simple-bar in sync with AeroSpace focus/workspace changes.
- AeroSpace workspaces are separate from macOS Mission Control Spaces; simple-bar reflects AeroSpace workspaces in this setup.
- `simple-bar/local-changes.patch` holds local fixes to the simple-bar widget checkout (upstream commit `72fde02`), including a 2-second AppleEvent timeout on Spotify calls so a hung Spotify cannot freeze the bar. Reapply after updating simple-bar:

  ```bash
  cd ~/Library/Application\ Support/Übersicht/widgets/simple-bar
  git apply ~/dev/macOS-dots/simple-bar/local-changes.patch
  ```
- Mission Control's `Option + 1..6` desktop shortcuts should stay disabled so AeroSpace owns `alt + number`.
- Prefer using a single native macOS Desktop per display; use AeroSpace workspaces for day-to-day workspace switching.
- AeroSpace's docs recommend disabling `Displays have separate Spaces` for multi-monitor stability; this requires logging out before it takes effect.
- `scripts/configure_aerospace.sh` calculates the built-in-display top gap from the same AppKit geometry Übersicht uses. Non-notched displays and external displays keep the 40-point simple-bar reservation; notched displays use the notch area only when the menu bar is hidden.
- AeroSpace regenerates that config at startup. After changing menu-bar visibility or connecting/disconnecting displays while AeroSpace is running, use either AeroSpace reload shortcut to recalculate and apply the gap.
- AeroSpace uses the docs' i3-like bindings, but keeps workspaces `1..10` persistent so simple-bar stays stable.
- Legacy `yabai/` and `skhd/` configs remain in the repo for rollback but are no longer installed.
- `open_iterm2.sh` is optional and can be bound if you prefer iTerm2.
- `.tmux.conf` currently uses `egel/tmux-gruvbox`; Catppuccin lines are commented out.
- `~/.pi/agent -> ~/dev/macOS-dots/pi` keeps pi config in this repo; runtime files (`auth.json`, sessions, package installs) are gitignored.
- AeroSpace needs Accessibility permission in System Settings -> Privacy & Security -> Accessibility.

## Update

```bash
cd ~/dev/macOS-dots
git pull
./scripts/configure_aerospace.sh
```
