/** Convert 8-bit sRGB components to CIELAB using the D65 reference white. */
export function rgbToLab({ r, g, b }) {
  const linear = (component) => {
    const value = Math.max(0, Math.min(255, Number(component))) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const red = linear(r);
  const green = linear(g);
  const blue = linear(b);
  const x = (red * 0.4124564 + green * 0.3575761 + blue * 0.1804375) / 0.95047;
  const y = red * 0.2126729 + green * 0.7151522 + blue * 0.072175;
  const z = (red * 0.0193339 + green * 0.119192 + blue * 0.9503041) / 1.08883;
  const pivot = (value) => value > 0.0088564517 ? Math.cbrt(value) : 7.787037 * value + 16 / 116;
  const fx = pivot(x);
  const fy = pivot(y);
  const fz = pivot(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** Return HSV with hue in degrees and saturation/value in the range 0..1. */
export function rgbToHsv({ r, g, b }) {
  const red = Math.max(0, Math.min(255, Number(r))) / 255;
  const green = Math.max(0, Math.min(255, Number(g))) / 255;
  const blue = Math.max(0, Math.min(255, Number(b))) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  let hue = 0;
  if (chroma) {
    if (max === red) hue = 60 * (((green - blue) / chroma) % 6);
    else if (max === green) hue = 60 * ((blue - red) / chroma + 2);
    else hue = 60 * ((red - green) / chroma + 4);
  }
  return { h: (hue + 360) % 360, s: max === 0 ? 0 : chroma / max, v: max };
}

/** CIE76 Delta-E; inputs are Lab objects from rgbToLab (lower is closer). */
export function deltaE(first, second) {
  return Math.sqrt((first.L - second.L) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2);
}

// These L* bands are deliberately broad styling categories, not medical labels.
// Increasing L* means a lighter sampled facial tone.
export const DEPTH_LSTAR_THRESHOLDS = Object.freeze({ fair: 76, light: 68, medium: 56, tan: 43 });
export function classifyDepth(L) {
  if (L >= DEPTH_LSTAR_THRESHOLDS.fair) return 'fair';
  if (L >= DEPTH_LSTAR_THRESHOLDS.light) return 'light';
  if (L >= DEPTH_LSTAR_THRESHOLDS.medium) return 'medium';
  if (L >= DEPTH_LSTAR_THRESHOLDS.tan) return 'tan';
  return 'deep';
}

// Keep a neutral band because lighting and camera white balance shift a*/b*.
export const UNDERTONE_NEUTRAL_BAND = 4;
export function classifyUndertone({ a, b }) {
  const chroma = Math.hypot(a, b);
  if (chroma < 6) return 'neutral';
  const yellowBlueBalance = b - a;
  if (yellowBlueBalance > UNDERTONE_NEUTRAL_BAND) return 'warm';
  if (yellowBlueBalance < -UNDERTONE_NEUTRAL_BAND) return 'cool';
  return 'neutral';
}
