#!/usr/bin/env bash

osascript -e 'tell application id "tracesOf.Uebersicht" to refresh widget id "simple-bar-index-jsx"' >/dev/null 2>&1 || true
