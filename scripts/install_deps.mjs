import { checkDeps } from './check_deps.mjs';
import { currentOS } from './utils.mjs';
import { linuxInstallDeps } from './linux_install_deps.mjs';
import { osxInstallDeps } from './osx_install_deps.mjs';
import { execSync } from 'child_process';

/**
 * @type {import('./check_deps.mjs').DepsMap}
 * Common dependencies shared across all platforms
 */
const commonDeps = {
  'curl': 'curl',
  'unzip': 'unzip',
  'nvim': 'Neovim',
  'go': 'Go',
  'cargo': 'Cargo (Rust)',
  'alacritty': 'Alacritty',
  'zellij': 'Zellij',
  'gh': 'GitHub CLI',
  'lazygit': 'lazygit',
  'zig': 'Zig',
  'thorium-browser': 'Thorium Browser',
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
  'brew': 'Homebrew',
}

const os = currentOS()

// Merge dependencies based on OS
let deps = { ...commonDeps };
if (os === 'linux') {
  deps = { ...deps, ...linuxDeps };
} else if (os === 'mac') {
  deps = { ...deps, ...macDeps };
}

// Check dependencies
const result = checkDeps(deps);

// Install missing dependencies if any
if (!result.allPresent) {
  console.log('\n📦 Starting dependency installation...\n');
  await installDependencies(os, result);
} else {
  console.log('\n✓ All dependencies are already installed! Nothing to do.\n');
}

/**
 * Installs missing dependencies based on the operating system
 * @param {import('./utils.mjs').OSType} os - The current operating system
 * @param {import('./check_deps.mjs').CheckDepsResult} result - The dependency check result
 * @returns {Promise<void>}
 */
async function installDependencies(os, result) {
  switch (os) {
    case 'linux':
      await linuxInstallDeps(result);
      break;

    case 'mac':
      await osxInstallDeps(result);
      break;

    case 'windows':
      console.error('❌ Windows is not supported yet.');
      console.error('Please install dependencies manually:');
      for (const [cmd, name] of Object.entries(deps)) {
        if (!result.details[cmd]) {
          console.error(`  - ${name}`);
        }
      }
      process.exit(1);
      break;

    default:
      console.error(`❌ Unsupported operating system: ${os}`);
      process.exit(1);
  }
}
