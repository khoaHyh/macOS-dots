#!/usr/bin/env bash

widget_refresh="$HOME/Library/Application Support/Übersicht/widgets/simple-bar/lib/scripts/refresh-widget.sh"

if [[ -x "$widget_refresh" ]]; then
  "$widget_refresh" >/dev/null 2>&1 || true
  exit 0
fi

lock_dir="${TMPDIR:-/tmp}/simple-bar-refresh-widget.lock"
if ! mkdir "$lock_dir" 2>/dev/null; then
  exit 0
fi

cleanup() {
  rmdir "$lock_dir" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

/usr/bin/osascript \
  -e 'with timeout of 2 seconds' \
  -e 'tell application id "tracesOf.Uebersicht" to refresh widget id "simple-bar-index-jsx"' \
  -e 'end timeout' >/dev/null 2>&1 || true
