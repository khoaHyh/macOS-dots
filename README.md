# macOS dotfiles

Personal macOS setup for shell, terminal, window management, and CLI tooling.

## What is configured

- `.zshrc`: oh-my-zsh, aliases, `nvm`, `pyenv`, `starship`, `thefuck`
- `.tmux.conf`: custom keybinds, TPM plugins, `tmux-gruvbox` theme
- `.gitconfig` + `themes.gitconfig`: git aliases and delta theme presets
- `starship.toml`: prompt config
- `aerospace/aerospace.toml`: tiling and keyboard shortcuts
- `ghostty/config`: terminal defaults used by the `alt + enter` shortcut
- `scripts/open_iterm2.sh`: optional iTerm2 launcher script
- `opencode/`: local OpenCode agent/tool config
- `pi/`: global pi coding agent config (`settings.json`, `AGENTS.md`, prompts/skills/extensions/themes)

## Requirements

- macOS (Sonoma/Sequoia/Tahoe)
- Homebrew

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
ln -sf ~/dev/macOS-dots/starship.toml ~/.config/starship.toml
ln -sf ~/dev/macOS-dots/aerospace/aerospace.toml ~/.config/aerospace/aerospace.toml
ln -sf ~/dev/macOS-dots/scripts/open_iterm2.sh ~/.config/scripts/open_iterm2.sh
ln -sf ~/dev/macOS-dots/scripts/refresh_simple_bar.sh ~/.config/scripts/refresh_simple_bar.sh
[ -d ~/.pi/agent ] && [ ! -L ~/.pi/agent ] && mv ~/.pi/agent ~/.pi/agent.backup.$(date +%Y%m%d-%H%M%S)
ln -sfn ~/dev/macOS-dots/pi ~/.pi/agent
chmod +x ~/.config/scripts/open_iterm2.sh ~/.config/scripts/refresh_simple_bar.sh
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
ls -l ~/.zshrc ~/.tmux.conf ~/.gitconfig ~/.config/starship.toml ~/.config/aerospace/aerospace.toml
ls -ld ~/.pi/agent
pgrep -x AeroSpace
ls -la ~/.tmux/plugins/tpm
```

## Notes

- AeroSpace opens Ghostty with `alt + enter` and handles window-manager shortcuts without `skhd`.
- `scripts/refresh_simple_bar.sh` keeps Übersicht/simple-bar in sync with AeroSpace focus/workspace changes.
- AeroSpace workspaces are separate from macOS Mission Control Spaces; simple-bar reflects AeroSpace workspaces in this setup.
- Mission Control's `Option + 1..6` desktop shortcuts should stay disabled so AeroSpace owns `alt + number`.
- Prefer using a single native macOS Desktop per display; use AeroSpace workspaces for day-to-day workspace switching.
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
```
