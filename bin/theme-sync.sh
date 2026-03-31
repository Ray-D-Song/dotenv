#!/bin/bash

# Auto-detect system theme and switch terminal color schemes
# Supported applications: Zellij, Alacritty
# Supports platforms: macOS, GNOME, KDE

# Configuration file paths
ZELLIJ_CONFIG="$HOME/.config/zellij/config.kdl"
ALACRITTY_CONFIG="$HOME/codebase/dotenv/alacritty/alacritty.toml"

# Detect system theme based on OS and desktop environment
detect_system_theme() {
  local theme="light"
  
  # macOS detection via AppleInterfaceStyle
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if defaults read -g AppleInterfaceStyle 2>/dev/null | grep -q "Dark"; then
      theme="dark"
    fi
  
  # GNOME detection via gsettings
  elif command -v gsettings &> /dev/null; then
    # Try color-scheme preference first (GNOME 42+)
    local gnome_theme=$(gsettings get org.gnome.desktop.interface color-scheme 2>/dev/null)
    if [[ "$gnome_theme" == *"dark"* ]]; then
      theme="dark"
    # Fallback to gtk-theme for older GNOME versions
    elif [[ "$gnome_theme" == *"default"* ]] || [[ -z "$gnome_theme" ]]; then
      local gtk_theme=$(gsettings get org.gnome.desktop.interface gtk-theme 2>/dev/null | tr -d "'")
      if [[ "$gtk_theme" == *"dark"* ]] || [[ "$gtk_theme" == *"Dark"* ]]; then
        theme="dark"
      fi
    fi
  
  # KDE Plasma 5 detection via kreadconfig5
  elif command -v kreadconfig5 &> /dev/null; then
    local kde_scheme=$(kreadconfig5 --file kdeglobals --group General --key ColorScheme 2>/dev/null)
    if [[ "$kde_scheme" == *"Dark"* ]] || [[ "$kde_scheme" == *"dark"* ]]; then
      theme="dark"
    fi
  # KDE Plasma 6 detection via kreadconfig6
  elif command -v kreadconfig6 &> /dev/null; then
    local kde_scheme=$(kreadconfig6 --file kdeglobals --group General --key ColorScheme 2>/dev/null)
    if [[ "$kde_scheme" == *"Dark"* ]] || [[ "$kde_scheme" == *"dark"* ]]; then
      theme="dark"
    fi
  fi
  
  echo "$theme"
}

# Cross-platform sed in-place edit
sed_inplace() {
  local pattern="$1"
  local file="$2"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

# Get current system theme
SYSTEM_THEME=$(detect_system_theme)

# Update Zellij theme
if [[ -f "$ZELLIJ_CONFIG" ]]; then
  ZELLIJ_THEME=$(grep '^theme ' "$ZELLIJ_CONFIG" 2>/dev/null | head -1 | sed 's/theme "\(.*\)"/\1/')
  
  if [[ "$SYSTEM_THEME" == "dark" ]]; then
    if [[ "$ZELLIJ_THEME" != "iceberg-dark" ]]; then
      sed_inplace 's/theme ".*"/theme "iceberg-dark"/' "$ZELLIJ_CONFIG"
      echo "[Zellij] Switched to dark theme: iceberg-dark"
    fi
  else
    if [[ "$ZELLIJ_THEME" != "iceberg-light" ]]; then
      sed_inplace 's/theme ".*"/theme "iceberg-light"/' "$ZELLIJ_CONFIG"
      echo "[Zellij] Switched to light theme: iceberg-light"
    fi
  fi
fi

# Update Alacritty theme
if [[ -f "$ALACRITTY_CONFIG" ]]; then
  ALACRITTY_THEME=$(grep 'alacritty-theme/themes/' "$ALACRITTY_CONFIG" | sed 's/.*themes\/\(.*\)\.toml.*/\1/')
  
  if [[ "$SYSTEM_THEME" == "dark" ]]; then
    if [[ "$ALACRITTY_THEME" != "github_dark_tritanopia" ]]; then
      sed_inplace 's/github_light_tritanopia/github_dark_tritanopia/g' "$ALACRITTY_CONFIG"
      echo "[Alacritty] Switched to dark theme: github_dark_tritanopia"
    fi
  else
    if [[ "$ALACRITTY_THEME" != "github_light_tritanopia" ]]; then
      sed_inplace 's/github_dark_tritanopia/github_light_tritanopia/g' "$ALACRITTY_CONFIG"
      echo "[Alacritty] Switched to light theme: github_light_tritanopia"
    fi
  fi
fi
