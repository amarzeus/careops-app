#!/bin/bash

# Render CLI Setup Instructions

echo "🚀 Render CLI Setup"
echo "=================="
echo ""
echo "The Render CLI has been installed to: ~/.local/bin/render"
echo ""
echo "To use it, add this to your shell profile (.bashrc, .zshrc, etc.):"
echo ""
echo 'export PATH="$HOME/.local/bin:$PATH"'
echo ""
echo "Then reload your shell or run:"
echo "source ~/.bashrc  # or .zshrc"
echo ""
echo "🔑 Authentication:"
echo "Run 'render login' to authenticate with your Render account"
echo ""
echo "📋 Useful Commands:"
echo "  render blueprints validate   # Validate render.yaml"
echo "  render services list         # List your services"
echo "  render deploy                # Trigger deployment"
echo "  render logs                  # View service logs"
echo ""
