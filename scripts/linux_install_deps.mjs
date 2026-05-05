import { execSync } from 'child_process';
import { existsSync, mkdirSync, chmodSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { currentOS, ensurePathInShellConfig } from './utils.mjs';

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
    'podman-docker': { debian: 'podman-docker', arch: 'podman-docker' },
    lazygit: { debian: 'lazygit', arch: 'lazygit' },
    wget: { debian: 'wget', arch: 'wget' },
  };

  return packageMap[packageName]?.[distro] || packageName;
}

function runCommand(command, description, needsSudo = false) {
  console.log(`\n${description}...`);
  try {
    // Wrap with "sudo bash -c" so that &&-chained sub-commands also run as root
    const finalCommand = needsSudo ? `sudo bash -c '${command.replace(/'/g, "'\\''")}'` : command;
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
  const dockerPkg = getPackageName('podman-docker');

  if (!runCommand(`${pm.install} ${pkg} ${dockerPkg}`, `Installing ${pkg} and ${dockerPkg}`, true)) {
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
    try {
      execSync('which wget', { encoding: 'utf-8' });
    } catch {
      if (!runCommand('apt update && apt install -y wget', 'Installing wget', true)) {
        return false;
      }
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
 * Installs Visual Studio Code
 * Debian: adds Microsoft apt repository; Arch: installs visual-studio-code-bin from AUR
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installVSCode() {
  console.log('\n📦 Installing Visual Studio Code...');

  const distro = detectDistro();

  if (distro === 'arch') {
    if (!runCommand('pacman -S --noconfirm --needed git base-devel', 'Installing base-devel for AUR', true)) {
      return false;
    }

    const installCmd = `mkdir -p ~/aur && cd ~/aur && git clone https://aur.archlinux.org/visual-studio-code-bin.git && cd visual-studio-code-bin && makepkg -si --noconfirm`;
    if (!runCommand(installCmd, 'Installing VSCode from AUR')) {
      return false;
    }
  } else {
    // Ensure wget is installed (check without sudo, install with sudo only if missing)
    try {
      execSync('which wget', { encoding: 'utf-8' });
    } catch {
      if (!runCommand('apt update && apt install -y wget', 'Installing wget', true)) {
        return false;
      }
    }

    if (!runCommand('mkdir -p -m 755 /etc/apt/keyrings', 'Creating keyring directory', true)) {
      return false;
    }

    // Download GPG key
    const downloadKeyring = `wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | tee /etc/apt/keyrings/packages.microsoft.gpg > /dev/null`;
    if (!runCommand(downloadKeyring, 'Downloading and installing Microsoft GPG key', true)) {
      return false;
    }

    // Add repository
    const addRepo = `echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | tee /etc/apt/sources.list.d/vscode.list > /dev/null`;
    if (!runCommand(addRepo, 'Adding VSCode repository', true)) {
      return false;
    }

    if (!runCommand('apt update && apt install -y code', 'Installing VSCode', true)) {
      return false;
    }
  }

  console.log('✓ Visual Studio Code installed successfully');
  return true;
}

/**
 * Installs Thorium Browser
 * @returns {Promise<boolean>} True if installation succeeded, false otherwise
 */
async function installThorium() {
  console.log('\n📦 Installing Thorium Browser...');

  const distro = detectDistro();

  if (distro === 'arch') {
    if (!runCommand('pacman -S --noconfirm --needed git base-devel', 'Installing base-devel for AUR', true)) {
      return false;
    }

    const installCmd = `mkdir -p ~/aur && cd ~/aur && git clone https://aur.archlinux.org/thorium-browser-bin.git && cd thorium-browser-bin && makepkg -si --noconfirm`;
    if (!runCommand(installCmd, 'Installing Thorium Browser from AUR')) {
      return false;
    }
  } else {
    try {
      execSync('which wget', { encoding: 'utf-8' });
    } catch {
      if (!runCommand('apt update && apt install -y wget', 'Installing wget', true)) {
        return false;
      }
    }

    const addRepo = `rm -fv /etc/apt/sources.list.d/thorium.list && wget --no-hsts -P /etc/apt/sources.list.d/ http://dl.thorium.rocks/debian/dists/stable/thorium.list`;
    if (!runCommand(addRepo, 'Adding Thorium repository', true)) {
      return false;
    }

    if (!runCommand('apt update', 'Updating package lists', true)) {
      return false;
    }

    if (!runCommand('apt install -y thorium-browser', 'Installing Thorium Browser', true)) {
      return false;
    }
  }

  console.log('✓ Thorium Browser installed successfully');
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

  if (!details['thorium-browser']) {
    installResults['thorium-browser'] = await installThorium();
  } else {
    console.log('\n✓ Thorium Browser is already installed');
  }

  if (!details.code) {
    installResults.code = await installVSCode();
  } else {
    console.log('\n✓ Visual Studio Code is already installed');
  }

  // Ensure ~/.local/bin is in PATH
  const localBinDir = join(homedir(), '.local', 'bin');
  if (ensurePathInShellConfig(localBinDir, currentOS())) {
    console.log(`\n  ✓ Added ${localBinDir} to PATH in shell config`);
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
