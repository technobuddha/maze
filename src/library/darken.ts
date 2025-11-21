import Color from 'colorjs.io';

/**
 * Darkens a color by the specified amount.
 *
 * Takes a color string in any format supported by Color.js and applies
 * darkening by the specified amount. The darkening is performed in the
 * default color space and returns a string representation of the result.
 *
 * @param color - Color string in any format (hex, rgb, hsl, etc.)
 * @param amount - Amount to darken the color (positive values darken, negative values lighten)
 * @returns Darkened color as a string
 *
 * @group Library
 * @category Color
 */
export function darken(color: string, amount: number): string {
  return new Color(new Color(color).darken(amount)).toString();
}
