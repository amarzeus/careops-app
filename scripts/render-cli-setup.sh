#!/usr/bin/env bash

set -euo pipefail

echo "Render CLI Setup"
echo "================"
echo
if command -v render >/dev/null 2>&1; then
  echo "Render CLI found at: $(command -v render)"
elif [ -x "$HOME/.local/bin/render" ]; then
  echo "Render CLI found at: $HOME/.local/bin/render"
  echo
  echo "Your shell PATH does not include ~/.local/bin yet."
  echo "Add this line to your shell profile (.bashrc, .zshrc, etc.):"
  echo 'export PATH="$HOME/.local/bin:$PATH"'
  echo
  echo "Then reload your shell: source ~/.bashrc"
else
  echo "Render CLI is not installed."
  echo "Install it from Render docs, then run this script again."
  exit 1
fi

echo
echo "Authenticate if needed:"
echo "  ./scripts/render-cli.sh login"
echo
echo "Common commands via wrapper:"
echo "  ./scripts/render-cli.sh blueprints validate render.yaml"
echo "  ./scripts/render-cli.sh services list"
echo "  ./scripts/render-cli.sh deploys list"
echo "  ./scripts/render-cli.sh logs"
