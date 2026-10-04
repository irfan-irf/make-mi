import { deltaE, getPalette, hexToRgb, rgbToLab } from './colorEngine/index.js';

export const PRODUCT_COLOR_DELTA_E = 18;
export const AVOID_COLOR_DELTA_E = 15;

const normalizeName = (name) => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const colorAliases = {
  red: ['red', 'crimson', 'scarlet', 'maroon', 'burgundy', 'wine', 'berry', 'ruby', 'paprika', 'vermilion', 'tomato', 'brick', 'rust', 'terracotta', 'cinnamon', 'coral', 'rose', 'pink', 'fuchsia'],
  blue: ['blue', 'navy', 'cobalt', 'sapphire', 'denim', 'periwinkle', 'lavender', 'lilac', 'indigo', 'slate'],
  green: ['green', 'olive', 'sage', 'mint', 'jade', 'emerald', 'pine', 'forest', 'teal', 'aqua', 'turquoise', 'sea glass'],
  yellow: ['yellow', 'mustard', 'gold', 'marigold', 'saffron', 'lemon'],
  orange: ['orange', 'apricot', 'peach', 'copper', 'persimmon', 'sienna'],
  purple: ['purple', 'plum', 'mauve', 'orchid', 'aubergine', 'violet'],
  neutral: ['white', 'ivory', 'cream', 'beige', 'oat', 'taupe', 'mushroom', 'stone', 'gray', 'grey', 'black', 'brown', 'chocolate', 'camel'],
};

function nameFallbackMatches(productColorName, paletteColorName) {
  const productName = normalizeName(productColorName);
  const paletteName = normalizeName(paletteColorName);
  if (!productName || !paletteName) return false;
  if (productName === paletteName || productName.includes(paletteName) || paletteName.includes(productName)) return true;
  const family = (name) => Object.entries(colorAliases).find(([, aliases]) => aliases.some((alias) => name.split(' ').includes(alias) || name.includes(alias)))?.[0];
  return family(productName) !== undefined && family(productName) === family(paletteName);
}

function closestDistance(hex, swatches) {
  const rgb = hexToRgb(hex);
  if (!rgb) return Infinity;
  const lab = rgbToLab(rgb);
  return swatches.reduce((closest, swatch) => {
    const swatchRgb = hexToRgb(swatch.hex);
    return swatchRgb ? Math.min(closest, deltaE(lab, rgbToLab(swatchRgb))) : closest;
  }, Infinity);
}

export function matchesColor(color, profile) {
  if (!color || !profile?.palette?.length) return false;
  const recommendations = getPalette(profile.skinDepth, profile.undertone);
  const avoid = recommendations?.avoidColors || [];
  const hasHex = Boolean(hexToRgb(color.hex));
  const closeToAvoid = hasHex
    ? closestDistance(color.hex, avoid) < AVOID_COLOR_DELTA_E
    : avoid.some((avoidColor) => nameFallbackMatches(color.name, avoidColor.name));
  if (closeToAvoid) return false;
  return profile.palette.some((best) => {
    if (hasHex && hexToRgb(best.hex) && closestDistance(color.hex, [best]) < PRODUCT_COLOR_DELTA_E) return true;
    return nameFallbackMatches(color.name, best.name);
  });
}

export function matchesUserColors(product, profile) {
  if (!product || !profile?.palette?.length) return false;
  const colors = Array.isArray(product.colors) ? product.colors : [];
  if (!colors.length) return false;
  return colors.some((color) => matchesColor(color, profile));
}
