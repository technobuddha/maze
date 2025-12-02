import { type Cartesian, type Rect, toRadians } from '@technobuddha/library';

import { type ClearOptions, Drawing } from './drawing.ts';

/**
 * Configuration options for CanvasDrawing
 * @group Drawing
 * @category Canvas
 */
export type CanvasDrawingOptions = {
  /** Scaling factor for drawing operations (default: 1) */
  scale?: number;
};

/**
 * Implementation of Drawing for HTML5 Canvas 2D rendering context.
 * Provides drawing operations that render to an HTML canvas element
 * with optional scaling support.
 *
 * @group Drawing
 * @category Canvas
 */
export class CanvasDrawing extends Drawing {
  /** The 2D rendering context for the canvas */
  private readonly canvas: CanvasRenderingContext2D;
  /** The scaling factor applied to all drawing operations */
  private readonly scale: number;

  /**
   * Creates a new CanvasDrawing instance for the specified canvas element
   * @param element - The HTML canvas element to draw on
   * @param options - Configuration options for the drawing instance
   * @throws Error when the 2D context cannot be obtained from the canvas
   */
  public constructor(element: HTMLCanvasElement, { scale = 1 }: CanvasDrawingOptions = {}) {
    const context = element.getContext('2d')!;
    if (context) {
      super(context.canvas.width, context.canvas.height);

      this.scale = scale;
      this.canvas = context;
    } else {
      throw new Error('Failed to get 2D context');
    }
  }

  /**
   * Clears the canvas with the specified color and sets up the drawing context.
   * Resets the transformation matrix, applies scaling, and configures image smoothing.
   * @param color - The color to fill the canvas with, or 'transparent' to clear
   * @param options - Clear options including origin coordinates for translation
   */
  public clear(color = 'transparent', { originX = 0, originY = 0 }: ClearOptions = {}): void {
    this.canvas.setTransform(1, 0, 0, 1, 0, 0);
    this.canvas.scale(this.scale, this.scale);
    this.canvas.imageSmoothingEnabled = false;
    this.canvas.imageSmoothingQuality = 'high';

    if (color === 'transparent') {
      this.canvas.clearRect(
        0,
        0,
        this.canvas.canvas.width / this.scale,
        this.canvas.canvas.height / this.scale,
      );
    } else {
      this.canvas.fillStyle = color;
      this.canvas.fillRect(
        0,
        0,
        this.canvas.canvas.width / this.scale,
        this.canvas.canvas.height / this.scale,
      );
    }

    this.canvas.translate(originX, originY);
  }

  /**
   * Draws a line between two points on the canvas
   * @param start - The starting point of the line
   * @param finish - The ending point of the line
   * @param color - The stroke color for the line
   */
  public line(start: Cartesian, finish: Cartesian, color: string): void {
    this.canvas.strokeStyle = color;
    this.canvas.beginPath();
    this.canvas.moveTo(start.x, start.y);
    this.canvas.lineTo(finish.x, finish.y);
    this.canvas.stroke();
  }

  /**
   * Draws a filled rectangle between two corner points
   * @param start - The starting corner of the rectangle
   * @param finish - The opposite corner of the rectangle
   * @param color - The fill color for the rectangle
   */
  public rect(start: Cartesian, finish: Cartesian, color: string): void {
    this.canvas.fillStyle = color;
    this.canvas.fillStyle = color;

    this.canvas.beginPath();
    this.canvas.fillRect(start.x, start.y, finish.x - start.x, finish.y - start.y);
  }

  /**
   * Draws a filled polygon defined by an array of points
   * @param points - Array of points that define the polygon vertices
   * @param color - The fill color for the polygon
   */
  public polygon(points: Cartesian[], color: string): void {
    this.canvas.fillStyle = color;
    this.canvas.beginPath();
    this.canvas.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      this.canvas.lineTo(point.x, point.y);
    }
    this.canvas.fill();
  }

  /**
   * Draws text centered within a rectangular area using 8px sans-serif font
   * @param rect - The rectangular area to center the text within
   * @param text - The text content to draw
   * @param color - The fill color for the text
   */
  public override text(rect: Rect, text: string, color: string): void {
    this.canvas.fillStyle = color;
    this.canvas.font = '8px sans-serif';

    const metrics = this.canvas.measureText(text);

    const x = rect.x + (rect.width - metrics.width) / 2;
    const y =
      rect.y +
      (rect.height + (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) / 2;
    this.canvas.fillText(text, x, y);
  }

  /**
   * Draws a filled circle at the specified center point with the given radius
   * @param center - The center point of the circle
   * @param radius - The radius of the circle
   * @param color - The fill color for the circle (default: 'black')
   */
  public override circle(center: Cartesian, radius: number, color = 'black'): void {
    this.canvas.fillStyle = color;
    this.canvas.beginPath();
    this.canvas.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.canvas.fill();
  }

  /**
   * Draws a filled arc segment with inner and outer radii between specified angles.
   * Creates a "donut slice" shape by drawing two arcs and connecting them.
   * @param cx - The x-coordinate of the arc's center
   * @param cy - The y-coordinate of the arc's center
   * @param innerRadius - The inner radius of the arc segment
   * @param outerRadius - The outer radius of the arc segment
   * @param startAngle - The starting angle in degrees
   * @param endAngle - The ending angle in degrees
   * @param color - The fill color for the arc segment (default: 'white')
   */
  public arc(
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    color = 'white',
  ): void {
    const a0 = toRadians(startAngle, { unit: 'degrees' });
    const a1 = toRadians(endAngle, { unit: 'degrees' });

    const x0 = cx + outerRadius * Math.cos(a1);
    const y0 = cy + outerRadius * Math.sin(a1);
    const x1 = cx + innerRadius * Math.cos(a0);
    const y1 = cy + innerRadius * Math.sin(a0);

    this.canvas.fillStyle = color;
    this.canvas.beginPath();
    this.canvas.arc(cx, cy, innerRadius, a0, a1);
    this.canvas.lineTo(x0, y0);
    this.canvas.arc(cx, cy, outerRadius, a1, a0, true);
    this.canvas.lineTo(x1, y1);
    this.canvas.fill();
  }
}
