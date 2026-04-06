import { execSync } from 'child_process';
import { existsSync, mkdirSync, chmodSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

let detectedDistro = null;

function detectDistro() {
  if (detectedDistro) return detectedDistro;

  try {
    const osRelease = readFileSync('/etc/os-release', 'utf-8');
    const lines = osRelease.split('\n');
    const info = {};

    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        info[key] = value.replace(/^["']|["']$/g, '');
      }
    });

    const id = info.ID || '';
    const idLike = info.ID_LIKE || '';

    if (id === 'debian' || id === 'ubuntu' || idLike.includes('debian')) {
      detectedDistro = 'debian';
    } else if (id === 'arch' || id === 'manjaro' || idLike.includes('arch')) {
      detectedDistro = 'arch';
    } else {
      detectedDistro = 'unknown';
    }

    return detectedDistro;
  } catch (error) {
    console.error('✗ Failed to detect distribution:', error.message);
    detectedDistro = 'unknown';
    return detectedDistro;
  }
}

function getPackageManager() {
  const distro = detectDistro();

  const managers = {
    debian: {
      update: 'apt update',
      install: 'apt install -y',
      query: 'dpkg -l',
    },
    arch: {
      update: 'pacman -Sy',
      install: 'pacman -S --noconfirm',
      query: 'pacman -Q',
    },
  };

  return managers[distro] || managers.debian;
}

function getPackageName(packageName) {
  const distro = detectDistro();

  const packageMap = {
    curl: { debian: 'curl', arch: 'curl' },
    unzip: { debian: 'unzip', arch: 'unzip' },
    golang: { debian: 'golang', arch: 'go' },
    alacritty: { debian: 'alacritty', arch: 'alacritty' },
    podman: { debian: 'podman', arch: 'podman' },
    lazygit: { debian: 'lazygit', arch: 'lazygit' },
    wget: { debian: 'wget', arch: 'wget' },
  };

  return packageMap[packageName]?.[distro] || packageName;
}

function runCommand(command, description, needsSudo = false) {
  console.log(`\n${description}...`);
  try {
    const finalCommand = needsSudo ? `sudo ${command}` : command;
    execSync(finalCommand, { stdio: 'inherit', shell: '/bin/bash' });
    console.log(`✓ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Installs curl via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installCurl() {
  console.log('\n📦 Installing curl...');

  const pm = getPackageManager();
  const pkg = getPackageName('curl');

  if (!runCommand(`${pm.install} ${pkg}`, `Installing ${pkg}`, true)) {
    return false;
  }

  console.log('✓ curl installed successfully');
  return true;
}

/**
 * Installs unzip via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installUnzip() {
  console.log('\n📦 Installing unzip...');

  const pm = getPackageManager();
  const pkg = getPackageName('unzip');

  if (!runCommand(`${pm.install} ${pkg}`, `Installing ${pkg}`, true)) {
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

  // Detect architecture
  const arch = execSync('uname -m', { encoding: 'utf-8' }).trim();
  let appimageName;
  if (arch === 'x86_64') {
    appimageName = 'nvim-linux-x86_64.appimage';
  } else if (arch === 'aarch64') {
    appimageName = 'nvim-linux-arm64.appimage';
  } else {
    console.error(`✗ Unsupported architecture: ${arch}`);
    return false;
  }

  console.log(`Detected architecture: ${arch}`);

  // Download latest stable nvim appimage
  const nvimPath = join(nvimDir, 'nvim');
  const downloadCmd = `curl -fsSL -o ${nvimPath} https://github.com/neovim/neovim/releases/latest/download/${appimageName}`;

  if (!runCommand(downloadCmd, 'Downloading Neovim')) {
    // Try alternative URL format
    const altDownloadCmd = `curl -fsSL -o ${nvimPath} https://github.com/neovim/neovim/releases/download/stable/${appimageName}`;
    if (!runCommand(altDownloadCmd, 'Trying alternative download URL')) {
      return false;
    }
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
 * Installs Go programming language via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installGo() {
  console.log('\n📦 Installing Go...');

  const pm = getPackageManager();
  const pkg = getPackageName('golang');

  if (!runCommand(`${pm.install} ${pkg}`, `Installing ${pkg}`, true)) {
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
 * Installs Alacritty terminal emulator via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installAlacritty() {
  console.log('\n📦 Installing Alacritty...');

  const pm = getPackageManager();
  const pkg = getPackageName('alacritty');

  if (!runCommand(`${pm.install} ${pkg}`, `Installing ${pkg}`, true)) {
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

  const installCmd = `cargo install --locked zellij`;

  if (!runCommand(installCmd, 'Installing Zellij')) {
    return false;
  }

  console.log('✓ Zellij installed successfully');
  return true;
}

/**
 * Installs Podman container engine via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installPodman() {
  console.log('\n📦 Installing Podman...');

  const pm = getPackageManager();
  const pkg = getPackageName('podman');

  if (!runCommand(`${pm.install} ${pkg}`, `Installing ${pkg}`, true)) {
    return false;
  }

  console.log('✓ Podman installed successfully');
  return true;
}

/**
 * Installs GitHub CLI (gh) via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installGh() {
  console.log('\n📦 Installing GitHub CLI...');

  const distro = detectDistro();
  const pm = getPackageManager();

  if (distro === 'arch') {
    if (!runCommand(`${pm.install} github-cli`, 'Installing GitHub CLI', true)) {
      return false;
    }
  } else {
    if (!runCommand('type -p wget >/dev/null || (apt update && apt install wget -y)', 'Ensuring wget is installed', true)) {
      return false;
    }

    if (!runCommand('mkdir -p -m 755 /etc/apt/keyrings', 'Creating keyring directory', true)) {
      return false;
    }

    const downloadKeyring = `out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg && cat $out | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg`;
    if (!runCommand(downloadKeyring, 'Downloading and installing GitHub CLI keyring', true)) {
      return false;
    }

    if (!runCommand('mkdir -p -m 755 /etc/apt/sources.list.d', 'Creating sources.list.d directory', true)) {
      return false;
    }

    const addRepo = `echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null`;
    if (!runCommand(addRepo, 'Adding GitHub CLI repository', true)) {
      return false;
    }

    if (!runCommand('apt update && apt install gh -y', 'Installing GitHub CLI', true)) {
      return false;
    }
  }

  console.log('✓ GitHub CLI installed successfully');
  return true;
}

/**
 * Installs lazygit via package manager
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installLazygit() {
  console.log('\n📦 Installing lazygit...');

  const pm = getPackageManager();
  const pkg = getPackageName('lazygit');

  if (!runCommand(`${pm.install} ${pkg}`, `Installing ${pkg}`, true)) {
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
 * Installs Zig programming language by downloading the prebuilt archive from ziglang.org
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installZig() {
  console.log(`\n📦 Installing Zig ${ZIG_VERSION}...`);

  const zigDir = join(homedir(), '.local');
  if (!existsSync(zigDir)) {
    mkdirSync(zigDir, { recursive: true });
  }

  // Detect architecture
  const arch = execSync('uname -m', { encoding: 'utf-8' }).trim();
  let archName;
  if (arch === 'x86_64') {
    archName = 'x86_64';
  } else if (arch === 'aarch64') {
    archName = 'aarch64';
  } else {
    console.error(`✗ Unsupported architecture for Zig: ${arch}`);
    return false;
  }

  console.log(`Detected architecture: ${arch}`);

  const tarballName = `zig-${archName}-linux-${ZIG_VERSION}.tar.xz`;
  const downloadUrl = `https://ziglang.org/download/${ZIG_VERSION}/${tarballName}`;
  const tempDir = join(homedir(), '.cache', 'dotenv-install');
  const tarballPath = join(tempDir, tarballName);

  // Create temp directory
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  // Download tarball
  const downloadCmd = `curl -fsSL -o ${tarballPath} ${downloadUrl}`;
  if (!runCommand(downloadCmd, `Downloading Zig ${ZIG_VERSION}`)) {
    return false;
  }

  // Extract tarball
  const extractCmd = `tar -xf ${tarballPath} -C ${zigDir}`;
  if (!runCommand(extractCmd, 'Extracting Zig archive')) {
    return false;
  }

  // Create symlink
  const extractedDir = join(zigDir, `zig-${archName}-linux-${ZIG_VERSION}`);
  const binPath = join(extractedDir, 'zig');
  const symlinkPath = join(zigDir, 'bin', 'zig');

  // Ensure bin directory exists
  const binDir = join(zigDir, 'bin');
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }

  // Remove old symlink if exists
  if (existsSync(symlinkPath)) {
    try {
      execSync(`rm ${symlinkPath}`);
    } catch (error) {
      console.error('✗ Failed to remove old zig symlink:', error.message);
    }
  }

  // Create new symlink
  try {
    execSync(`ln -s ${binPath} ${symlinkPath}`);
    console.log('✓ Created zig symlink');
  } catch (error) {
    console.error('✗ Failed to create zig symlink:', error.message);
    return false;
  }

  // Cleanup tarball
  try {
    execSync(`rm ${tarballPath}`);
    console.log('✓ Cleaned up tarball');
  } catch (error) {
    // Non-fatal error
    console.log('⚠ Could not cleanup tarball');
  }

  console.log(`✓ Zig ${ZIG_VERSION} installed successfully
  Location: ${extractedDir}
  Binary: ${symlinkPath}
  Make sure ${binDir} is in your PATH`);

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

  const distro = detectDistro();
  console.log(`\n📋 Detected distribution: ${distro}`);

  if (distro === 'unknown') {
    console.error('✗ Unsupported distribution. Only Debian and Arch are currently supported.');
    console.error('  Supported distributions: Debian, Ubuntu, Arch, Manjaro');
    return;
  }

  const pm = getPackageManager();
  console.log('\n📋 Updating package lists...');
  if (!runCommand(pm.update, 'Updating package lists', true)) {
    console.error('⚠ Warning: package update failed, but continuing...');
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
  source ~/.bashrc
  (or source ~/.zshrc if using zsh)

to use the newly installed tools.`);
}
