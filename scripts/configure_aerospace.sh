#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_config="$script_dir/../aerospace/aerospace.toml"
gap_helper="$script_dir/aerospace_top_gap.swift"
config_home="${XDG_CONFIG_HOME:-$HOME/.config}"
output_config="${AEROSPACE_CONFIG_PATH:-$config_home/aerospace/aerospace.toml}"

if [[ ! -f "$source_config" ]]; then
  printf 'AeroSpace source config not found: %s\n' "$source_config" >&2
  exit 1
fi

built_in_top_gap="$(/usr/bin/swift "$gap_helper")"
if [[ ! "$built_in_top_gap" =~ ^[0-9]+$ ]]; then
  printf 'Invalid built-in display top gap: %s\n' "$built_in_top_gap" >&2
  exit 1
fi

output_dir="$(dirname -- "$output_config")"
mkdir -p "$output_dir"
temporary_config="$(mktemp "$output_config.tmp.XXXXXX")"

cleanup() {
  rm -f "$temporary_config"
}
trap cleanup EXIT INT TERM

/usr/bin/awk -v gap="$built_in_top_gap" '
  /^[[:space:]]*outer\.top = \[\{ monitor\."built-in" = [0-9]+ \}, 40\]$/ {
    print "    outer.top = [{ monitor.\"built-in\" = " gap " }, 40]"
    replacements++
    next
  }
  { print }
  END {
    if (replacements != 1) {
      print "Expected exactly one generated outer.top setting" > "/dev/stderr"
      exit 1
    }
  }
' "$source_config" > "$temporary_config"

chmod 644 "$temporary_config"

if [[ -e "$output_config" ]] && cmp -s "$temporary_config" "$output_config"; then
  rm -f "$temporary_config"
  trap - EXIT INT TERM
  config_changed=false
else
  mv -f "$temporary_config" "$output_config"
  trap - EXIT INT TERM
  config_changed=true
fi

aerospace_bin="$(command -v aerospace || true)"
if [[ -z "$aerospace_bin" && -x /opt/homebrew/bin/aerospace ]]; then
  aerospace_bin=/opt/homebrew/bin/aerospace
fi
if [[ -z "$aerospace_bin" && -x /usr/local/bin/aerospace ]]; then
  aerospace_bin=/usr/local/bin/aerospace
fi

if [[ -n "$aerospace_bin" ]]; then
  loaded_config="$($aerospace_bin config --config-path 2>/dev/null || true)"
  if [[ "$loaded_config" == "$output_config" ]]; then
    "$aerospace_bin" reload-config --dry-run --no-gui
    "$aerospace_bin" reload-config --no-gui
  fi
fi

if [[ "$config_changed" == true ]]; then
  action=Generated
else
  action=Verified
fi
printf '%s %s with a %s-point built-in display top gap.\n' \
  "$action" "$output_config" "$built_in_top_gap"
