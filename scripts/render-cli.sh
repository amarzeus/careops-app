#!/usr/bin/env bash

set -euo pipefail

if command -v render >/dev/null 2>&1; then
  RENDER_BIN="$(command -v render)"
elif [ -x "$HOME/.local/bin/render" ]; then
  RENDER_BIN="$HOME/.local/bin/render"
else
  echo "Render CLI not found in PATH or ~/.local/bin/render" >&2
  echo "Install it first, then re-run this command." >&2
  exit 1
fi

exec "$RENDER_BIN" "$@"
