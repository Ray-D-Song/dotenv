.PHONY: install

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
