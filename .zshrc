# Path to your oh-my-zsh installation.
export ZSH="/Users/khuynh/.oh-my-zsh"

plugins=(vi-mode nvm)

ZSH_DISABLE_COMPFIX="true"

# To speed up zsh on startup, defer nvm's load until we use it.
zstyle ':omz:plugins:nvm' lazy yes

source $ZSH/oh-my-zsh.sh

# Git aliases
alias ga='git add'
alias gaa='git add .'
alias gcm='git commit -m'
alias gp='git push'
alias gpull='git pull'
alias gd='git diff'
alias glog='git log --oneline --decorate --graph'
alias gs='git switch'

# Add aliases for homebrew vim
alias vi=/usr/local/bin/vim
alias vim=/usr/local/bin/vim

# NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" ] && \. "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" # This loads nvm
[ -s "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" ] && \. "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" # This loads nvm bash_completion

# Handle NVM
export NVM_DIR=~/.nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# zsh-autosuggestions keys
bindkey '^ ' autosuggest-accept
bindkey '^e' autosuggest-accept

export EDITOR=/usr/local/bin/vim

# Add GOPATH
export PATH=$PATH:~/go/bin

eval "$(starship init zsh)"

# `bat` config stuff
export BAT_THEME="gruvbox-dark"
alias fzb="fzf --preview 'bat --color=always {}' --preview-window '~3'"

eval $(thefuck --alias)
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh

# Android dev
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Initialize pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

export PATH=$PATH:/Users/khuynh/.spicetify
export PATH="$HOME/.bun/bin:$PATH"
