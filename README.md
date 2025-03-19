# macOS Dotfiles

A collection of dotfiles and configuration for a productive macOS development environment. This setup includes configurations for terminal, window management, git, and various development tools.

## Features

- 🖥️ **Window Management**: Tiling window manager using Yabai with Skhd hotkeys
- 🔧 **Terminal**: iTerm2 with Tmux for terminal multiplexing
- 🎨 **Theme**: Moonlight II color scheme with Catppuccin Tmux theme
- 🐚 **Shell**: Zsh with Starship prompt and useful aliases
- 🛠️ **Development**: Support for Node.js, Ruby, Python, Go, and Android development
- 📝 **Editor**: Neovim configuration with helpful plugins

## Requirements

- macOS (tested on Sonoma and Sequoia)
- Homebrew

## Known Issues

- Sending windows to another workspace, via Yabai, isn't working since updating to Sequoia. Looking at a couple fixes atm.

## Installation

### 1. Clone the repository

```bash
git clone git@github.com:khoaHyh/macOS-dots.git ~/.dotfiles
cd ~/.dotfiles
```

### 2. Install dependencies

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install \
  zsh \
  git \
  vim \
  neovim \
  tmux \
  starship \
  bat \
  fzf \
  direnv \
  git-delta \
  thefuck \
  pyenv \
  rbenv \
  go \
  chruby
  
# Terminal enhancements
brew install zsh-autosuggestions

# Window management
brew install koekeishiya/formulae/yabai
brew install koekeishiya/formulae/skhd
brew install koekeishiya/formulae/limelight

# Install iTerm2
brew install --cask iterm2

# Android development
brew install --cask android-studio

# Tmux plugin manager
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
git clone https://github.com/catppuccin/tmux ~/.tmux/plugins/tmux

# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

#### Other programs to install

- [doggo](https://github.com/mr-karan/doggo): A CLI DNS Client written in Golang
- [lazydocker](https://github.com/jesseduffield/lazydocker) - Terminal UI for docker and docker-compose, written in Golang

### 3. Create symbolic links

```bash
# Create necessary directories
mkdir -p ~/.config/yabai
mkdir -p ~/.config/skhd
mkdir -p ~/.config/scripts

# Link configuration files
ln -sf ~/.dotfiles/.zshrc ~/.zshrc
ln -sf ~/.dotfiles/.tmux.conf ~/.tmux.conf
ln -sf ~/.dotfiles/.gitconfig.example ~/.gitconfig
ln -sf ~/.dotfiles/themes.gitconfig ~/dev/macOS-dots/themes.gitconfig
ln -sf ~/.dotfiles/starship.toml ~/.config/starship.toml
ln -sf ~/.dotfiles/yabai/yabairc ~/.config/yabai/yabairc
ln -sf ~/.dotfiles/skhd/skhdrc ~/.config/skhd/skhdrc
ln -sf ~/.dotfiles/scripts/open_iterm2.sh ~/.config/scripts/open_iterm2.sh
chmod +x ~/.config/scripts/open_iterm2.sh

# Import iTerm2 profile
# Open iTerm2 → Preferences → Profiles → Other Actions... → Import JSON Profiles → Select moonlight_ii_profile.json
```

### 4. Start services related to tiling window manager and keybindings

```bash
# Start services
brew services start yabai
brew services start skhd
```

### 5. Finalize setup

```bash
# Reload shell
exec zsh

# Install tmux plugins
# Open tmux and press prefix + I (default prefix is ctrl+a)
```

## Keyboard Shortcuts

### Window Management (skhd)

| Shortcut                | Action                                 |
|-------------------------|----------------------------------------|
| `alt + return`          | Open iTerm2                            |
| `shift + alt + q`       | Close active application               |
| `alt + h/j/k/l`         | Focus window (left/down/up/right)      |
| `shift + alt + h/j/k/l` | Move window (left/down/up/right)       |
| `ctrl + alt + h/j/k/l`  | Resize window                          |
| `alt + f`               | Toggle fullscreen                      |
| `shift + alt + space`   | Toggle float                           |
| `shift + alt + 1-9`     | Move window to space and follow        |
| `ctrl + alt + r`        | Restart yabai                          |

### Terminal (tmux)

| Shortcut               | Action                               |
|------------------------|--------------------------------------|
| `C-a`                  | Prefix (instead of default `C-b`)    |
| `Prefix + -`           | Split horizontally                   |
| `Prefix + _`           | Split vertically                     |
| `Prefix + h/j/k/l`     | Navigate panes                       |
| `Prefix + C-h/C-l`     | Previous/next window                 |
| `Prefix + H/J/K/L`     | Resize pane                          |
| `Prefix + Enter`       | Enter copy mode                      |
| `Prefix + r`           | Reload tmux configuration            |

## Customization

### Change Git Config

Edit `~/.gitconfig` to set your user name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Change Theme

The setup uses the Moonlight II color scheme for iTerm2 and Catppuccin for tmux.
To change themes:

- **iTerm2**: Import a different profile or edit in iTerm2 preferences
- **Tmux**: Edit the `~/.tmux.conf` file to use a different theme
- **Git Delta**: Edit the `~/.gitconfig` file to select a different theme

## Updating

Pull the latest changes from the repository:

```bash
cd ~/.dotfiles
git pull
```

## Troubleshooting

### Yabai and SIP

Yabai works best with System Integrity Protection (SIP) partially disabled. See the [Yabai wiki](https://github.com/koekeishiya/yabai/wiki/Disabling-System-Integrity-Protection) for instructions. I prefer not to disable SIP but you may have a different preference.

### Missing Plugins in Tmux

If tmux plugins are not loading properly:
1. Make sure TPM is installed: `ls -la ~/.tmux/plugins/tpm`
2. Install plugins manually: Open tmux and press `prefix + I`

## Credits

- [Oh My Zsh](https://ohmyz.sh/)
- [Starship Prompt](https://starship.rs/)
- [Yabai](https://github.com/koekeishiya/yabai)
- [Skhd](https://github.com/koekeishiya/skhd)
- [Tmux Plugin Manager](https://github.com/tmux-plugins/tpm)
- [Catppuccin Theme](https://github.com/catppuccin/tmux)
- [Moonlight Theme](https://github.com/atomiks/moonlight-vscode-theme)
