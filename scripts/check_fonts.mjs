import { isFontInstalled } from './download_nerd_font.mjs';
import { currentOS } from './utils.mjs';

const os = currentOS();
const FONT_NAME = 'Meslo Nerd Font';

console.log(`
========================================
Checking Font Installation
========================================`);

if (isFontInstalled(os)) {
  console.log(`✓ ${FONT_NAME} is installed!`);
  console.log('');
  process.exit(0);
} else {
  console.log(`✗ ${FONT_NAME} is not installed.`);
  console.log('');
  console.log('Run "make install-fonts" to install the font.');
  console.log('');
  process.exit(1);
}
