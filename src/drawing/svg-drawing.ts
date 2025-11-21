import { type Cartesian, type Rect } from '@technobuddha/library';

import { Drawing } from './drawing.ts';

/**
 * Creates an SVG element with the specified tag name and attributes
 * @param tag - The SVG element tag name to create
 * @param attributes - Key-value pairs of attributes to set on the element
 * @returns The created SVG element
 * @internal
 */
function create(tag: string, attributes: Record<string, string | number> = {}): Element {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value.toString());
  }
  return element;
}

/**
 * Implementation of Drawing for SVG (Scalable Vector Graphics) rendering.
 * Provides drawing operations that create SVG elements within an SVG container.
 * This implementation generates vector graphics that can be scaled without quality loss.
 *
 * @group Drawing
 * @category Classes
 */
export class SVGDrawing extends Drawing {
  /** The SVG element that serves as the drawing container */
  private readonly svg: SVGSVGElement;

  /**
   * Creates a new SVGDrawing instance for the specified SVG element
   * @param element - The SVG element to draw within
   */
  public constructor(element: SVGSVGElement) {
    super(element.clientWidth, element.clientHeight);
    this.svg = element;

    this.clear();
  }

  /**
   * Clears the SVG by removing all child elements, optionally adding a background rectangle
   * @param color - Optional background color; if provided, creates a background rectangle
   */
  public clear(color?: string): void {
    if (color) {
      this.svg.replaceChildren(
        create('rect', { x: 0, y: 0, width: this.width, height: this.height, fill: color }),
      );
    } else {
      this.svg.replaceChildren();
    }
  }

  /**
   * Draws a line between two points by creating an SVG line element
   * @param start - The starting point of the line
   * @param finish - The ending point of the line
   * @param color - The stroke color for the line
   */
  public line(start: Cartesian, finish: Cartesian, color: string): void {
    if (this.svg) {
      this.svg.append(
        create('line', { x1: start.x, y1: start.y, x2: finish.x, y2: finish.y, stroke: color }),
      );
    }
  }

  /**
   * Draws a rectangle between two corner points by creating an SVG rect element
   * @param start - The starting corner of the rectangle
   * @param finish - The opposite corner of the rectangle
   * @param color - The fill color for the rectangle
   */
  public rect(start: Cartesian, finish: Cartesian, color: string): void {
    if (this.svg) {
      this.svg.append(
        create('rect', {
          x: start.x,
          y: start.y,
          width: finish.x - start.x,
          height: finish.y - start.y,
          fill: color,
        }),
      );
    }
  }

  /**
   * Draws a polygon defined by an array of points by creating an SVG polygon element
   * @param points - Array of points that define the polygon vertices
   * @param color - The fill color for the polygon
   */
  public polygon(points: Cartesian[], color: string): void {
    const pointsString = points.map((point) => `${point.x},${point.y}`).join(' ');
    this.svg.append(create('polygon', { points: pointsString, fill: color }));
  }

  /**
   * Draws text centered within a rectangular area by creating an SVG text element
   * @param rect - The rectangular area to center the text within
   * @param text - The text content to draw
   * @param color - The fill color for the text
   */
  public text(rect: Rect, text: string, color: string): void {
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    const textElement = create('text', {
      'x': centerX,
      'y': centerY,
      'fill': color,
      'font-family': 'sans-serif',
      'font-size': '8px',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
    });

    textElement.textContent = text;
    this.svg.append(textElement);
  }

  /**
   * Draws a circle at the specified center point with the given radius by creating an SVG circle element
   * @param center - The center point of the circle
   * @param radius - The radius of the circle
   * @param color - The fill color for the circle (default: 'black')
   */
  public circle(center: Cartesian, radius: number, color = 'black'): void {
    this.svg.append(create('circle', { cx: center.x, cy: center.y, r: radius, fill: color }));
  }

  /**
   * Draws a filled arc segment with inner and outer radii between specified angles.
   * Creates a "donut slice" shape using an SVG path element.
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
    // Convert degrees to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate start and end points for outer arc
    const outerStartX = cx + outerRadius * Math.cos(startRad);
    const outerStartY = cy + outerRadius * Math.sin(startRad);
    const outerEndX = cx + outerRadius * Math.cos(endRad);
    const outerEndY = cy + outerRadius * Math.sin(endRad);

    // Calculate start and end points for inner arc
    const innerStartX = cx + innerRadius * Math.cos(startRad);
    const innerStartY = cy + innerRadius * Math.sin(startRad);
    const innerEndX = cx + innerRadius * Math.cos(endRad);
    const innerEndY = cy + innerRadius * Math.sin(endRad);

    // Determine if we need a large-arc-flag (for arcs > 180 degrees)
    const angleDiff = endAngle - startAngle;
    const largeArcFlag = Math.abs(angleDiff) > 180 ? 1 : 0;

    // Create SVG path data for the arc segment
    const pathData = [
      `M ${outerStartX} ${outerStartY}`, // Move to outer start point
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`, // Outer arc
      `L ${innerEndX} ${innerEndY}`, // Line to inner end point
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`, // Inner arc (reverse)
      'Z', // Close path
    ].join(' ');

    this.svg.append(create('path', { d: pathData, fill: color }));
  }
}
