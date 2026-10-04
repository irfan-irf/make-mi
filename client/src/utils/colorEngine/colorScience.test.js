import { describe, expect, it } from 'vitest';
import { classifyDepth, classifyUndertone, deltaE, getPalette, PALETTE_TABLE, rgbToHsv, rgbToLab } from './index.js';

describe('color science conversions', () => {
  it('converts sRGB primaries into D65 CIELAB values', () => {
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(red.L).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 1);
    expect(red.b).toBeCloseTo(67.20, 1);
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).L).toBeCloseTo(0, 5);
    expect(rgbToLab({ r: 255, g: 255, b: 255 }).L).toBeCloseTo(100, 3);
  });

  it('returns normalized HSV saturation and value with hue in degrees', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 1, v: 1 });
    expect(rgbToHsv({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, v: 128 / 255 });
  });

  it('computes CIE76 Delta-E and gives zero for identical colors', () => {
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    const green = rgbToLab({ r: 0, g: 255, b: 0 });
    expect(deltaE(red, red)).toBe(0);
    expect(deltaE(red, green)).toBeGreaterThan(150);
  });
});

describe('style classification', () => {
  it('classifies the five documented lightness bands', () => {
    expect([85, 72, 60, 48, 30].map(classifyDepth)).toEqual(['fair', 'light', 'medium', 'tan', 'deep']);
    expect(classifyDepth(76)).toBe('fair');
    expect(classifyDepth(43)).toBe('tan');
  });

  it('classifies warm, cool, and neutral undertones with a neutral band', () => {
    expect(classifyUndertone({ a: 8, b: 18 })).toBe('warm');
    expect(classifyUndertone({ a: 15, b: 6 })).toBe('cool');
    expect(classifyUndertone({ a: 8, b: 10 })).toBe('neutral');
    expect(classifyUndertone({ a: 1, b: 1 })).toBe('neutral');
  });
});

describe('palette lookup', () => {
  it('provides valid best/avoid swatches and a styling tip for all 15 combinations', () => {
    expect(Object.keys(PALETTE_TABLE)).toHaveLength(5);
    for (const depth of ['fair', 'light', 'medium', 'tan', 'deep']) {
      for (const undertone of ['warm', 'cool', 'neutral']) {
        const result = getPalette(depth, undertone);
        expect(result, `${depth}/${undertone}`).toBeTruthy();
        expect(result.bestColors.length).toBeGreaterThanOrEqual(6);
        expect(result.bestColors.length).toBeLessThanOrEqual(8);
        expect(result.avoidColors.length).toBeGreaterThanOrEqual(3);
        expect(result.avoidColors.length).toBeLessThanOrEqual(4);
        expect(result.bestColors.every(({ name, hex }) => name && /^#[\da-f]{6}$/i.test(hex))).toBe(true);
        expect(result.stylingTip.length).toBeGreaterThan(10);
      }
    }
    expect(getPalette('unknown', 'warm')).toBeNull();
  });
});
