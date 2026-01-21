import { execSync } from 'child_process';
import { existsSync, mkdirSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Executes a shell command and logs the result
 * @param {string} command - The shell command to execute
 * @param {string} description - Human-readable description of the command
 * @returns {boolean} True if the command succeeded, false otherwise
 */
function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit', shell: '/bin/bash' });
    console.log(`✓ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Installs curl via apt package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installCurl() {
  console.log('\n📦 Installing curl...');

  if (!runCommand('sudo apt install -y curl', 'Installing curl via apt')) {
    return false;
  }

  console.log('✓ curl installed successfully');
  return true;
}

/**
 * Installs unzip via apt package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installUnzip() {
  console.log('\n📦 Installing unzip...');

  if (!runCommand('sudo apt install -y unzip', 'Installing unzip via apt')) {
    return false;
  }

  console.log('✓ unzip installed successfully');
  return true;
}

/**
 * Installs Neovim by downloading the AppImage from GitHub
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installNvim() {
  console.log('\n📦 Installing Neovim...');

  const nvimDir = join(homedir(), '.local', 'bin');
  if (!existsSync(nvimDir)) {
    mkdirSync(nvimDir, { recursive: true });
  }

  // Download latest stable nvim appimage
  const nvimPath = join(nvimDir, 'nvim');
  const downloadCmd = `curl -Lo ${nvimPath} https://github.com/neovim/neovim/releases/latest/download/nvim.appimage`;

  if (!runCommand(downloadCmd, 'Downloading Neovim')) {
    return false;
  }

  // Make it executable
  try {
    chmodSync(nvimPath, 0o755);
    console.log('✓ Made Neovim executable');
  } catch (error) {
    console.error('✗ Failed to make Neovim executable:', error.message);
    return false;
  }

  console.log(`✓ Neovim installed successfully
  Location: ${nvimPath}
  Make sure ${nvimDir} is in your PATH`);

  return true;
}

/**
 * Installs Go programming language via apt package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installGo() {
  console.log('\n📦 Installing Go...');

  if (!runCommand('sudo apt install -y golang-go', 'Installing Go via apt')) {
    return false;
  }

  console.log('✓ Go installed successfully');
  return true;
}

/**
 * Installs Rust programming language and Cargo via rustup
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installRust() {
  console.log('\n📦 Installing Rust...');

  const installCmd = `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`;

  if (!runCommand(installCmd, 'Installing Rust via rustup')) {
    return false;
  }

  console.log(`✓ Rust installed successfully
  Run: source "$HOME/.cargo/env" to use Rust in this session`);
  return true;
}

/**
 * Installs Alacritty terminal emulator via apt package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installAlacritty() {
  console.log('\n📦 Installing Alacritty...');

  if (!runCommand('sudo apt install -y alacritty', 'Installing Alacritty via apt')) {
    return false;
  }

  console.log('✓ Alacritty installed successfully');
  return true;
}

/**
 * Installs Zellij terminal multiplexer via official installation script
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installZellij() {
  console.log('\n📦 Installing Zellij...');

  const installCmd = `bash <(curl -L https://zellij.dev/launch)`;

  if (!runCommand(installCmd, 'Installing Zellij')) {
    return false;
  }

  console.log('✓ Zellij installed successfully');
  return true;
}

/**
 * Installs Podman container engine via apt package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installPodman() {
  console.log('\n📦 Installing Podman...');

  if (!runCommand('sudo apt-get install -y podman', 'Installing Podman via apt-get')) {
    return false;
  }

  console.log('✓ Podman installed successfully');
  return true;
}

/**
 * Installs missing dependencies on Linux systems
 * @param {import('./check_deps.mjs').CheckDepsResult} result - The result from checkDeps function
 * @returns {Promise<void>}
 */
export async function linuxInstallDeps(result) {
  console.log(`
========================================
Starting Linux dependency installation
========================================`);

  // First run apt update
  console.log('\n📋 Updating package lists...');
  if (!runCommand('sudo apt update', 'Running apt update')) {
    console.error('⚠ Warning: apt update failed, but continuing...');
  }
  if (!runCommand('sudo apt-get update', 'Running apt-get update')) {
    console.error('⚠ Warning: apt-get update failed, but continuing...');
  }

  const { details } = result;
  const installResults = {};

  // Install missing dependencies (install curl and unzip first as they're needed by other installers)
  if (!details.curl) {
    installResults.curl = await installCurl();
  } else {
    console.log('\n✓ curl is already installed');
  }

  if (!details.unzip) {
    installResults.unzip = await installUnzip();
  } else {
    console.log('\n✓ unzip is already installed');
  }

  if (!details.nvim) {
    installResults.nvim = await installNvim();
  } else {
    console.log('\n✓ Neovim is already installed');
  }

  if (!details.go) {
    installResults.go = await installGo();
  } else {
    console.log('\n✓ Go is already installed');
  }

  if (!details.cargo) {
    installResults.cargo = await installRust();
  } else {
    console.log('\n✓ Rust is already installed');
  }

  if (!details.alacritty) {
    installResults.alacritty = await installAlacritty();
  } else {
    console.log('\n✓ Alacritty is already installed');
  }

  if (!details.zellij) {
    installResults.zellij = await installZellij();
  } else {
    console.log('\n✓ Zellij is already installed');
  }

  if (!details.podman) {
    installResults.podman = await installPodman();
  } else {
    console.log('\n✓ Podman is already installed');
  }

  // Summary
  console.log(`
========================================
Installation Summary
========================================`);

  const installed = Object.entries(installResults);
  if (installed.length === 0) {
    console.log('All dependencies were already installed!');
  } else {
    installed.forEach(([dep, success]) => {
      const status = success ? '✓' : '✗';
      console.log(`${status} ${dep}`);
    });
  }

  console.log(`
⚠ Note: You may need to restart your shell or run:
  source ~/.bashrc
  (or source ~/.zshrc if using zsh)

to use the newly installed tools.`);
}
