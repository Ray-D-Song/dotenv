import { existsSync, lstatSync } from 'fs';
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
 * Gets the mapping of configuration files to check
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
 * Checks the status of configuration symlinks
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {Object} Status of all symlinks
 */
function checkSymlinks(os) {
  const mappings = getConfigMappings(os);
  let allLinked = true;
  let linkedCount = 0;
  let missingCount = 0;
  let existsButNotLinked = 0;

  const results = [];

  for (const { source, target } of mappings) {
    const configName = target.split('/').pop();

    if (!existsSync(source)) {
      results.push({
        name: configName,
        status: 'source-missing',
        message: `⚠  Source not found: ${source}`
      });
      allLinked = false;
      missingCount++;
      continue;
    }

    if (!existsSync(target)) {
      results.push({
        name: configName,
        status: 'not-linked',
        message: `✗  Not linked: ${target}`
      });
      allLinked = false;
      missingCount++;
      continue;
    }

    if (isSymlink(target)) {
      results.push({
        name: configName,
        status: 'linked',
        message: `✓  Symlinked: ${target}`
      });
      linkedCount++;
    } else {
      results.push({
        name: configName,
        status: 'exists-not-symlink',
        message: `⚠  Exists but not a symlink: ${target}`
      });
      allLinked = false;
      existsButNotLinked++;
    }
  }

  return {
    allLinked,
    linkedCount,
    missingCount,
    existsButNotLinked,
    total: mappings.length,
    results
  };
}

// Main execution
const os = currentOS();

console.log(`
========================================
Checking Configuration Symlinks
========================================`);

const status = checkSymlinks(os);

// Display results
for (const result of status.results) {
  console.log(result.message);
}

// Summary
console.log(`
========================================
Symlink Status Summary
========================================
  Linked:              ${status.linkedCount}
  Missing:             ${status.missingCount}
  Exists (not linked): ${status.existsButNotLinked}
  Total:               ${status.total}
`);

if (status.allLinked) {
  console.log('✓ All configuration symlinks are properly set up!\n');
  process.exit(0);
} else {
  console.log('✗ Some symlinks are missing or not properly configured.');
  console.log('  Run "make install-symlink" to create the symlinks.\n');
  process.exit(1);
}
