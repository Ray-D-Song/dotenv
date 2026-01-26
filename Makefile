.PHONY: install

# Default target: install everything
install:
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
