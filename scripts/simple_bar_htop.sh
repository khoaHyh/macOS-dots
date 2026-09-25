#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

case "${1:-}" in
  cpu)
    /usr/bin/top -l 2 -s 1 -n 0 | /usr/bin/awk '
      /^CPU usage:/ {
        for (i = 1; i <= NF; i++) {
          if ($(i + 1) == "idle") {
            idle = $i
            sub(/%$/, "", idle)
          }
        }
      }
      END {
        if (idle == "") exit 1
        printf "%.0f%%\n", 100 - idle
      }
    '
    ;;
  memory)
    total=$(/usr/sbin/sysctl -n hw.memsize)
    /usr/bin/vm_stat | /usr/bin/awk -v total="$total" '
      function pages() {
        value = $NF
        gsub(/[^0-9]/, "", value)
        return value + 0
      }
      /page size of/ {
        match($0, /[0-9]+/)
        page_size = substr($0, RSTART, RLENGTH)
      }
      /^Pages wired down:/ { wired = pages() }
      /^Pages purgeable:/ { purgeable = pages() }
      /^Pages occupied by compressor:/ { compressed = pages() }
      /^Anonymous pages:/ { internal = pages() }
      END {
        if (!page_size || !total) exit 1
        active = internal > purgeable ? internal - purgeable : 0
        used = (wired + active + compressed) * page_size
        printf "%.0f%%\n", 100 * used / total
      }
    '
    ;;
  *)
    printf "usage: %s {cpu|memory}\n" "$0" >&2
    exit 2
    ;;
esac
