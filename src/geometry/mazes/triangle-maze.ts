import { type Cartesian, modulo, type Rect } from '@technobuddha/library';

import { type Cell, type Direction, type Kind, type Pillar } from '../geometry.ts';
import { type DrawingSizes, Maze, type MazeProperties } from '../maze.ts';

import { triangleMatrix } from './triangle-matrix.ts';

const SIN60 = Math.sin(Math.PI / 3);
const SIN30 = Math.sin(Math.PI / 6);
const COS60 = Math.cos(Math.PI / 3);
const COS30 = Math.cos(Math.PI / 6);

/**
 * Properties for configuring a triangle maze.
 * Inherits all standard maze properties for triangle tessellation geometry.
 *
 * @group Maze
 * @category Triangle
 */
export type TriangleMazeProperties = MazeProperties;

/**
 * Triangle maze implementation using equilateral triangular cells in a tessellating pattern.
 *
 * Creates mazes where each cell is an equilateral triangle arranged in a pattern that requires
 * 2 different triangle orientations (upward and downward pointing) to tessellate the plane.
 * The tessellation follows a checkerboard pattern where upward and downward triangles
 * alternate positions to create a seamless honeycomb-like structure.
 *
 * Key features:
 * - Equilateral triangular cells with 3 possible connections per cell
 * - 2 different triangle orientations (upward △ and downward ▽)
 * - Checkerboard alternating pattern for complete tessellation
 * - Complex geometric calculations for proper triangle alignment
 * - Compatible with all maze generation and solving algorithms
 *
 * The triangle tessellation creates interesting maze patterns with 3-way junctions
 * and requires sophisticated trigonometric calculations to maintain proper
 * equilateral triangle geometry while ensuring seamless connections between cells.
 *
 * @group Maze
 * @category Triangle
 */
export class TriangleMaze extends Maze {
  /**
   * Creates a new triangle maze with the specified properties.
   *
   * Sets default values optimized for triangle geometry:
   * - cellSize: 36 (provides good visual proportions for equilateral triangles)
   * - wallSize: 2 (maintains clear wall visibility)
   * - voidSize: 2 (adequate spacing for triangle tessellation)
   *
   * @param props - Configuration properties for the maze
   */
  public constructor({
    cellSize = 36,
    wallSize = 2,
    voidSize = 2,
    ...props
  }: TriangleMazeProperties) {
    super({ cellSize, wallSize, voidSize, ...props }, triangleMatrix);
  }

  /**
   * Calculates the drawing dimensions for the triangle tessellation layout.
   *
   * Triangle tessellation requires a 2×2 cell group pattern with specific height
   * calculations based on the triangle geometry. The group height uses the sine
   * of 60° to account for the equilateral triangle's height, and includes right
   * padding to accommodate the tessellation pattern.
   *
   * @returns Drawing size configuration including:
   *   - 2×2 cell groups for alternating triangle orientations
   *   - Height based on equilateral triangle geometry (sin 60°)
   *   - Right padding for proper visual alignment
   */
  protected drawingSize(): DrawingSizes {
    return {
      groupWidth: this.cellSize,
      horizontalCellsPerGroup: 2,
      groupHeight: this.cellSize * SIN60 * 2,
      verticalCellsPerGroup: 2,
      rightPadding: this.cellSize * 0.5,
    };
  }

  /**
   * Determines the triangle orientation (kind) for a cell based on its position.
   *
   * Uses a checkerboard pattern to alternate between triangle orientations:
   * - Even sum of coordinates (x+y) → upward triangle (kind 0)
   * - Odd sum of coordinates (x+y) → downward triangle (kind 1)
   *
   * This creates the characteristic alternating pattern where upward and
   * downward triangles tessellate seamlessly across the maze surface.
   *
   * @param cell - The cell to classify
   * @returns Triangle kind:
   *   - 0: Upward-pointing triangle (△)
   *   - 1: Downward-pointing triangle (▽)
   */
  public cellKind(cell: Cell): number {
    return modulo(cell.x + cell.y, 2);
  }

  /**
   * Calculates the origin point for drawing a triangle cell.
   *
   * Positions triangles correctly within the tessellating pattern using
   * geometric calculations that account for the equilateral triangle shape.
   * The X coordinate uses half cell size steps, while the Y coordinate
   * uses the sine of 60° to maintain proper triangle height.
   *
   * @param cell - The cell to position
   * @returns Cartesian coordinates of the cell's drawing origin
   */
  protected cellOrigin(cell: Cell): Cartesian {
    return {
      x: cell.x * this.cellSize * 0.5,
      y: cell.y * this.cellSize * SIN60,
    };
  }

  /**
   * Calculates Manhattan distance between two cells in triangle geometry.
   *
   * Overrides the base implementation to account for the compressed X-axis
   * in triangle tessellation where cells are positioned at half-width intervals.
   * This ensures accurate pathfinding and distance calculations for triangle mazes.
   *
   * @param a - First cell
   * @param b - Second cell
   * @returns Manhattan distance adjusted for triangle geometry
   */
  public override manhattanDistance(a: Cell, b: Cell): number {
    return super.manhattanDistance({ ...a, x: a.x / 2 }, { ...b, x: b.x / 2 });
  }

  /**
   * Calculates geometric offsets for rendering triangle cells of different orientations.
   *
   * Computes precise coordinate offsets needed to draw triangles, walls, and passages
   * for both upward and downward triangle orientations. Uses extensive trigonometric
   * calculations based on 30° and 60° angles to maintain equilateral triangle geometry
   * while accounting for cell, wall, and void sizes.
   *
   * The coordinate system uses a comprehensive grid of named points (x0-xi, y0-yb)
   * that define all geometric features needed for precise triangle rendering. For
   * downward triangles (kind 1), the Y coordinates are inverted to flip the orientation.
   *
   * @param kind - Triangle orientation (0 for upward, 1 for downward)
   * @returns Object containing named coordinate offsets for the specified orientation
   */
  protected offsets(kind: Kind): Record<string, number> {
    const c = this.cellSize;
    const w = this.wallSize;
    const v = this.voidSize;

    // X-axis coordinate calculations using 30° trigonometry
    const x0 = 0;
    const x1 = x0 + v * COS30;
    const x2 = x1 + v * COS30;
    const x5 = x2 + (w / SIN30) * COS30;
    const x4 = x5 - w * COS30;
    const x3 = x4 - v * COS30;

    const xi = x0 + c;
    const xh = xi - v * COS30;
    const xg = xh - v * COS30;
    const xd = xg - (w / SIN30) * COS30;
    const xe = xd + w * COS30;
    const xf = xe + v * COS30;

    const x9 = (x0 + xi) / 2; // Center X coordinate
    const x8 = x9 - v * COS30;
    const xa = x9 + v * COS30;
    const x7 = x9 - w * COS30;
    const xb = x9 + w * COS30;
    const x6 = x7 - v * COS30;
    const xc = xb + v * COS30;

    // Y-axis coordinate calculations for upward triangles
    const y0 = 0;
    const y2 = y0 + v / SIN30;
    const y1 = y2 - v * SIN30;

    const y5 = y2 + w / SIN30;
    const y4 = y5 - w * SIN30;
    const y3 = y4 - v * SIN30;

    const yb = y0 + c * SIN60; // Triangle height
    const ya = yb - v;
    const y9 = ya - v * COS60;
    const y8 = ya - w;
    const y7 = y8 - w * SIN30;
    const y6 = y7 - v * SIN30;

    const normalX = { x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, xa, xb, xc, xd, xe, xf, xg, xh, xi };
    const normalY = { y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, ya, yb };

    // Inverted Y coordinates for downward triangles (kind 1)
    const invertY = {
      y0: yb - yb,
      y1: yb - ya,
      y2: yb - y9,
      y3: yb - y8,
      y4: yb - y7,
      y5: yb - y6,
      y6: yb - y5,
      y7: yb - y4,
      y8: yb - y3,
      y9: yb - y2,
      ya: yb - y1,
      yb: yb - y0,
    };

    if (kind === 0) {
      return { ...normalX, ...normalY };
    }
    return { ...normalX, ...invertY };
  }

  /**
   * Erases a triangle cell by filling it with void color.
   *
   * Renders the complete triangle shape for each orientation using the
   * appropriate polygon vertices:
   * - Upward triangles: left bottom, top center, right bottom
   * - Downward triangles: left top, right top, bottom center
   *
   * @param cell - The cell to erase
   * @param color - Fill color (defaults to void color)
   */
  public eraseCell(cell: Cell, color = this.color.void): void {
    if (this.drawing) {
      switch (this.cellKind(cell)) {
        case 0: {
          // Upward triangle (△)
          const { x0, x9, xi, y0, yb } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x0, y: yb },
              { x: x9, y: y0 },
              { x: xi, y: yb },
            ],
            color,
          );
          break;
        }

        case 1: {
          // Downward triangle (▽)
          const { x0, x9, xi, y0, yb } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x0, y: y0 },
              { x: xi, y: y0 },
              { x: x9, y: yb },
            ],
            color,
          );
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws the floor (interior) of a triangle cell.
   *
   * Renders the inner triangle area using coordinates that account for
   * wall thickness and void spacing. Each orientation uses its specific
   * coordinate set to create the properly sized interior triangle.
   *
   * @param cell - The cell to draw
   * @param color - Fill color (defaults to cell color)
   */
  public drawFloor(cell: Cell, color = this.color.cell): void {
    if (this.drawing) {
      switch (this.cellKind(cell)) {
        case 0: {
          // Upward triangle interior
          const { x2, x9, xg, y2, ya } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: ya },
              { x: xg, y: ya },
              { x: x9, y: y2 },
            ],
            color,
          );
          break;
        }

        case 1: {
          // Downward triangle interior
          const { x1, x9, xg, y1, y9 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y1 },
              { x: xg, y: y1 },
              { x: x9, y: y9 },
            ],
            color,
          );
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws a wall segment for a specific triangle direction.
   *
   * Renders walls using rectangles for straight edges and polygons for
   * angled edges. Each direction (a-f) corresponds to a specific side
   * of a triangle orientation, with coordinates calculated to align
   * perfectly with adjacent triangular cells.
   *
   * @param cell - The cell containing the wall
   * @param direction - The direction of the wall to draw (a-f)
   * @param color - Wall color (defaults to wall color)
   */
  public drawWall(cell: Cell, direction: Direction, color = this.color.wall): void {
    if (this.drawing) {
      // Triangle walls for each direction
      // Uses precise geometric calculations to align wall segments
      // with triangle edges and maintain tessellation integrity

      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (direction) {
        case 'a': {
          // Upward direction wall (kind 1 triangles)
          const { x5, xd, y1, y3 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x5, y: y1 }, { x: xd, y: y3 }, color);
          break;
        }

        case 'b': {
          // Right-angled wall (kind 0 triangles)
          const { x9, xb, xd, xe, y4, y5, y7, y8 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x9, y: y5 },
              { x: xb, y: y4 },
              { x: xe, y: y7 },
              { x: xd, y: y8 },
            ],
            color,
          );
          break;
        }

        case 'c': {
          // Right-angled wall (kind 1 triangles)
          const { x9, xb, xd, xe, y3, y4, y6, y7 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x9, y: y6 },
              { x: xb, y: y7 },
              { x: xe, y: y4 },
              { x: xd, y: y3 },
            ],
            color,
          );
          break;
        }

        case 'd': {
          // Downward direction wall (kind 0 triangles)
          const { x5, xd, y8, ya } = this.cellOffsets(cell);
          this.drawing.rect({ x: x5, y: y8 }, { x: xd, y: ya }, color);
          break;
        }

        case 'e': {
          // Left-angled wall (kind 1 triangles)
          const { x4, x5, x7, x9, y3, y4, y6, y7 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x5, y: y3 },
              { x: x9, y: y6 },
              { x: x7, y: y7 },
              { x: x4, y: y4 },
            ],
            color,
          );
          break;
        }

        case 'f': {
          // Left-angled wall (kind 0 triangles)
          const { x4, x5, x7, x9, y4, y5, y7, y8 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x5, y: y8 },
              { x: x9, y: y5 },
              { x: x7, y: y4 },
              { x: x4, y: y7 },
            ],
            color,
          );
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws a passage (opening) through a triangle wall.
   *
   * Creates openings in triangle walls by rendering wall segments on either
   * side of the passage and filling the middle section with cell color.
   * For angled walls, uses complex polygon arrangements to maintain proper
   * geometric alignment while creating the passage opening.
   *
   * @param cell - The cell containing the passage
   * @param direction - The direction of the passage (a-f)
   * @param wallColor - Color for wall segments (defaults to wall color)
   * @param cellColor - Color for passage opening (defaults to cell color)
   */
  public drawPassage(
    cell: Cell,
    direction: Direction,
    wallColor = this.color.wall,
    cellColor = this.color.cell,
  ): void {
    if (this.drawing) {
      // Passage rendering creates openings in triangle walls
      // by drawing partial wall segments with a cell-colored gap

      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (direction) {
        case 'a': {
          // Vertical passage through upward wall
          const { x2, x5, xd, xg, y0, y1 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x2, y: y0 }, { x: x5, y: y1 }, wallColor);
          this.drawing.rect({ x: x5, y: y0 }, { x: xd, y: y1 }, cellColor);
          this.drawing.rect({ x: xd, y: y0 }, { x: xg, y: y1 }, wallColor);
          break;
        }

        case 'b': {
          // Angled passage through right wall (kind 0)
          const { x9, xa, xb, xc, xe, xf, xg, xh, y1, y2, y3, y4, y6, y7, y9, ya } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: xa, y: y1 },
              { x: xc, y: y3 },
              { x: xb, y: y4 },
              { x: x9, y: y2 },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: xe, y: y7 },
              { x: xf, y: y6 },
              { x: xc, y: y3 },
              { x: xb, y: y4 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: xf, y: y6 },
              { x: xh, y: y9 },
              { x: xg, y: ya },
              { x: xe, y: y7 },
            ],
            wallColor,
          );
          break;
        }

        case 'c': {
          // Angled passage through right wall (kind 1)
          const { x9, xa, xb, xc, xe, xf, xg, xh, y1, y2, y4, y5, y7, y8, y9, ya } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x9, y: y9 },
              { x: xb, y: y7 },
              { x: xc, y: y8 },
              { x: xa, y: ya },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: xe, y: y4 },
              { x: xf, y: y5 },
              { x: xc, y: y8 },
              { x: xb, y: y7 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: xf, y: y5 },
              { x: xh, y: y2 },
              { x: xg, y: y1 },
              { x: xe, y: y4 },
            ],
            wallColor,
          );
          break;
        }

        case 'd': {
          // Vertical passage through downward wall
          const { x2, x5, xd, xg, ya, yb } = this.cellOffsets(cell);
          this.drawing.rect({ x: x2, y: ya }, { x: x5, y: yb }, wallColor);
          this.drawing.rect({ x: x5, y: ya }, { x: xd, y: yb }, cellColor);
          this.drawing.rect({ x: xd, y: ya }, { x: xg, y: yb }, wallColor);
          break;
        }

        case 'e': {
          // Angled passage through left wall (kind 1)
          const { x1, x2, x3, x4, x6, x7, x8, x9, y1, y2, y4, y5, y7, y8, y9, ya } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y2 },
              { x: x2, y: y1 },
              { x: x4, y: y4 },
              { x: x3, y: y5 },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: x6, y: y8 },
              { x: x7, y: y7 },
              { x: x4, y: y4 },
              { x: x3, y: y5 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: x6, y: y8 },
              { x: x7, y: y7 },
              { x: x9, y: y9 },
              { x: x8, y: ya },
            ],
            wallColor,
          );
          break;
        }

        case 'f': {
          // Angled passage through left wall (kind 0)
          const { x1, x2, x3, x4, x6, x7, x8, x9, y1, y2, y3, y4, y6, y7, y9, ya } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y9 },
              { x: x3, y: y6 },
              { x: x4, y: y7 },
              { x: x2, y: ya },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: x6, y: y3 },
              { x: x7, y: y4 },
              { x: x4, y: y7 },
              { x: x3, y: y6 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: x6, y: y3 },
              { x: x8, y: y1 },
              { x: x9, y: y2 },
              { x: x7, y: y4 },
            ],
            wallColor,
          );
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws a pillar (wall intersection) at triangle corners.
   *
   * Renders pillar segments where triangle walls meet, using complex polygons
   * to handle the unique geometry of triangular intersections. Each pillar
   * corresponds to adjacent wall pairs and ensures visual continuity at
   * triangle vertices where multiple cells meet.
   *
   * @param cell - The cell containing the pillar
   * @param pillar - The pillar identifier (e.g., 'bd', 'df')
   * @param color - Pillar color (defaults to wall color)
   */
  public drawPillar(cell: Cell, pillar: Pillar, color = this.color.wall): void {
    if (this.drawing) {
      // Pillar rendering for triangle corners and intersections
      // Each pillar corresponds to where two adjacent triangle sides meet

      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (pillar) {
        case 'bd': {
          // Bottom-right pillar (kind 0 triangles)
          const { xd, xe, xg, y7, y8, ya } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: xd, y: y8 },
              { x: xe, y: y7 },
              { x: xg, y: ya },
              { x: xd, y: ya },
            ],
            color,
          );
          break;
        }

        case 'df': {
          // Bottom-left pillar (kind 0 triangles)
          const { x2, x4, x5, y7, y8, ya } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: ya },
              { x: x4, y: y7 },
              { x: x5, y: y8 },
              { x: x5, y: ya },
            ],
            color,
          );
          break;
        }

        case 'fb': {
          // Top pillar (kind 0 triangles)
          const { x7, x9, xb, y2, y4, y5 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x7, y: y4 },
              { x: x9, y: y2 },
              { x: xb, y: y4 },
              { x: x9, y: y5 },
            ],
            color,
          );
          break;
        }

        case 'ac': {
          // Top pillar (kind 1 triangles)
          const { xd, xe, xg, y1, y3, y4 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: xd, y: y1 },
              { x: xg, y: y1 },
              { x: xe, y: y4 },
              { x: xd, y: y3 },
            ],
            color,
          );
          break;
        }

        case 'ce': {
          // Bottom-right pillar (kind 1 triangles)
          const { x7, x9, xb, y6, y7, y9 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x7, y: y7 },
              { x: x9, y: y6 },
              { x: xb, y: y7 },
              { x: x9, y: y9 },
            ],
            color,
          );
          break;
        }

        case 'ea': {
          // Bottom-left pillar (kind 1 triangles)
          const { x2, x4, x5, y1, y3, y4 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: y1 },
              { x: x5, y: y1 },
              { x: x5, y: y3 },
              { x: x4, y: y4 },
            ],
            color,
          );
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws an X mark on a triangle cell to indicate blocked status.
   *
   * Renders lines from the triangle center to each vertex, creating
   * a three-pointed star pattern that clearly indicates the cell is
   * blocked or marked for special purposes during maze generation or solving.
   * The implementation differs for upward and downward triangles.
   *
   * @param cell - The cell to mark with an X
   * @param color - Line color (defaults to blocked color)
   */
  public drawX(cell: Cell, color = this.color.blocked): void {
    if (this.drawing) {
      switch (this.cellKind(cell)) {
        case 0: {
          // Upward triangle X mark
          const { x5, x9, xd, y5, y8 } = this.cellOffsets(cell);
          const yc = (y8 + y5) / 2;
          this.drawing.line({ x: x5, y: y8 }, { x: x9, y: yc }, color);
          this.drawing.line({ x: xd, y: y8 }, { x: x9, y: yc }, color);
          this.drawing.line({ x: x9, y: y5 }, { x: x9, y: yc }, color);
          break;
        }

        case 1:
        default: {
          // Downward triangle X mark
          const { x5, x9, xd, y3, y6 } = this.cellOffsets(cell);
          const yc = (y6 + y3) / 2;
          this.drawing.line({ x: x5, y: y3 }, { x: x9, y: yc }, color);
          this.drawing.line({ x: xd, y: y3 }, { x: x9, y: yc }, color);
          this.drawing.line({ x: x9, y: y6 }, { x: x9, y: yc }, color);
          break;
        }
      }
    }
  }

  /**
   * Calculates the bounding rectangle for a triangle cell's interior area.
   *
   * Returns the rectangular bounds that encompass the triangle's floor area,
   * used for positioning text, symbols, or other content within the cell.
   * Creates a square bounding box centered within each triangle orientation,
   * with dimensions based on the triangle's side length.
   *
   * @param cell - The cell to calculate bounds for
   * @returns Rectangle defining the cell's interior bounds
   */
  protected drawingBox(cell: Cell): Rect {
    switch (this.cellKind(cell)) {
      case 0: {
        // Upward triangle bounding box
        const { x5, x9, xd, y8 } = this.cellOffsets(cell);
        const side = (xd - x5) / 2;

        return {
          x: x9 - side / 2,
          y: y8 - side,
          width: side,
          height: side,
        };
      }

      case 1:
      default: {
        // Downward triangle bounding box
        const { x5, x9, xd, y3 } = this.cellOffsets(cell);
        const side = (xd - x5) / 2;
        return {
          x: x9 - side / 2,
          y: y3,
          width: side,
          height: side,
        };
      }
    }
  }
}
