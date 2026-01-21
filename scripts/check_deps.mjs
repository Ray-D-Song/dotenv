import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { currentOS } from './utils.mjs';

/**
 * @typedef {Object.<string, string>} DepsMap
 * @description A map of command names to their display names
 */

/**
 * @typedef {Object} CheckDepsResult
 * @property {boolean} allPresent - Whether all dependencies are present
 * @property {Object.<string, boolean>} details - Map of command names to their existence status
 */

/**
 * Checks if a dependency exists on the system
 * @param {string} cmd - The command or application name to check
 * @returns {boolean} True if the dependency exists, false otherwise
 */
function depExists(cmd) {
  const os = currentOS();

  try {
    switch (os) {
      case 'mac': {
        // Check if command exists in PATH
        try {
          const cmdCheck = execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim();
          if (cmdCheck) return true;
        } catch (e) {
          // Command not found in PATH
        }

        // Check in Applications folder
        if (existsSync('/Applications')) {
          const apps = readdirSync('/Applications');
          const appCheck = apps.some(app => app.toLocaleLowerCase().startsWith(cmd));
          if (appCheck) return true;
        }

        return false;
      }

      case 'linux': {
        // Check if command exists in PATH
        try {
          const cmdCheck = execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim();
          if (cmdCheck) return true;
        } catch (e) {
          // Command not found in PATH
        }

        // Check in GUI application paths
        const guiPaths = ['/usr/share/applications', '/usr/local/share/applications'];
        for (const path of guiPaths) {
          if (existsSync(path)) {
            const desktopFiles = readdirSync(path);
            if (desktopFiles.some(file => file.startsWith(cmd) && file.endsWith('.desktop'))) {
              return true;
            }
          }
        }

        return false;
      }

      case 'windows': {
        // Check if command exists in PATH
        try {
          const cmdCheck = execSync(`where ${cmd}`, { encoding: 'utf-8' }).trim();
          if (cmdCheck) return true;
        } catch (e) {
          // Command not found in PATH
        }

        // Check in Program Files directories
        const programDirs = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean);
        for (const dir of programDirs) {
          if (existsSync(dir)) {
            const programs = readdirSync(dir);
            if (programs.some(prog => prog.startsWith(cmd))) {
              return true;
            }
          }
        }

        return false;
      }

      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Checks for the presence of multiple dependencies and reports results
 * @param {DepsMap} deps - Map of command names to their display names
 * @returns {CheckDepsResult} Object containing check results
 */
export function checkDeps(deps) {
  let allPresent = true;
  const results = {};

  console.log('Checking dependencies...');
  console.log('-'.repeat(40));

  for (const [cmd, name] of Object.entries(deps)) {
    const exists = depExists(cmd);
    results[cmd] = exists;
    const status = exists ? '✓ Found' : '✗ Missing';
    console.log(`${name.padEnd(20)} ${status}`);
    if (!exists) allPresent = false;
  }

  console.log('-'.repeat(40));
  if (allPresent) {
    console.log('All dependencies are installed!');
  } else {
    console.log('Some dependencies are missing.');
  }

  return {
    allPresent,
    details: results
  };
}
