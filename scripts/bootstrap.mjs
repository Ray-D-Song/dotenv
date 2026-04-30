import { checkDeps } from './check_deps.mjs';
import { currentOS } from './utils.mjs';
import { linuxInstallDeps } from './linux_install_deps.mjs';
import { isFontInstalled, downloadNerdFont } from './download_nerd_font.mjs';
import { createSymlinks } from './create_symlink.mjs';
import { execSync } from 'child_process';

/**
 * @type {import('./check_deps.mjs').DepsMap}
 * Common dependencies shared across all platforms
 */
const commonDeps = {
  'mise': 'mise',
  'curl': 'curl',
  'unzip': 'unzip',
  'nvim': 'Neovim',
  'go': 'Go',
  'cargo': 'Cargo (Rust)',
  'alacritty': 'Alacritty',
  'zellij': 'Zellij',
};

/**
 * @type {import('./check_deps.mjs').DepsMap}
 * Linux-specific dependencies
 */
const linuxDeps = {
  'podman': 'Podman',
}

/**
 * @type {import('./check_deps.mjs').DepsMap}
 * macOS-specific dependencies
 */
const macDeps = {

}

const os = currentOS()

// Merge dependencies based on OS
let deps = { ...commonDeps };
if (os === 'linux') {
  deps = { ...deps, ...linuxDeps };
} else if (os === 'mac') {
  deps = { ...deps, ...macDeps };
}

// 0. If Linux, need root
if (os === 'linux') {
  try {
    // Check if we can use sudo without password prompt
    execSync('sudo -n true', { stdio: 'ignore' });
    console.log('✓ Sudo access verified');
  } catch (error) {
    console.error('\n❌ This script requires sudo privileges to install dependencies on Linux.');
    process.exit(1);
  }
}

// 1. Check deps, confirm the dependencies that need to be installed.
const result = checkDeps(deps);
if (!result.allPresent) {
  await autoInstall(os, result)
}

// 2. Check and install Nerd Font
console.log('\n');
if (!isFontInstalled(os)) {
  console.log('📝 Meslo Nerd Font not found, installing...');
  await downloadNerdFont(os);
} else {
  console.log('✓ Meslo Nerd Font is already installed');
}

// 3. Create configuration symlinks
console.log('\n');
await createSymlinks(os);

/**
 * Automatically installs missing dependencies based on the operating system
 * @param {import('./utils.mjs').OSType} os - The current operating system
 * @param {import('./check_deps.mjs').CheckDepsResult} result - The dependency check result
 * @returns {Promise<void>}
 */
async function autoInstall(os, result) {

  if (os === 'linux') {
    await linuxInstallDeps(result)
  }

  // if (os === 'mac') {
  //   await macInstallDeps(result)
  // }
}
