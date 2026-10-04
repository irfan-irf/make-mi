const hexPattern = /^#?(?:[\da-f]{3}|[\da-f]{6})$/i;

export function parseHexColors(value, label) {
  if (!value) return [];
  const colors = String(value).split(',').map((color) => color.trim()).filter(Boolean);
  if (colors.length > 16 || colors.some((color) => !hexPattern.test(color))) {
    const error = new Error(`${label} must be a comma-separated list of up to 16 hex colors.`);
    error.status = 400;
    throw error;
  }
  return colors.map((color) => {
    const hex = color.replace(/^#/, '');
    const full = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex;
    return `#${full.toUpperCase()}`;
  });
}

function hexToLab(hex) {
  let value = hex.replace(/^#/, '');
  if (value.length === 3) value = [...value].map((part) => part + part).join('');
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = channels;
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const f = (component) => component > 0.008856 ? Math.cbrt(component) : 7.787 * component + 16 / 116;
  const [fx, fy, fz] = [x, y, z].map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const distance = (left, right) => Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
const MATCH_DELTA_E = 18;
const AVOID_DELTA_E = 15;

const normalizeName = (name) => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases = {
  red: ['red', 'crimson', 'scarlet', 'maroon', 'burgundy', 'wine', 'berry', 'ruby', 'paprika', 'vermilion', 'tomato', 'brick', 'rust', 'terracotta', 'cinnamon', 'coral', 'rose', 'pink', 'fuchsia'],
  blue: ['blue', 'navy', 'cobalt', 'sapphire', 'denim', 'periwinkle', 'lavender', 'lilac', 'indigo', 'slate'],
  green: ['green', 'olive', 'sage', 'mint', 'jade', 'emerald', 'pine', 'forest', 'teal', 'aqua', 'turquoise'],
  yellow: ['yellow', 'mustard', 'gold', 'marigold', 'saffron', 'lemon'],
  orange: ['orange', 'apricot', 'peach', 'copper', 'persimmon', 'sienna'],
  purple: ['purple', 'plum', 'mauve', 'orchid', 'aubergine', 'violet'],
  neutral: ['white', 'ivory', 'cream', 'beige', 'oat', 'taupe', 'mushroom', 'stone', 'gray', 'grey', 'black', 'brown', 'chocolate', 'camel'],
};

export function parseColorNames(value) {
  if (!value) return [];
  return String(value).split(',').map(normalizeName).filter(Boolean).slice(0, 16);
}

function nameMatches(productName, paletteNames) {
  const product = normalizeName(productName);
  if (!product) return false;
  const family = (name) => Object.entries(aliases).find(([, words]) => words.some((word) => name.split(' ').includes(word) || name.includes(word)))?.[0];
  return paletteNames.some((rawName) => {
    const palette = normalizeName(rawName);
    if (!palette) return false;
    return product === palette || product.includes(palette) || palette.includes(product)
      || (family(product) !== undefined && family(product) === family(palette));
  });
}

export function matchesProductColors(productColors, matchColors, avoidColors, matchNames = [], avoidNames = []) {
  if (!matchColors.length && !matchNames.length) return true;
  const bestLabs = matchColors.map(hexToLab);
  const avoidLabs = avoidColors.map(hexToLab);
  return (productColors || []).some(({ hex, name }) => {
    if (!hexPattern.test(String(hex || ''))) return nameMatches(name, matchNames) && !nameMatches(name, avoidNames);
    const normalized = String(hex).startsWith('#') ? String(hex) : `#${hex}`;
    const productLab = hexToLab(normalized);
    const closeToBest = bestLabs.some((lab) => distance(productLab, lab) <= MATCH_DELTA_E) || nameMatches(name, matchNames);
    const closeToAvoid = avoidLabs.some((lab) => distance(productLab, lab) < AVOID_DELTA_E);
    return closeToBest && !closeToAvoid;
  });
}
