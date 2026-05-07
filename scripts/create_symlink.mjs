import { existsSync, lstatSync, renameSync, symlinkSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { currentOS } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/**
 * @typedef {Object} ConfigMapping
 * @property {string} source - Source path in the project
 * @property {string} target - Target path in the system config directory
 * @property {'dir'|'file'} [type] - Type of symlink ('dir' for directories, 'file' for single files). Defaults to 'dir'.
 */

/**
 * Gets the configuration directory path based on the operating system
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {string} The configuration directory path
 */
function getConfigDir(os) {
  switch (os) {
    case 'linux':
    case 'mac':
      return join(homedir(), '.config');
    case 'windows':
      return join(homedir(), 'AppData', 'Roaming');
    default:
      throw new Error(`Unsupported operating system: ${os}`);
  }
}

/**
 * Gets the mapping of configuration files to symlink
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {ConfigMapping[]} Array of config mappings
 */
function getConfigMappings(os) {
  const configDir = getConfigDir(os);

  return [
    {
      source: join(projectRoot, 'nvim'),
      target: join(configDir, 'nvim')
    },
    {
      source: join(projectRoot, 'alacritty'),
      target: join(configDir, 'alacritty')
    },
    {
      source: join(projectRoot, 'zellij'),
      target: join(configDir, 'zellij')
    },
    {
      source: join(projectRoot, 'tmux', 'tmux.conf'),
      target: join(homedir(), '.tmux.conf'),
      type: 'file'
    }
  ];
}

/**
 * Checks if a path is a symlink
 * @param {string} path - The path to check
 * @returns {boolean} True if the path is a symlink
 */
function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch (error) {
    return false;
  }
}

/**
 * Backs up an existing directory or file
 * @param {string} path - The path to backup
 */
function backupPath(path) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${path}.backup-${timestamp}`;

  console.log(`  📦 Backing up existing config: ${path} -> ${backupPath}`);
  renameSync(path, backupPath);
}

/**
 * Creates a symlink from source to target
 * @param {string} source - Source path
 * @param {string} target - Target path
 * @param {'dir'|'file'} [type='dir'] - Type of symlink
 */
function createSymlink(source, target, type = 'dir') {
  console.log(`  🔗 Creating symlink: ${target} -> ${source}`);
  symlinkSync(source, target, type);
  console.log(`  ✓ Symlink created successfully`);
}

/**
 * Creates symlinks for all configuration files
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {Promise<void>}
 */
export async function createSymlinks(os) {
  console.log(`
========================================
Creating Configuration Symlinks
========================================`);

  const configDir = getConfigDir(os);

  // Ensure .config directory exists
  if (!existsSync(configDir)) {
    console.log(`📁 Creating config directory: ${configDir}`);
    mkdirSync(configDir, { recursive: true });
  }

  const mappings = getConfigMappings(os);
  let createdCount = 0;
  let skippedCount = 0;

  for (const { source, target, type = 'dir' } of mappings) {
    const configName = dirname(target) === configDir ? target.split('/').pop() : target.split('/').pop();

    console.log(`\n📝 Processing ${configName} config...`);

    // Check if source exists
    if (!existsSync(source)) {
      console.log(`  ⚠ Source not found: ${source}, skipping...`);
      skippedCount++;
      continue;
    }

    // Check if target exists
    if (existsSync(target)) {
      if (isSymlink(target)) {
        console.log(`  ✓ Symlink already exists: ${target}`);
        skippedCount++;
        continue;
      } else {
        console.log(`  ⚠ Config directory already exists: ${target}`);
        backupPath(target);
      }
    }

    // Create symlink
    createSymlink(source, target, type);
    createdCount++;
  }

  // Summary
  console.log(`
========================================
Symlink Creation Summary
========================================
  Created: ${createdCount}
  Skipped: ${skippedCount}
  Total: ${mappings.length}

✓ Configuration symlinks setup complete!
  Your dotfiles are now linked to ${configDir}
`);
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const os = currentOS();
  createSymlinks(os).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
