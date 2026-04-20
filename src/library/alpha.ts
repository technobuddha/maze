import Color from 'colorjs.io';

/**
 * Adjusts the alpha (transparency) of a color by multiplying it with the given amount.
 *
 * Takes a color string in any format supported by Color.js and multiplies its
 * existing alpha value by the specified amount. This allows for proportional
 * transparency adjustments rather than absolute alpha setting.
 *
 * @param color - Color string in any format (hex, rgb, hsl, etc.)
 * @param amount - Multiplier for the alpha channel (0-1, where 1 = no change)
 * @returns Color string with adjusted alpha transparency
 *
 * @group Library
 * @category Color
 */
export function alpha(color: string, amount: number): string {
  const c = new Color(color);
  c.alpha *= amount;
  return c.toString();
}
