.PHONY: all check install-deps check-deps check-fonts install-fonts check-symlink install-symlink clean help

# Default target: run all checks and installations
all: check install-deps install-fonts install-symlink
	@echo ""
	@echo "========================================"
	@echo "✓ All setup tasks completed!"
	@echo "========================================"

# Run all checks without installing anything
check: check-deps check-fonts check-symlink
	@echo ""
	@echo "========================================"
	@echo "✓ All checks completed!"
	@echo "========================================"

# Check if all dependencies are installed
check-deps:
	@echo "Checking dependencies..."
	@node ./scripts/check_deps.mjs

# Install missing dependencies
install-deps:
	@echo "Installing dependencies..."
	@node ./scripts/install_deps.mjs

# Check if fonts are installed
check-fonts:
	@echo "Checking fonts..."
	@node ./scripts/check_fonts.mjs

# Install fonts
install-fonts:
	@echo "Installing fonts..."
	@node ./scripts/download_nerd_font.mjs

# Check symlink status
check-symlink:
	@echo "Checking symlinks..."
	@node ./scripts/check_symlink.mjs

# Create configuration symlinks
install-symlink:
	@echo "Creating symlinks..."
	@node ./scripts/create_symlink.mjs

# Clean up (placeholder for future cleanup tasks)
clean:
	@echo "Cleaning up..."
	@echo "No cleanup tasks defined yet."

# Display help information
help:
	@echo "Available targets:"
	@echo "  make              - Run all setup tasks (default)"
	@echo "  make all          - Run all setup tasks"
	@echo "  make check        - Run all checks without installing"
	@echo "  make check-deps   - Check if dependencies are installed"
	@echo "  make install-deps - Install missing dependencies"
	@echo "  make check-fonts  - Check if fonts are installed"
	@echo "  make install-fonts- Install fonts"
	@echo "  make check-symlink- Check symlink status"
	@echo "  make install-symlink - Create configuration symlinks"
	@echo "  make clean        - Clean up (placeholder)"
	@echo "  make help         - Display this help message"
