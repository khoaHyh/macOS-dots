#!/bin/zsh -f
# Offline process-boundary proof: no real Keychain, op, server, or model calls.
setopt errexit nounset pipefail
umask 077
root="${0:A:h:h}"
proof=$(mktemp -d "${TMPDIR%/}/agent-1p-routing-proof-XXXXXXXX")
chmod 700 "$proof"
cleanup() {
  local result=$?
  trap - EXIT ZERR
  if (( result )); then cat "$proof/stderr" "$proof/startup-stderr" 2>/dev/null || true; fi
  rm -r -- "$proof"
  exit "$result"
}
trap cleanup EXIT ZERR
mkdir -p "$proof/home/.oh-my-zsh" "$proof/home/share/zsh-autosuggestions"
touch "$proof/home/.oh-my-zsh/oh-my-zsh.sh" "$proof/home/share/zsh-autosuggestions/zsh-autosuggestions.zsh"

cat > "$proof/consumer.zsh" <<'ZSH'
setopt errexit nounset
trap 'print -u2 "Consumer assertion failed at line $LINENO"' ZERR
case "$1" in
  agents|environment) expected=$(printf 'ops_g%0130d' 0) ;;
  staging) expected=$(printf 'ops_s%0130d' 0) ;;
esac
[[ "$OP_SERVICE_ACCOUNT_TOKEN" == "$expected" ]]
[[ "$OP_BIOMETRIC_UNLOCK_ENABLED" == false && "$OP_DEBUG" == false ]]
for name in OP_SESSION OP_SESSION_example OP_ACCOUNT OP_CONNECT_HOST OP_CONNECT_TOKEN; do
  [[ ! -v "$name" ]]
done
[[ "$1" != environment || "$OPENCODE_1P_ENV_ID" == fixture-selector ]]
[[ $# == 3 && "$2" == 'two words' && -z "$3" ]]
touch "$PROOF/consumed"
ZSH

run_helper() {
  /usr/bin/env -i PATH=/usr/bin:/bin HOME="$proof/home" USER=fixture PROOF="$proof" \
    OP_SERVICE_ACCOUNT_TOKEN=ambient-fixture OP_SESSION=ambient-session \
    OP_SESSION_example=ambient-session OP_ACCOUNT=ambient-account \
    OP_CONNECT_HOST=http://fixture OP_CONNECT_TOKEN=ambient-connect \
    OPENCODE_1P_ENV_ID="${selector:-}" FIXTURE_CREDENTIAL="${credential:-valid}" \
    /bin/zsh -fc '
      function /usr/bin/security() {
        print -r -- "$5" >> "$PROOF/keychain-calls"
        case "$FIXTURE_CREDENTIAL" in
          missing) return 1 ;;
          truncated) print -r -- ops_short; return ;;
          whitespace) print -r -- "ops_ bad${(l:130::0:)}"; return ;;
        esac
        case "$5" in
          opencode.1password.service-account) print -r -- "ops_g${(l:130::0:)}" ;;
          opencode.1password.agents-staging) print -r -- "ops_s${(l:130::0:)}" ;;
          *) return 1 ;;
        esac
      }
      source "$@"
    ' zsh "$root/scripts/agent-1p" "$@" > "$proof/stdout" 2> "$proof/stderr"
}

selector=fixture-selector
credential=valid
for context in agents staging environment; do
  : > "$proof/keychain-calls"
  run_helper "$context" -- /bin/zsh -f "$proof/consumer.zsh" "$context" 'two words' ''
  [[ ! -s "$proof/stdout" && ! -s "$proof/stderr" ]]
  [[ -f "$proof/consumed" ]]
  expected_item=opencode.1password.service-account
  [[ "$context" != staging ]] || expected_item=opencode.1password.agents-staging
  [[ "$(< "$proof/keychain-calls")" == "$expected_item" ]]
  rm "$proof/consumed"
done

# Guards must stop before the consumer; credential errors read only that account.
for scenario in unknown delimiter selector missing truncated whitespace; do
  : > "$proof/keychain-calls"
  selector=fixture-selector credential=valid expected_status=1
  args=(agents -- /bin/zsh -f "$proof/consumer.zsh" agents 'two words' '')
  case "$scenario" in
    unknown) args[1]=unknown; expected_status=2 ;;
    delimiter) args[2]=invalid; expected_status=2 ;;
    selector) args[1]=environment; selector='' ;;
    *) credential="$scenario" ;;
  esac
  if run_helper "${args[@]}"; then
    print -u2 "Unexpected success: $scenario"; exit 1
  else
    [[ $? == "$expected_status" ]]
  fi
  [[ ! -f "$proof/consumed" ]]
  case "$scenario" in
    unknown|delimiter|selector) [[ ! -s "$proof/keychain-calls" ]] ;;
    *) [[ "$(< "$proof/keychain-calls")" == opencode.1password.service-account ]] ;;
  esac
  if grep -q 'ops_' "$proof/stdout" "$proof/stderr"; then exit 1; fi
done
selector=fixture-selector credential=valid
: > "$proof/keychain-calls"
run_helper contexts
[[ ! -s "$proof/keychain-calls" ]]
if grep -qE 'fixture-selector|ops_' "$proof/stdout" "$proof/stderr"; then exit 1; fi
if run_helper agents -- /bin/zsh -fc 'exit 37'; then exit 1; else [[ $? == 37 ]]; fi
if run_helper agents -- /bin/zsh -fc 'kill -TERM $$'; then exit 1; else [[ $? == 143 ]]; fi

# Source the real shell file with empty HOME and inert startup dependencies.
/usr/bin/env -i PATH=/usr/bin:/bin HOME="$proof/home" USER=fixture PROOF="$proof" \
  ROOT="$root" /bin/zsh -fc '
  brew() { print -r -- "$HOME"; }
  starship() { :; }; thefuck() { :; }; pyenv() { :; }
  source() {
    case "$1" in
      "$ROOT/.zshrc"|"$HOME"/*) builtin source "$@" ;;
    esac
  }
  function /usr/bin/security() {
    touch "$PROOF/unexpected-keychain"
    printf "ops_s%0130d\n" 0
  }
  occc() { return 99; }
  source "$ROOT/.zshrc"
  setopt errexit nounset
  export OP_SERVICE_ACCOUNT_TOKEN=parent-fixture OP_SESSION=parent-session
  export OP_SESSION_example=parent-session OP_ACCOUNT=parent-account
  export OP_CONNECT_HOST=http://fixture OP_CONNECT_TOKEN=parent-connect
  OPENCODE_1P_ENV_ID=fixture-selector
  opencode() {
    for name in OP_SERVICE_ACCOUNT_TOKEN OP_SESSION OP_SESSION_example OP_ACCOUNT OP_CONNECT_HOST OP_CONNECT_TOKEN; do
      [[ ! -v "$name" ]] || { print -u2 "Launcher leaked 1Password authentication"; return 90; }
    done
    [[ "$OP_BIOMETRIC_UNLOCK_ENABLED" == false ]]
    [[ "$AGENT_1P_HELPER" == "$ROOT/scripts/agent-1p" && "$OPENCODE_1P_ENV_ID" == fixture-selector ]]
    [[ $# == 5 && "$1" == --server && "$2" == http://fixture && "$3" == --standalone && "$4" == "two words" && -z "$5" ]]
    print -r -- clean >> "$PROOF/launches"
    return 23
  }
  caffeinate() {
    local target=opencode
    [[ "$launcher" != occ ]] || target="$HOME/.local/bin/opencode-cloud"
    [[ "$1" == -id && "$2" == -- && "$3" == "$target" ]] || {
      print -u2 "Wrong caffeinated target for $launcher; expected $target"
      return 91
    }
    print -r -- "$launcher" >> "$PROOF/caffeinated"
    shift 3; opencode "$@"
  }
  for launcher in oc occ; do
    if "$launcher" --server http://fixture --standalone "two words" ""; then exit 1; else [[ $? == 23 ]]; fi
    [[ "$OP_SERVICE_ACCOUNT_TOKEN" == parent-fixture && "$OP_SESSION" == parent-session ]]
    [[ "$OP_CONNECT_TOKEN" == parent-connect && "$OP_ACCOUNT" == parent-account ]]
    [[ ! -v AGENT_1P_HELPER && ! -v OP_BIOMETRIC_UNLOCK_ENABLED ]]
  done
  [[ "$(< "$PROOF/launches")" == $'"'"'clean\nclean'"'"' ]]
  [[ "$(< "$PROOF/caffeinated")" == $'"'"'oc\nocc'"'"' ]]
  (( ! ${+functions[occc]} ))
  [[ ! -e "$PROOF/unexpected-keychain" ]]
' > "$proof/startup-stdout" 2> "$proof/startup-stderr"
print -r -- 'PASS: routing, fail-closed guards, argv/exit/signal, discovery, clean launches, parent isolation (offline)'
