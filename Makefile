.PHONY: install update-nvim

# Detect OS and Architecture
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

# Default target: install everything
install:
	@# Check if running with sudo
	@if [ -n "$$SUDO_USER" ]; then \
		echo ""; \
		echo "========================================"; \
		echo "❌ Error: Do not run with sudo!"; \
		echo "========================================"; \
		echo ""; \
		echo "Please run without sudo:"; \
		echo "  make install"; \
		echo ""; \
		echo "The scripts will request sudo privileges when needed."; \
		echo ""; \
		exit 1; \
	fi
	@echo ""
	@echo "========================================"
	@echo "Starting installation process..."
	@echo "========================================"
	@echo ""
	@echo "Step 1/3: Checking and installing dependencies..."
	@node ./scripts/install_deps.mjs
	@echo ""
	@echo "Step 2/3: Checking and installing fonts..."
	@node ./scripts/download_nerd_font.mjs
	@echo ""
	@echo "Step 3/3: Checking and creating symlinks..."
	@node ./scripts/create_symlink.mjs
	@echo ""
	@echo "========================================"
	@echo "✓ Installation completed successfully!"
	@echo "========================================"
	@echo ""

# Update Neovim to the latest version
update-nvim:
	@echo ""
	@echo "========================================"
	@echo "Updating Neovim..."
	@echo "========================================"
	@echo ""
ifeq ($(UNAME_S),Linux)
	@echo "Detected Linux - updating Neovim AppImage..."
	@mkdir -p $(HOME)/.local/bin
	@echo "Architecture: $(UNAME_M)"
	@echo "Downloading latest Neovim AppImage..."
ifeq ($(UNAME_M),x86_64)
	@curl -fsSL -o $(HOME)/.local/bin/nvim https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.appimage || \
		(echo "❌ Primary download failed, trying alternative URL..." && \
		curl -fsSL -o $(HOME)/.local/bin/nvim https://github.com/neovim/neovim/releases/download/stable/nvim-linux-x86_64.appimage)
else ifeq ($(UNAME_M),aarch64)
	@curl -fsSL -o $(HOME)/.local/bin/nvim https://github.com/neovim/neovim/releases/latest/download/nvim-linux-arm64.appimage || \
		(echo "❌ Primary download failed, trying alternative URL..." && \
		curl -fsSL -o $(HOME)/.local/bin/nvim https://github.com/neovim/neovim/releases/download/stable/nvim-linux-arm64.appimage)
else
	@echo "❌ Unsupported architecture: $(UNAME_M)"
	@exit 1
endif
	@chmod 755 $(HOME)/.local/bin/nvim
	@echo ""
	@echo "✓ Neovim updated successfully!"
	@echo "Location: $(HOME)/.local/bin/nvim"
	@echo "Version:"
	@$(HOME)/.local/bin/nvim --version | head -1
else ifeq ($(UNAME_S),Darwin)
	@echo "Detected macOS - updating Neovim via Homebrew..."
	@brew upgrade neovim
	@echo ""
	@echo "✓ Neovim updated successfully!"
	@echo "Version:"
	@nvim --version | head -1
else
	@echo "❌ Unsupported operating system: $(UNAME_S)"
	@exit 1
endif
	@echo ""
