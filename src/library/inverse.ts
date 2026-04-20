import { modulo } from '@technobuddha/library';
import Color from 'colorjs.io';

/**
 * Inverts a color by either adjusting lightness or rotating hue.
 *
 * For achromatic colors (zero chroma), inverts the lightness value.
 * For chromatic colors (non-zero chroma), rotates the hue by 180 degrees
 * to create a complementary color. Uses the OKLCH color space for
 * perceptually uniform color manipulation.
 *
 * @param color - Color string in any format (hex, rgb, hsl, etc.)
 * @returns Inverted color as a string
 *
 * @group Library
 * @category Color
 */
export function inverse(color: string): string {
  const c = new Color(color);
  if ((c.oklch.c ?? 0) === 0) {
    c.oklch.l = 1 - (c.oklch.l ?? 0);
  } else {
    c.oklch.h = modulo((c.oklch.hue ?? 0) + 180, 360);
  }
  return c.toString();
}
