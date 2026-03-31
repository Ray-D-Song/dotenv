#!/bin/bash

# Auto-detect system theme and switch Zellij color scheme
# Dark mode -> iceberg-dark, Light mode -> iceberg-light
# Supports: macOS, GNOME, KDE

CONFIG_FILE="$HOME/.config/zellij/config.kdl"

# Detect system theme based on OS and DE
detect_theme() {
  local theme="light"
  
  # macOS detection
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if defaults read -g AppleInterfaceStyle 2>/dev/null | grep -q "Dark"; then
      theme="dark"
    fi
  
  # GNOME detection
  elif command -v gsettings &> /dev/null; then
    # Try color-scheme first (GNOME 42+)
    local gnome_theme=$(gsettings get org.gnome.desktop.interface color-scheme 2>/dev/null)
    if [[ "$gnome_theme" == *"dark"* ]]; then
      theme="dark"
    # Fallback to gtk-theme for older GNOME
    elif [[ "$gnome_theme" == *"default"* ]] || [[ -z "$gnome_theme" ]]; then
      local gtk_theme=$(gsettings get org.gnome.desktop.interface gtk-theme 2>/dev/null | tr -d "'")
      if [[ "$gtk_theme" == *"dark"* ]] || [[ "$gtk_theme" == *"Dark"* ]]; then
        theme="dark"
      fi
    fi
  
  # KDE detection
  elif command -v kreadconfig5 &> /dev/null; then
    # Check KDE color scheme
    local kde_scheme=$(kreadconfig5 --file kdeglobals --group General --key ColorScheme 2>/dev/null)
    if [[ "$kde_scheme" == *"Dark"* ]] || [[ "$kde_scheme" == *"dark"* ]]; then
      theme="dark"
    fi
  # Fallback for KDE Plasma 6 (kreadconfig6)
  elif command -v kreadconfig6 &> /dev/null; then
    local kde_scheme=$(kreadconfig6 --file kdeglobals --group General --key ColorScheme 2>/dev/null)
    if [[ "$kde_scheme" == *"Dark"* ]] || [[ "$kde_scheme" == *"dark"* ]]; then
      theme="dark"
    fi
  fi
  
  echo "$theme"
}

# Get current system theme
SYSTEM_THEME=$(detect_theme)

# Get current Zellij theme
ZELLIJ_THEME=$(grep '^theme ' "$CONFIG_FILE" 2>/dev/null | head -1 | sed 's/theme "\(.*\)"/\1/')

# Switch theme if needed
if [[ "$SYSTEM_THEME" == "dark" ]]; then
  if [[ "$ZELLIJ_THEME" != "iceberg-dark" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's/theme ".*"/theme "iceberg-dark"/' "$CONFIG_FILE"
    else
      sed -i 's/theme ".*"/theme "iceberg-dark"/' "$CONFIG_FILE"
    fi
    echo "Switched to dark theme: iceberg-dark"
    echo "Note: Restart Zellij session or create a new one to apply changes"
  fi
else
  if [[ "$ZELLIJ_THEME" != "iceberg-light" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's/theme ".*"/theme "iceberg-light"/' "$CONFIG_FILE"
    else
      sed -i 's/theme ".*"/theme "iceberg-light"/' "$CONFIG_FILE"
    fi
    echo "Switched to light theme: iceberg-light"
    echo "Note: Restart Zellij session or create a new one to apply changes"
  fi
fi
