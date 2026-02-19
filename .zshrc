export ZSH="$HOME/.oh-my-zsh"

export NVM_DIR="$HOME/.nvm"
export NVM_HOMEBREW=$(brew --prefix nvm)

plugins=(vi-mode nvm)

ZSH_DISABLE_COMPFIX="true"

zstyle ':omz:plugins:nvm' lazy yes
zstyle ':omz:plugins:nvm' autoload yes

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

## opencode
alias oc=opencode

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

export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

export PATH=$PATH:/Users/khuynh/.spicetify
export PATH="$HOME/.bun/bin:$PATH"
export PATH="$HOME/.local/bin:$PATH"
