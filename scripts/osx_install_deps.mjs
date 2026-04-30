import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
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
 * Checks if Homebrew is installed
 * @returns {boolean} True if Homebrew is installed
 */
function isHomebrewInstalled() {
  try {
    execSync('which brew', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Installs Homebrew package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installHomebrew() {
  console.log('\n📦 Installing Homebrew...');

  const installCmd = `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;

  if (!runCommand(installCmd, 'Installing Homebrew')) {
    return false;
  }

  console.log('✓ Homebrew installed successfully');
  return true;
}

/**
 * Installs Neovim via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installNvim() {
  console.log('\n📦 Installing Neovim...');

  if (!runCommand('brew install neovim', 'Installing Neovim via Homebrew')) {
    return false;
  }

  console.log('✓ Neovim installed successfully');
  return true;
}

/**
 * Installs Go programming language via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installGo() {
  console.log('\n📦 Installing Go...');

  if (!runCommand('brew install go', 'Installing Go via Homebrew')) {
    return false;
  }

  console.log('✓ Go installed successfully');
  return true;
}

/**
 * Installs mise version manager via official install script
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installMise() {
  console.log('\n📦 Installing mise...');

  const installCmd = `curl https://mise.run | sh`;

  if (!runCommand(installCmd, 'Installing mise')) {
    return false;
  }

  console.log('✓ mise installed successfully');
  return true;
}

/**
 * Installs Rust programming language and Cargo via mise
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installRust() {
  console.log('\n📦 Installing Rust...');

  const misePath = join(homedir(), '.local', 'bin', 'mise');
  const installCmd = `${misePath} use --global rust@latest`;

  if (!runCommand(installCmd, 'Installing Rust via mise')) {
    return false;
  }

  console.log('✓ Rust installed successfully');
  return true;
}

/**
 * Installs Alacritty terminal emulator via Homebrew cask
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installAlacritty() {
  console.log('\n📦 Installing Alacritty...');

  if (!runCommand('brew install --cask alacritty', 'Installing Alacritty via Homebrew')) {
    return false;
  }

  console.log('✓ Alacritty installed successfully');
  return true;
}

/**
 * Installs Zellij terminal multiplexer via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installZellij() {
  console.log('\n📦 Installing Zellij...');

  if (!runCommand('brew install zellij', 'Installing Zellij via Homebrew')) {
    return false;
  }

  console.log('✓ Zellij installed successfully');
  return true;
}

/**
 * Installs curl via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installCurl() {
  console.log('\n📦 Installing curl...');

  if (!runCommand('brew install curl', 'Installing curl via Homebrew')) {
    return false;
  }

  console.log('✓ curl installed successfully');
  return true;
}

/**
 * Installs unzip via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installUnzip() {
  console.log('\n📦 Installing unzip...');

  if (!runCommand('brew install unzip', 'Installing unzip via Homebrew')) {
    return false;
  }

  console.log('✓ unzip installed successfully');
  return true;
}

/**
 * Installs GitHub CLI via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installGh() {
  console.log('\n📦 Installing GitHub CLI...');

  if (!runCommand('brew install gh', 'Installing GitHub CLI via Homebrew')) {
    return false;
  }

  console.log('✓ GitHub CLI installed successfully');
  return true;
}

/**
 * Installs lazygit via Homebrew
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installLazygit() {
  console.log('\n📦 Installing lazygit...');

  if (!runCommand('brew install lazygit', 'Installing lazygit via Homebrew')) {
    return false;
  }

  console.log('✓ lazygit installed successfully');
  return true;
}

/**
 * Zig version - locked to 0.15.2
 * @type {string}
 */
const ZIG_VERSION = '0.15.2';

/**
 * Installs Zig programming language via mise
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installZig() {
  console.log(`\n📦 Installing Zig ${ZIG_VERSION}...`);

  const misePath = join(homedir(), '.local', 'bin', 'mise');
  const installCmd = `${misePath} use --global zig@${ZIG_VERSION}`;

  if (!runCommand(installCmd, `Installing Zig ${ZIG_VERSION} via mise`)) {
    return false;
  }

  console.log(`✓ Zig ${ZIG_VERSION} installed successfully`);
  return true;
}

/**
 * Installs missing dependencies on macOS systems
 * @param {import('./check_deps.mjs').CheckDepsResult} result - The result from checkDeps function
 * @returns {Promise<void>}
 */
export async function osxInstallDeps(result) {
  console.log(`
========================================
Starting macOS dependency installation
========================================`);

  // First check if Homebrew is installed
  if (!isHomebrewInstalled()) {
    console.log('\n⚠  Homebrew is not installed.');
    console.log('Homebrew is required to install dependencies on macOS.');

    const shouldInstall = await installHomebrew();
    if (!shouldInstall) {
      console.error('\n❌ Failed to install Homebrew. Cannot continue.');
      process.exit(1);
    }

    // Update Homebrew
    console.log('\n📋 Updating Homebrew...');
    if (!runCommand('brew update', 'Running brew update')) {
      console.error('⚠ Warning: brew update failed, but continuing...');
    }
  } else {
    console.log('\n✓ Homebrew is already installed');

    // Update Homebrew
    console.log('\n📋 Updating Homebrew...');
    if (!runCommand('brew update', 'Running brew update')) {
      console.error('⚠ Warning: brew update failed, but continuing...');
    }
  }

  const { details } = result;
  const installResults = {};

  // Install missing dependencies
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

  if (!details.mise) {
    installResults.mise = await installMise();
  } else {
    console.log('\n✓ mise is already installed');
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

  if (!details.gh) {
    installResults.gh = await installGh();
  } else {
    console.log('\n✓ GitHub CLI is already installed');
  }

  if (!details.lazygit) {
    installResults.lazygit = await installLazygit();
  } else {
    console.log('\n✓ lazygit is already installed');
  }

  if (!details.zig) {
    installResults.zig = await installZig();
  } else {
    console.log('\n✓ Zig is already installed');
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
  source ~/.zshrc
  (or source ~/.bash_profile if using bash)

to use the newly installed tools.`);
}
