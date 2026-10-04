export { rgbToLab, rgbToHsv, deltaE, classifyDepth, classifyUndertone, DEPTH_LSTAR_THRESHOLDS, UNDERTONE_NEUTRAL_BAND } from './colorScience.js';
export { PALETTE_TABLE, getPalette } from './palettes.js';

export function hexToRgb(hex) {
  const match = /^#?([\da-f]{6})$/i.exec(String(hex || '').trim());
  if (!match) return null;
  const value = match[1];
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
}

export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((part) => Math.round(Math.max(0, Math.min(255, part))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
