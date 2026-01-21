import { platform } from 'os';

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
