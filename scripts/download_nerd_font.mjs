import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { currentOS } from './utils.mjs';

const NERD_FONT_VERSION = 'v3.4.0';
const FONT_NAME = 'Meslo';
const DOWNLOAD_URL = `https://github.com/ryanoasis/nerd-fonts/releases/download/${NERD_FONT_VERSION}/${FONT_NAME}.zip`;

/**
 * Gets the font installation directory based on the operating system
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {string} The font installation directory path
 */
function getFontDir(os) {
  switch (os) {
    case 'linux':
      return join(homedir(), '.local', 'share', 'fonts', 'NerdFonts');
    case 'mac':
      return join(homedir(), 'Library', 'Fonts', 'NerdFonts');
    case 'windows':
      return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Microsoft', 'Windows', 'Fonts');
    default:
      throw new Error(`Unsupported operating system: ${os}`);
  }
}

/**
 * Checks if the Nerd Font is already installed
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {boolean} True if the font is already installed
 */
export function isFontInstalled(os) {
  const fontDir = getFontDir(os);

  if (!existsSync(fontDir)) {
    return false;
  }

  try {
    const files = readdirSync(fontDir);
    // Check if any Meslo Nerd Font files exist
    const hasMesloFont = files.some(file =>
      file.includes('Meslo') && (file.endsWith('.ttf') || file.endsWith('.otf'))
    );
    return hasMesloFont;
  } catch (error) {
    return false;
  }
}

/**
 * Downloads the Nerd Font zip file
 * @param {string} tempDir - Temporary directory to download to
 * @returns {string} Path to the downloaded zip file
 */
function downloadFont(tempDir) {
  const zipPath = join(tempDir, `${FONT_NAME}.zip`);
  console.log(`📥 Downloading ${FONT_NAME} Nerd Font...`);

  try {
    execSync(`curl -L -o "${zipPath}" "${DOWNLOAD_URL}"`, { stdio: 'inherit' });
    console.log('✓ Download completed');
    return zipPath;
  } catch (error) {
    throw new Error(`Failed to download font: ${error.message}`);
  }
}

/**
 * Extracts the zip file
 * @param {string} zipPath - Path to the zip file
 * @param {string} extractDir - Directory to extract to
 */
function extractFont(zipPath, extractDir) {
  console.log(`📦 Extracting font files...`);

  try {
    execSync(`unzip -q -o "${zipPath}" -d "${extractDir}"`, { stdio: 'inherit' });
    console.log('✓ Extraction completed');
  } catch (error) {
    throw new Error(`Failed to extract font: ${error.message}`);
  }
}

/**
 * Installs font files to the system font directory
 * @param {string} extractDir - Directory containing extracted font files
 * @param {string} fontDir - Destination font directory
 */
function installFonts(extractDir, fontDir) {
  console.log(`📋 Installing fonts to ${fontDir}...`);

  // Create font directory if it doesn't exist
  if (!existsSync(fontDir)) {
    mkdirSync(fontDir, { recursive: true });
  }

  // Get all font files (.ttf, .otf)
  const files = readdirSync(extractDir);
  const fontFiles = files.filter(file =>
    file.endsWith('.ttf') || file.endsWith('.otf')
  );

  if (fontFiles.length === 0) {
    throw new Error('No font files found in the extracted archive');
  }

  // Copy font files
  let installedCount = 0;
  for (const file of fontFiles) {
    const sourcePath = join(extractDir, file);
    const destPath = join(fontDir, file);
    copyFileSync(sourcePath, destPath);
    installedCount++;
  }

  console.log(`✓ Installed ${installedCount} font file(s)`);
}

/**
 * Updates the font cache on Linux systems
 */
function updateFontCache() {
  console.log(`🔄 Updating font cache...`);

  try {
    execSync('fc-cache -f', { stdio: 'inherit' });
    console.log('✓ Font cache updated');
  } catch (error) {
    console.warn('⚠ Warning: Failed to update font cache:', error.message);
  }
}

/**
 * Downloads and installs a Nerd Font
 * @param {import('./utils.mjs').OSType} os - The operating system type
 * @returns {Promise<void>}
 */
export async function downloadNerdFont(os) {
  console.log(`
========================================
Installing ${FONT_NAME} Nerd Font
========================================`);

  // Check if already installed
  if (isFontInstalled(os)) {
    const fontDir = getFontDir(os);
    console.log(`✓ ${FONT_NAME} Nerd Font is already installed!
  Location: ${fontDir}

  Skipping download.`);
    return;
  }

  const tempDir = join(tmpdir(), `nerd-font-${Date.now()}`);
  const extractDir = join(tempDir, 'extracted');

  try {
    // Create temp directories
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(extractDir, { recursive: true });

    // Download
    const zipPath = downloadFont(tempDir);

    // Extract
    extractFont(zipPath, extractDir);

    // Install
    const fontDir = getFontDir(os);
    installFonts(extractDir, fontDir);

    // Update font cache on Linux
    if (os === 'linux') {
      updateFontCache();
    }

    console.log(`
✓ ${FONT_NAME} Nerd Font installed successfully!
  Location: ${fontDir}

  You may need to restart your terminal or applications to see the new font.`);

  } catch (error) {
    console.error(`\n❌ Failed to install ${FONT_NAME} Nerd Font:`, error.message);
    throw error;
  } finally {
    // Cleanup
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('⚠ Warning: Failed to clean up temporary files:', error.message);
    }
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const os = currentOS();
  downloadNerdFont(os).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
