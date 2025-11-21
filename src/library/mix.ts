import Color from 'colorjs.io';

/**
 * Mixes two colors together to create a blend.
 *
 * Takes two color strings in any format supported by Color.js and creates
 * a 50/50 blend between them. The mixing is performed in the default color
 * space and returns a string representation of the resulting color.
 *
 * @param color1 - First color string in any format (hex, rgb, hsl, etc.)
 * @param color2 - Second color string in any format (hex, rgb, hsl, etc.)
 * @returns Mixed color as a string
 *
 * @group Library
 * @category Color
 */
export function mix(color1: string, color2: string): string {
  return Color.mix(color1, color2).toString();
}
