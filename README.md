# macOS dotfiles

Personal macOS setup for shell, terminal, window management, and CLI tooling.

## What is configured

- `.zshrc`: oh-my-zsh, aliases, `nvm`, `pyenv`, `starship`, `thefuck`
- `.tmux.conf`: custom keybinds, TPM plugins, `tmux-gruvbox` theme
- `.gitconfig` + `themes.gitconfig`: git aliases and delta theme presets
- `starship.toml`: prompt config (includes `jj-starship` custom module)
- `yabai/yabairc` + `skhd/skhdrc`: tiling and keyboard shortcuts
- `ghostty/config`: terminal defaults used by the `alt + return` shortcut
- `scripts/open_iterm2.sh`: optional iTerm2 launcher script
- `jj/config.toml`: Jujutsu aliases/revsets
- `opencode/`: local OpenCode agent/tool config

## Requirements

- macOS (Sonoma/Sequoia)
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
brew install koekeishiya/formulae/yabai koekeishiya/formulae/skhd koekeishiya/formulae/limelight

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
mkdir -p ~/.config/yabai ~/.config/skhd ~/.config/scripts

ln -sf ~/dev/macOS-dots/.zshrc ~/.zshrc
ln -sf ~/dev/macOS-dots/.tmux.conf ~/.tmux.conf
ln -sf ~/dev/macOS-dots/.gitconfig ~/.gitconfig
ln -sf ~/dev/macOS-dots/starship.toml ~/.config/starship.toml
ln -sf ~/dev/macOS-dots/yabai/yabairc ~/.config/yabai/yabairc
ln -sf ~/dev/macOS-dots/skhd/skhdrc ~/.config/skhd/skhdrc
ln -sf ~/dev/macOS-dots/scripts/open_iterm2.sh ~/.config/scripts/open_iterm2.sh
chmod +x ~/.config/scripts/open_iterm2.sh
```

### 4) Start services and finalize

```bash
brew services start yabai
brew services start skhd

exec zsh
```

Open tmux and press `prefix + I` to install plugins.

## Quick shortcuts

### skhd / yabai

| Shortcut                | Action                |
| ----------------------- | --------------------- |
| `alt + return`          | Open Ghostty          |
| `alt + h/j/k/l`         | Focus window          |
| `shift + alt + h/j/k/l` | Move window           |
| `lctrl + alt + h/j/k/l` | Resize window         |
| `shift + alt + space`   | Toggle float          |
| `ctrl + alt + cmd + r`  | Restart yabai service |

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
ls -l ~/.zshrc ~/.tmux.conf ~/.gitconfig ~/.config/starship.toml ~/.config/yabai/yabairc ~/.config/skhd/skhdrc
brew services list | grep -E 'yabai|skhd'
ls -la ~/.tmux/plugins/tpm
```

## Notes

- `skhdrc` currently opens Ghostty (`alt + return`).
- `open_iterm2.sh` is optional and can be bound if you prefer iTerm2.
- `.tmux.conf` currently uses `egel/tmux-gruvbox`; Catppuccin lines are commented out.
- Yabai may require SIP adjustments for full functionality: <https://github.com/koekeishiya/yabai/wiki/Disabling-System-Integrity-Protection>

## Update

```bash
cd ~/dev/macOS-dots
git pull
```
