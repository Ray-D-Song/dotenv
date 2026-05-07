import { platform, homedir } from 'os';
import { existsSync, readFileSync, appendFileSync, symlinkSync, chmodSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * @typedef {'mac' | 'linux' | 'windows' | 'unknown'} OSType
 */

/**
 * Detects the current operating system
 * @returns {OSType} The current operating system type
 */
export function currentOS() {
  const platformName = platform();

  switch (platformName) {
    case 'darwin':
      return 'mac';
    case 'linux':
      return 'linux';
    case 'win32':
      return 'windows';
    default:
      return 'unknown';
  }
}

/**
 * Detects whether we're running inside WSL2
 * @returns {boolean} True if running inside WSL2
 */
export function isWSL2() {
  if (currentOS() !== 'linux') return false;

  try {
    const procVersion = readFileSync('/proc/version', 'utf-8').toLowerCase();
    if (procVersion.includes('microsoft') || procVersion.includes('wsl')) {
      return true;
    }
  } catch {}

  if (existsSync('/proc/sys/fs/binfmt_misc/WSLInterop')) {
    return true;
  }

  return false;
}

/**
 * Checks if a directory is in the current PATH
 * @param {string} dir - Directory to check
 * @returns {boolean} True if the directory is in PATH
 */
export function isDirInPath(dir) {
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(process.platform === 'win32' ? ';' : ':');
  return pathDirs.includes(dir);
}

/**
 * Adds a directory to the user's shell config if not already in PATH
 * @param {string} dir - Directory to add to PATH
 * @param {OSType} os - The operating system type
 * @returns {boolean} True if the directory was added to shell config
 */
export function ensurePathInShellConfig(dir, os) {
  if (isDirInPath(dir)) {
    return false;
  }

  const home = homedir();
  const shellConfigLine = `\nexport PATH="${dir}:$PATH"\n`;

  // Shell config files to check, in order of preference
  const shellConfigs = {
    linux: ['.bashrc', '.zshrc', '.profile'],
    mac: ['.zshrc', '.bashrc', '.bash_profile', '.profile'],
  };

  const configs = shellConfigs[os] || shellConfigs.linux;
  const configEntry = configs.find(config => existsSync(join(home, config)));

  if (!configEntry) {
    // Default to .bashrc if no config file found
    const defaultConfig = '.bashrc';
    const configPath = join(home, defaultConfig);
    console.log(`  📝 Adding ${dir} to PATH in ${defaultConfig}`);
    appendFileSync(configPath, shellConfigLine);
    return true;
  }

  const configPath = join(home, configEntry);

  // Check if the line is already in the config file
  const content = readFileSync(configPath, 'utf8');
  if (content.includes(dir)) {
    return false;
  }

  console.log(`  📝 Adding ${dir} to PATH in ${configEntry}`);
  appendFileSync(configPath, shellConfigLine);
  return true;
}
