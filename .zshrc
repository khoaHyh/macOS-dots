# Path to your oh-my-zsh installation.
export ZSH="/Users/khuynh/.oh-my-zsh"

plugins=(vi-mode direnv nvm)

ZSH_DISABLE_COMPFIX="true"

# To speed up zsh on startup, defer nvm's load until we use it.
zstyle ':omz:plugins:nvm' lazy yes

source $ZSH/oh-my-zsh.sh
# source /opt/homebrew/opt/chruby/share/chruby/chruby.sh
# auto-switch ruby version according .to ruby-version file
source /opt/homebrew/opt/chruby/share/chruby/auto.sh

# Git aliases
alias ga='git add'
alias gaa='git add .'
alias gcm='git commit -m'
alias gp='git push'
alias gpull='git pull'
alias gd='git diff'
alias glog='git log --oneline --decorate --graph'

# Add aliases for homebrew vim
alias vi=/usr/local/bin/vim
alias vim=/usr/local/bin/vim

# Handle NVM
export NVM_DIR=~/.nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# zsh-autosuggestions keys
bindkey '^ ' autosuggest-accept
bindkey '^e' autosuggest-accept

export EDITOR=/usr/local/bin/vim

# Add pip binaries to $PATH
export PATH=$(python3 -m site --user-base)/bin:$PATH

# Add GOPATH
export PATH=$PATH:~/go/bin

# starship prompt
eval "$(starship init zsh)"
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

# `bat` config stuff
export BAT_THEME="gruvbox-dark"
alias fzb="fzf --preview 'bat --color=always {}' --preview-window '~3'"

eval $(thefuck --alias)
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh
