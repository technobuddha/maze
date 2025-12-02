import { type Cartesian, type Rect } from '@technobuddha/library';

/**
 * Options for clearing a drawing canvas
 * @group Drawing
 * @category Drawing
 */
export type ClearOptions = {
  /** X coordinate of the origin point for clearing */
  readonly originX?: number;
  /** Y coordinate of the origin point for clearing */
  readonly originY?: number;
};

/**
 * Abstract base class for drawing operations on different rendering contexts.
 * Provides a common interface for drawing operations that can be implemented
 * for various output formats like Canvas, SVG, etc.
 *
 * @group Drawing
 * @category Drawing
 */
export abstract class Drawing {
  /** The width of the drawing area in pixels */
  public readonly width: number;
  /** The height of the drawing area in pixels */
  public readonly height: number;

  /**
   * Creates a new Drawing instance with the specified dimensions
   * @param width - The width of the drawing area in pixels
   * @param height - The height of the drawing area in pixels
   */
  public constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Clears the drawing area with the specified color
   * @param color - The color to fill the cleared area with
   * @param options - Additional options for the clear operation
   */
  public abstract clear(color?: string, options?: ClearOptions): void;

  /**
   * Draws a line between two points
   * @param start - The starting point of the line
   * @param finish - The ending point of the line
   * @param color - The color of the line
   */
  public abstract line(start: Cartesian, finish: Cartesian, color: string): void;

  /**
   * Draws a rectangle between two corner points
   * @param start - The starting corner of the rectangle
   * @param finish - The opposite corner of the rectangle
   * @param color - The color of the rectangle
   */
  public abstract rect(start: Cartesian, finish: Cartesian, color: string): void;

  /**
   * Draws a polygon defined by an array of points
   * @param points - Array of points that define the polygon vertices
   * @param color - The color of the polygon
   */
  public abstract polygon(points: Cartesian[], color: string): void;

  /**
   * Draws text within a specified rectangular area
   * @param rect - The rectangular area to draw the text within
   * @param text - The text content to draw
   * @param color - The color of the text
   */
  public abstract text(rect: Rect, text: string, color?: string): void;

  /**
   * Draws a circle at the specified center point with the given radius
   * @param center - The center point of the circle
   * @param radius - The radius of the circle
   * @param color - The color of the circle
   */
  public abstract circle(center: Cartesian, radius: number, color?: string): void;

  /**
   * Draws an arc segment defined by inner and outer radii and start/end angles
   * @param cx - The x-coordinate of the arc's center
   * @param cy - The y-coordinate of the arc's center
   * @param innerRadius - The inner radius of the arc
   * @param outerRadius - The outer radius of the arc
   * @param startAngle - The starting angle of the arc in radians
   * @param endAngle - The ending angle of the arc in radians
   * @param color - The color of the arc
   */
  public abstract arc(
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    color?: string,
  ): void;
}
