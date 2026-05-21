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
alias gd='git -c core.pager=delta diff'
# Uncommitted vs your last commit (HEAD)
alias gdh='git --no-pager -c diff.external=difft diff HEAD' 
# Everything on your branch (committed + uncommitted) vs base branch divergence. Usage: `gdm master` or `gdm main`.
alias gdm='git --no-pager -c diff.external=difft diff --merge-base' 
alias glog='git log --oneline --decorate --graph'
alias gs='git switch'
alias gwr='git worktree remove'
alias gwp='git worktree prune'

# Add aliases for homebrew vim
alias vi=/usr/local/bin/vim
alias vim=/usr/local/bin/vim

## opencode
export OPENCODE_ENABLE_EXA=1

# Local-only shell overrides (not tracked in dotfiles)
if [[ -f "$HOME/.zshrc.private" ]]; then
  source "$HOME/.zshrc.private"
fi

# Allow re-sourcing this file even if older alias-based helpers are loaded.
unalias oc occ ocs occs ocenv occlear mcpenv mcpclear pienv piclear pis pics 2>/dev/null

typeset -ga _MCP_AGENT_ENV_VARS=(
  EXECUTOR_MCP_AUTHORIZATION
  SLACK_MCP_XOXP_TOKEN
  SLACK_MCP_XOXB_TOKEN
  SLACK_MCP_XOXC_TOKEN
  SLACK_MCP_XOXD_TOKEN
)

mcpenv() {
  local env_id="${MCP_1P_ENV_ID:-${OPENCODE_1P_ENV_ID:-}}"

  if [[ -z "$env_id" ]]; then
    print -u2 "MCP_1P_ENV_ID or OPENCODE_1P_ENV_ID is not set. Add one to ~/.zshrc.private."
    return 1
  fi

  local env_output line key value allowed_key loaded=0

  if ! env_output=$(op environment read "$env_id"); then
    return 1
  fi

  if [[ "$env_output" == *"<concealed by 1Password>"* ]]; then
    if ! env_output=$(op run --no-masking --environment "$env_id" -- env); then
      return 1
    fi
  fi

  for key in "${_MCP_AGENT_ENV_VARS[@]}"; do
    unset "$key"
  done

  while IFS= read -r line; do
    [[ -z "$line" || "$line" != *=* ]] && continue
    key=${line%%=*}
    value=${line#*=}

    for allowed_key in "${_MCP_AGENT_ENV_VARS[@]}"; do
      if [[ "$key" == "$allowed_key" ]]; then
        export "$key=$value"
        loaded=1
        break
      fi
    done
  done <<< "$env_output"

  if (( ! loaded )); then
    print -u2 "No MCP variables were loaded from 1Password."
    return 1
  fi
}

mcpclear() {
  local key

  for key in "${_MCP_AGENT_ENV_VARS[@]}"; do
    unset "$key"
  done
}

ocenv() {
  mcpenv
}

occlear() {
  mcpclear
}

oc() {
  opencode "$@"
}

occ() {
  caffeinate -id -- opencode "$@"
}

ocs() {
  ocenv || return
  opencode "$@"
}

occs() {
  ocenv || return
  caffeinate -id -- opencode "$@"
}

pienv() {
  mcpenv
}

piclear() {
  mcpclear
}

pis() {
  pienv || return
  pi "$@"
}

pics() {
  pienv || return
  caffeinate -id -- pi "$@"
}

export EDITOR=/usr/local/bin/vim

# Add GOPATH
export PATH=$PATH:~/go/bin

eval "$(starship init zsh)"

# `bat` config stuff
export BAT_THEME="gruvbox-dark"
alias fzb="fzf --preview 'bat --color=always {}' --preview-window '~3'"

eval $(thefuck --alias)
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh

# zsh-autosuggestions keys
for keymap in main emacs viins vicmd; do
  bindkey -M "$keymap" '^@' autosuggest-accept
done
bindkey '^e' autosuggest-accept

export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - --no-rehash)"

export PATH=$PATH:/Users/khuynh/.spicetify
export PATH="$HOME/.bun/bin:$PATH"
export PATH="$HOME/.local/bin:$PATH"

# copy most recently modified file within a particular directory (includes hidden files)
zlastmod() {
  local dir="${1:-$PWD}"
  local latest=( "$dir"/*(.DNom[1]) )
  (( $#latest )) || { print -u2 "No regular files in $dir"; return 1; }
  printf '%s\n' "${latest[1]}"
}

export GREPTILE_API_KEY="op://Employee/GREPTILE_API_KEY/credential"
# CF CLI completions
[[ -f "/Users/khuynh/.config/cf/completions/_cf.zsh" ]] && source "/Users/khuynh/.config/cf/completions/_cf.zsh"
