/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import { type Cartesian, modulo, type Rect } from '@technobuddha/library';

import { type Cell, type Direction, type Kind, type Pillar } from '../geometry.ts';
import { type DrawingSizes, Maze, type MazeProperties } from '../maze.ts';

import { wedgeMatrix } from './wedge-matrix.ts';

const { SQRT2, SQRT1_2 } = Math;

/**
 * Properties for configuring a wedge maze.
 * Inherits all standard maze properties for wedge tessellation geometry.
 *
 * @group Maze
 * @category Wedge
 */
export type WedgeMazeProperties = MazeProperties;

/**
 * Wedge maze implementation using complex triangular wedge cells in a sophisticated tessellating pattern.
 *
 * Creates mazes where each cell is a wedge-shaped triangle arranged in a pattern that requires
 * 4 different wedge orientations (kinds 0-3) to completely tessellate the plane. This creates
 * one of the most complex maze geometries with sophisticated junction patterns and intricate
 * geometric calculations for proper alignment.
 *
 * Key features:
 * - Wedge-shaped triangular cells with 3 possible connections per cell
 * - 4 different wedge orientations (top, right, bottom, left pointing)
 * - Complex 4×2 cell group pattern for complete tessellation
 * - Sophisticated trigonometric calculations using √2 and √½ constants
 * - Variable angles and connections creating unique maze patterns
 * - Compatible with all maze generation and solving algorithms
 *
 * The wedge tessellation produces highly intricate maze structures with multiple junction
 * types and requires extensive geometric calculations to maintain proper wedge alignment
 * while ensuring seamless connections between different wedge orientations.
 *
 * @group Maze
 * @category Wedge
 */
export class WedgeMaze extends Maze {
  /**
   * Creates a new wedge maze with the specified properties.
   *
   * Sets default values optimized for wedge geometry:
   * - cellSize: 32 (provides good visual proportions for complex wedge shapes)
   * - wallSize: 1 (maintains clear wall visibility in complex geometry)
   * - voidSize: 1 (minimal spacing for clean wedge tessellation)
   *
   * @param props - Configuration properties for the maze
   */
  public constructor({ cellSize = 32, wallSize = 1, voidSize = 1, ...props }: WedgeMazeProperties) {
    super({ cellSize, wallSize, voidSize, ...props }, wedgeMatrix);
  }

  /**
   * Calculates the drawing dimensions for the wedge tessellation layout.
   *
   * Wedge tessellation requires a complex 4×2 cell group pattern with 2×2 cell size
   * groupings to accommodate the sophisticated wedge arrangement. Each group contains
   * 4 horizontal cells and 2 vertical cells to properly tessellate all wedge orientations.
   *
   * @returns Drawing size configuration including:
   *   - Group dimensions: 2×2 cell sizes for proper wedge spacing
   *   - Cell grouping: 4×2 cells per group for complete tessellation pattern
   */
  protected drawingSize(): DrawingSizes {
    return {
      groupWidth: this.cellSize * 2,
      horizontalCellsPerGroup: 4,
      groupHeight: this.cellSize * 2,
      verticalCellsPerGroup: 2,
    };
  }

  /**
   * Determines the wedge orientation (kind) for a cell based on its position.
   *
   * Uses a sophisticated modulo calculation that combines X and Y coordinates
   * to create the proper 4-way alternating pattern needed for wedge tessellation:
   * - Incorporates Y-axis offset (modulo 2) multiplied by 2 for vertical alternation
   * - Applies modulo 4 to X coordinate sum for complete 4-way rotation cycle
   *
   * This creates the characteristic wedge pattern where different orientations
   * cycle through top, right, bottom, and left pointing wedges.
   *
   * @param cell - The cell to classify
   * @returns Wedge kind:
   *   - 0: Top-pointing wedge
   *   - 1: Right-pointing wedge
   *   - 2: Bottom-pointing wedge
   *   - 3: Left-pointing wedge
   */
  public cellKind(cell: Cell): number {
    return modulo(cell.x + modulo(cell.y, 2) * 2, 4);
  }

  /**
   * Calculates the origin point for drawing a wedge cell.
   *
   * Positions wedges correctly within the tessellating pattern using geometric
   * calculations that account for the complex wedge arrangement. The X coordinate
   * uses half-cell positioning (0.5 multiplier) with floor division to align
   * wedges properly, while Y coordinates use standard cell-size intervals.
   *
   * @param cell - The cell to position
   * @returns Cartesian coordinates of the cell's drawing origin
   */
  protected cellOrigin(cell: Cell): Cartesian {
    return {
      x: Math.floor(cell.x * 0.5) * this.cellSize,
      y: cell.y * this.cellSize,
    };
  }

  /**
   * Calculates Manhattan distance between two cells in wedge geometry.
   *
   * Overrides the base implementation to account for the compressed X-axis
   * in wedge tessellation where cells are positioned at half-width intervals.
   * This ensures accurate pathfinding and distance calculations for wedge mazes.
   *
   * @param a - First cell
   * @param b - Second cell
   * @returns Manhattan distance adjusted for wedge geometry
   */
  public override manhattanDistance(a: Cell, b: Cell): number {
    return super.manhattanDistance({ ...a, x: a.x / 2 }, { ...b, x: b.x / 2 });
  }

  /**
   * Calculates geometric offsets for rendering wedge cells of different orientations.
   *
   * Computes precise coordinate offsets needed to draw wedges, walls, and passages
   * for all four wedge orientations using extensive trigonometric calculations.
   * Uses √2 and √½ constants for diagonal calculations and maintains proper
   * wedge geometry while accounting for cell, wall, and void sizes.
   *
   * The coordinate system uses a comprehensive grid of named points (x0-xd, y0-yd)
   * that define all geometric features needed for precise wedge rendering. Different
   * orientations use coordinate inversions to rotate the wedge shapes:
   * - Kind 0: Normal coordinates (top-pointing)
   * - Kind 1: Both X and Y inverted (right-pointing)
   * - Kind 2: Y inverted only (bottom-pointing)
   * - Kind 3: X inverted only (left-pointing)
   *
   * @param kind - Wedge orientation (0-3 for top, right, bottom, left)
   * @returns Object containing named coordinate offsets for the specified orientation
   */
  protected offsets(kind: Kind): Record<string, number> {
    const v = this.voidSize;
    const w = this.wallSize;
    const c = this.cellSize;

    const x0 = 0;
    const x1 = x0 + v;
    const x2 = x1 + w;
    const x3 = x2 + v * SQRT1_2;
    const x4 = x2 + w * SQRT1_2;
    const x5 = x3 + w * SQRT1_2;
    const xd = x0 + c;
    const xc = xd - (v + v * SQRT2);
    const xa = xc - w;
    const xb = xa + v * SQRT1_2;
    const x8 = xb - w * SQRT1_2;
    const x7 = xa - w * SQRT1_2;
    const x6 = x7 - w * SQRT1_2;
    const x9 = x6 + w;

    const y0 = 0;
    const y1 = y0 + v;
    const y2 = y1 + w;
    const y3 = y2 + v * SQRT1_2;
    const y4 = y2 + w * SQRT1_2;
    const y5 = y3 + w * SQRT1_2;
    const yd = y0 + c;
    const yc = yd - (v + v * SQRT2);
    const ya = yc - w;
    const yb = ya + v * SQRT1_2;
    const y8 = yb - w * SQRT1_2;
    const y7 = ya - w * SQRT1_2;
    const y6 = y7 - w * SQRT1_2;
    const y9 = y6 + w;

    const normalX = { x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, xa, xb, xc, xd };
    const normalY = { y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, ya, yb, yc, yd };

    // prettier-ignore
    const invertX = {
      x0: xd-xd, x1: xd-xc, x2: xd-xb, x3: xd-xa, x4: xd-x9, x5: xd-x8, x6: xd-x7,
      x7: xd-x6, x8: xd-x5, x9: xd-x4, xa: xd-x3, xb: xd-x2, xc: xd-x1, xd: xd-x0
    };
    // prettier-ignore
    const invertY = {
      y0: yd-yd, y1: yd-yc, y2: yd-yb, y3: yd-ya, y4: yd-y9, y5: yd-y8, y6: yd-y7,
      y7: yd-y6, y8: yd-y5, y9: yd-y4, ya: yd-y3, yb: yd-y2, yc: yd-y1, yd: yd-y0
    };

    switch (kind) {
      case 0: {
        return { ...normalX, ...normalY };
      }

      case 1: {
        return { ...invertX, ...invertY };
      }

      case 2: {
        return { ...normalX, ...invertY };
      }

      case 3: {
        return { ...invertX, ...normalY };
      }

      default: {
        throw new Error(`Invalid kind: ${kind}`);
      }
    }
  }

  /**
   * Erases a wedge cell by filling it with void color.
   *
   * Renders the complete wedge triangle shape for each orientation using the
   * appropriate polygon vertices to form right triangles pointing in different directions:
   * - Kind 0: Top-left, top-right, bottom-left triangle (top-pointing)
   * - Kind 1: Bottom-left, top-right, bottom-right triangle (right-pointing)
   * - Kind 2: Top-left, bottom-left, bottom-right triangle (bottom-pointing)
   * - Kind 3: Top-left, top-right, bottom-right triangle (left-pointing)
   *
   * @param cell - The cell to erase
   * @param color - Fill color (defaults to void color)
   */
  public eraseCell(cell: Cell, color = this.color.void): void {
    if (this.drawing) {
      switch (this.cellKind(cell)) {
        case 0: {
          const { x0, xd, y0, yd } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x0, y: y0 },
              { x: xd, y: y0 },
              { x: x0, y: yd },
            ],
            color,
          );
          break;
        }

        case 1: {
          const { x0, xd, y0, yd } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x0, y: yd },
              { x: xd, y: y0 },
              { x: xd, y: yd },
            ],
            color,
          );
          break;
        }

        case 2: {
          const { x0, xd, y0, yd } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x0, y: y0 },
              { x: x0, y: yd },
              { x: xd, y: yd },
            ],
            color,
          );
          break;
        }

        case 3: {
          const { x0, xd, y0, yd } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x0, y: y0 },
              { x: xd, y: y0 },
              { x: xd, y: yd },
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
   * Draws the floor (interior) of a wedge cell.
   *
   * Renders the inner wedge area using coordinates that account for wall
   * thickness and void spacing. Each orientation uses its specific coordinate
   * set to create properly sized interior triangular areas with consistent
   * insets from the cell boundaries.
   *
   * @param cell - The cell to draw
   * @param color - Fill color (defaults to cell color)
   */
  public drawFloor(cell: Cell, color = this.color.cell): void {
    if (this.drawing) {
      switch (this.cellKind(cell)) {
        case 0: {
          const { x1, xc, y1, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y1 },
              { x: xc, y: y1 },
              { x: x1, y: yc },
            ],
            color,
          );
          break;
        }

        case 1: {
          const { x1, xc, y1, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: yc },
              { x: xc, y: yc },
              { x: xc, y: y1 },
            ],
            color,
          );
          break;
        }

        case 2: {
          const { x1, xc, y1, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: yc },
              { x: xc, y: yc },
              { x: x1, y: y1 },
            ],
            color,
          );
          break;
        }

        case 3: {
          const { x1, xc, y1, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y1 },
              { x: xc, y: y1 },
              { x: xc, y: yc },
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
   * Draws a wall segment for a specific wedge direction.
   *
   * Renders walls using rectangles for straight edges and complex polygons for
   * angled edges. Each direction (a-l) corresponds to a specific side of a wedge
   * orientation, with coordinates calculated using √2 geometry to align perfectly
   * with adjacent wedge cells and maintain tessellation integrity.
   *
   * The implementation handles 12 different directions across 4 wedge orientations,
   * using sophisticated polygon calculations for diagonal wall segments.
   *
   * @param cell - The cell containing the wall
   * @param direction - The direction of the wall to draw (a-l)
   * @param color - Wall color (defaults to wall color)
   */
  public drawWall(cell: Cell, direction: Direction, color = this.color.wall): void {
    if (this.drawing) {
      switch (direction) {
        case 'a': {
          const { x2, x6, y1, y2 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x2, y: y1 }, { x: x6, y: y2 }, color);
          break;
        }
        case 'b': {
          const { x2, x4, x6, x7, y2, y4, y6, y7 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x6, y: y2 },
              { x: x7, y: y4 },
              { x: x4, y: y7 },
              { x: x2, y: y6 },
            ],
            color,
          );
          break;
        }
        case 'c': {
          const { x1, x2, y2, y6 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y2 }, { x: x2, y: y6 }, color);
          break;
        }

        case 'd': {
          const { x6, x7, x9, xb, y6, y7, y9, yb } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x9, y: y6 },
              { x: xb, y: y7 },
              { x: x7, y: yb },
              { x: x6, y: y9 },
            ],
            color,
          );
          break;
        }
        case 'e': {
          const { xb, xc, y7, yb } = this.cellOffsets(cell);
          this.drawing.rect({ x: xb, y: y7 }, { x: xc, y: yb }, color);
          break;
        }

        case 'f': {
          const { x7, xb, yb, yc } = this.cellOffsets(cell);
          this.drawing.rect({ x: x7, y: yb }, { x: xb, y: yc }, color);
          break;
        }

        case 'g': {
          const { x2, x4, x6, x7, y6, y7, y9, yb } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: y7 },
              { x: x4, y: y6 },
              { x: x7, y: y9 },
              { x: x6, y: yb },
            ],
            color,
          );
          break;
        }

        case 'h': {
          const { x2, x6, yb, yc } = this.cellOffsets(cell);
          this.drawing.rect({ x: x2, y: yb }, { x: x6, y: yc }, color);
          break;
        }

        case 'i': {
          const { x1, x2, y7, yb } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y7 }, { x: x2, y: yb }, color);
          break;
        }

        case 'j': {
          const { x7, xb, y1, y2 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x7, y: y1 }, { x: xb, y: y2 }, color);
          break;
        }

        case 'k': {
          const { xb, xc, y2, y6 } = this.cellOffsets(cell);
          this.drawing.rect({ x: xb, y: y2 }, { x: xc, y: y6 }, color);
          break;
        }

        case 'l': {
          const { x6, x7, x9, xb, y2, y4, y6, y7 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x7, y: y2 },
              { x: xb, y: y6 },
              { x: x9, y: y7 },
              { x: x6, y: y4 },
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
   * Draws a passage (opening) through a wedge wall.
   *
   * Creates openings in wedge walls by rendering wall segments on either side
   * of the passage and filling the middle section with cell color. For angled
   * walls, uses complex polygon arrangements to maintain proper geometric
   * alignment while creating the passage opening.
   *
   * The implementation handles all 12 directions with sophisticated polygon
   * calculations for diagonal passages, ensuring proper tessellation continuity
   * across different wedge orientations.
   *
   * @param cell - The cell containing the passage
   * @param direction - The direction of the passage (a-l)
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
      switch (direction) {
        case 'a': {
          const { x1, x2, x6, x7, y0, y1 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y0 }, { x: x2, y: y1 }, wallColor);
          this.drawing.rect({ x: x2, y: y0 }, { x: x6, y: y1 }, cellColor);
          this.drawing.rect({ x: x6, y: y0 }, { x: x7, y: y1 }, wallColor);
          break;
        }

        case 'b': {
          const { x2, x3, x4, x5, x7, x8, xa, xb, y2, y3, y4, y5, y7, y8, ya, yb } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: ya },
              { x: x4, y: y7 },
              { x: x5, y: y8 },
              { x: x3, y: yb },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: x8, y: y5 },
              { x: x5, y: y8 },
              { x: x4, y: y7 },
              { x: x7, y: y4 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: x7, y: y4 },
              { x: xb, y: y3 },
              { x: xa, y: y2 },
              { x: x8, y: y5 },
            ],
            wallColor,
          );
          break;
        }

        case 'c': {
          const { x0, x1, y1, y2, y6, y7 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x0, y: y1 }, { x: x1, y: y2 }, wallColor);
          this.drawing.rect({ x: x0, y: y2 }, { x: x1, y: y6 }, cellColor);
          this.drawing.rect({ x: x0, y: y6 }, { x: x1, y: y7 }, wallColor);
          break;
        }

        case 'd': {
          const { x2, x3, x5, x6, x8, x9, xa, xb, y2, y3, y5, y6, y8, y9, ya, yb } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: ya },
              { x: x5, y: y8 },
              { x: x6, y: y9 },
              { x: x3, y: yb },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: x8, y: y5 },
              { x: x5, y: y8 },
              { x: x6, y: y9 },
              { x: x9, y: y6 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: x8, y: y5 },
              { x: xa, y: y2 },
              { x: xb, y: y3 },
              { x: x9, y: y6 },
            ],
            wallColor,
          );
          break;
        }

        case 'e': {
          const { xc, xd, y4, y7, yb, yc } = this.cellOffsets(cell);
          this.drawing.rect({ x: xc, y: y4 }, { x: xd, y: y7 }, wallColor);
          this.drawing.rect({ x: xc, y: y7 }, { x: xd, y: yb }, cellColor);
          this.drawing.rect({ x: xc, y: yb }, { x: xd, y: yc }, wallColor);
          break;
        }

        case 'f': {
          const { x4, x7, xb, xc, yc, yd } = this.cellOffsets(cell);
          this.drawing.rect({ x: x4, y: yc }, { x: x7, y: yd }, wallColor);
          this.drawing.rect({ x: x7, y: yc }, { x: xb, y: yd }, cellColor);
          this.drawing.rect({ x: xb, y: yc }, { x: xc, y: yd }, wallColor);
          break;
        }

        case 'g': {
          const { x2, x3, x4, x5, x7, x8, xa, xb, y2, y3, y5, y6, y8, y9, ya, yb } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x2, y: y3 },
              { x: x3, y: y2 },
              { x: x5, y: y5 },
              { x: x4, y: y6 },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: x4, y: y6 },
              { x: x7, y: y9 },
              { x: x8, y: y8 },
              { x: x5, y: y5 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: x8, y: y8 },
              { x: xb, y: ya },
              { x: xa, y: yb },
              { x: x7, y: y9 },
            ],
            wallColor,
          );
          break;
        }

        case 'h': {
          const { x1, x2, x6, x7, yc, yd } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: yc }, { x: x2, y: yd }, wallColor);
          this.drawing.rect({ x: x2, y: yc }, { x: x6, y: yd }, cellColor);
          this.drawing.rect({ x: x6, y: yc }, { x: x7, y: yd }, wallColor);
          break;
        }

        case 'i': {
          const { x0, x1, y4, y7, yb, yc } = this.cellOffsets(cell);
          this.drawing.rect({ x: x0, y: y4 }, { x: x1, y: y7 }, wallColor);
          this.drawing.rect({ x: x0, y: y7 }, { x: x1, y: yb }, cellColor);
          this.drawing.rect({ x: x0, y: yb }, { x: x1, y: yc }, wallColor);
          break;
        }

        case 'j': {
          const { x4, x7, xb, xc, y0, y1 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x4, y: y0 }, { x: x7, y: y1 }, wallColor);
          this.drawing.rect({ x: x7, y: y0 }, { x: xb, y: y1 }, cellColor);
          this.drawing.rect({ x: xb, y: y0 }, { x: xc, y: y1 }, wallColor);
          break;
        }

        case 'k': {
          const { xc, xd, y1, y2, y6, y7 } = this.cellOffsets(cell);
          this.drawing.rect({ x: xc, y: y1 }, { x: xd, y: y2 }, wallColor);
          this.drawing.rect({ x: xc, y: y2 }, { x: xd, y: y6 }, cellColor);
          this.drawing.rect({ x: xc, y: y6 }, { x: xd, y: y7 }, wallColor);
          break;
        }

        case 'l': {
          const { x2, x3, x5, x6, x8, x9, xa, xb, y2, y3, y4, y5, y7, y8, ya, yb } =
            this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x3, y: y2 },
              { x: x6, y: y4 },
              { x: x5, y: y5 },
              { x: x2, y: y3 },
            ],
            wallColor,
          );
          this.drawing.polygon(
            [
              { x: x6, y: y4 },
              { x: x9, y: y7 },
              { x: x8, y: y8 },
              { x: x5, y: y5 },
            ],
            cellColor,
          );
          this.drawing.polygon(
            [
              { x: x9, y: y7 },
              { x: xb, y: ya },
              { x: xa, y: yb },
              { x: x8, y: y8 },
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
   * Draws a pillar (wall intersection) at wedge corners.
   *
   * Renders pillar segments where wedge walls meet, using complex polygons and
   * rectangles to handle the unique geometry of wedge intersections. Each pillar
   * corresponds to adjacent wall pairs within each wedge orientation and ensures
   * visual continuity at wedge vertices where multiple cells meet.
   *
   * The implementation handles 12 different pillar types corresponding to the
   * various wedge corner configurations across all orientations.
   *
   * @param cell - The cell containing the pillar
   * @param pillar - The pillar identifier (e.g., 'ab', 'bc', 'ca')
   * @param color - Pillar color (defaults to wall color)
   */
  public drawPillar(cell: Cell, pillar: Pillar, color = this.color.wall): void {
    if (this.drawing) {
      switch (pillar) {
        case 'ab': {
          const { x6, x7, xc, y1, y2, y4 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x6, y: y1 },
              { x: xc, y: y1 },
              { x: x7, y: y4 },
              { x: x6, y: y2 },
            ],
            color,
          );
          break;
        }
        case 'bc': {
          const { x1, x2, x4, y6, y7, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y6 },
              { x: x2, y: y6 },
              { x: x4, y: y7 },
              { x: x1, y: yc },
            ],
            color,
          );
          break;
        }
        case 'ca': {
          const { x1, x2, y1, y2 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y1 }, { x: x2, y: y2 }, color);
          break;
        }
        case 'de': {
          // const { x6, x7, x8, xb, y6, y7, y9, yb } = this.cellOffsets(cell);

          const { x9, xb, xc, y1, y6, y7 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x9, y: y6 },
              { x: xc, y: y1 },
              { x: xc, y: y7 },
              { x: xb, y: y7 },
            ],
            color,
          );
          break;
        }
        case 'ef': {
          const { xb, xc, yb, yc } = this.cellOffsets(cell);
          this.drawing.rect({ x: xb, y: yb }, { x: xc, y: yc }, color);
          break;
        }
        case 'fd': {
          const { x1, x6, x7, y9, yb, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: yc },
              { x: x6, y: y9 },
              { x: x7, y: yb },
              { x: x7, y: yc },
            ],
            color,
          );
          break;
        }
        case 'ig': {
          const { x1, x2, x4, y1, y6, y7 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y7 },
              { x: x1, y: y1 },
              { x: x4, y: y6 },
              { x: x2, y: y7 },
            ],
            color,
          );
          break;
        }
        case 'gh': {
          const { x6, x7, xc, y9, yb, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x6, y: yc },
              { x: x6, y: yb },
              { x: x7, y: y9 },
              { x: xc, y: yc },
            ],
            color,
          );
          break;
        }
        case 'hi': {
          const { x1, x2, yb, yc } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: yb }, { x: x2, y: yc }, color);
          break;
        }
        case 'jk': {
          const { xb, xc, y1, y2 } = this.cellOffsets(cell);
          this.drawing.rect({ x: xb, y: y1 }, { x: xc, y: y2 }, color);
          break;
        }
        case 'kl': {
          const { x9, xb, xc, y6, y7, yc } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x9, y: y7 },
              { x: xb, y: y6 },
              { x: xc, y: y6 },
              { x: xc, y: yc },
            ],
            color,
          );
          break;
        }
        case 'lj': {
          const { x1, x6, x7, y1, y2, y4 } = this.cellOffsets(cell);
          this.drawing.polygon(
            [
              { x: x1, y: y1 },
              { x: x7, y: y1 },
              { x: x7, y: y2 },
              { x: x6, y: y4 },
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
   * Draws an X mark on a wedge cell to indicate blocked status.
   *
   * Renders lines from the wedge corners to create an X pattern that clearly
   * indicates the cell is blocked or marked for special purposes during maze
   * generation or solving. The implementation differs for each wedge orientation,
   * creating appropriate line patterns within each triangular wedge shape.
   *
   * @param cell - The cell to mark with an X
   * @param color - Line color (defaults to blocked color)
   */
  public drawX(cell: Cell, color = this.color.blocked): void {
    if (this.drawing) {
      switch (this.cellKind(cell)) {
        case 0: {
          const { x2, x6, y2, y6 } = this.cellOffsets(cell);
          this.drawing.line({ x: x2, y: y2 }, { x: (x2 + x6) / 2, y: (y2 + y6) / 2 }, color);
          this.drawing.line({ x: x6, y: y2 }, { x: x2, y: (y2 + y6) / 2 }, color);
          this.drawing.line({ x: x2, y: y6 }, { x: (x2 + x6) / 2, y: y2 }, color);
          break;
        }

        case 1: {
          const { x7, xb, y7, yb } = this.cellOffsets(cell);
          this.drawing.line({ x: x7, y: yb }, { x: xb, y: (y7 + yb) / 2 }, color);
          this.drawing.line({ x: xb, y: yb }, { x: (x7 + xb) / 2, y: (y7 + yb) / 2 }, color);
          this.drawing.line({ x: xb, y: y7 }, { x: (x7 + xb) / 2, y: yb }, color);
          break;
        }

        case 2: {
          const { x2, x8, y7, yb } = this.cellOffsets(cell);
          this.drawing.line({ x: x2, y: y7 }, { x: (x2 + x8) / 2, y: yb }, color);
          this.drawing.line({ x: x2, y: yb }, { x: (x2 + x8) / 2, y: (y7 + yb) / 2 }, color);
          this.drawing.line({ x: x8, y: yb }, { x: x2, y: (y7 + yb) / 2 }, color);
          break;
        }

        case 3: {
          const { x7, xb, y2, y6 } = this.cellOffsets(cell);
          this.drawing.line({ x: x7, y: y2 }, { x: xb, y: (y2 + y6) / 2 }, color);
          this.drawing.line({ x: xb, y: y2 }, { x: (x7 + xb) / 2, y: (y2 + y6) / 2 }, color);
          this.drawing.line({ x: xb, y: y6 }, { x: (x7 + xb) / 2, y: y2 }, color);
          break;
        }

        // no default
      }
    }
  }

  /**
   * Calculates the bounding rectangle for a wedge cell's interior area.
   *
   * Returns the rectangular bounds that encompass the wedge's floor area,
   * used for positioning text, symbols, or other content within the cell.
   * Creates appropriately sized and positioned bounding boxes for each
   * wedge orientation, accounting for the triangular shape constraints.
   *
   * @param cell - The cell to calculate bounds for
   * @returns Rectangle defining the cell's interior bounds
   * @throws Error if an invalid cell kind is provided
   */
  protected drawingBox(cell: Cell): Rect {
    switch (this.cellKind(cell)) {
      case 0: {
        const { x2, x6, y2, y6 } = this.cellOffsets(cell);

        return { x: x2, y: y2, width: (x6 - x2) * 0.5, height: (y6 - y2) * 0.5 };
      }

      case 1: {
        const { x2, xb, y2, yb } = this.cellOffsets(cell);

        return {
          x: x2 + (xb - x2) * 0.5,
          y: y2 + (yb - y2) * 0.5,
          width: (xb - x2) * 0.5,
          height: (yb - y2) * 0.5,
        };
      }

      case 2: {
        const { x2, x6, y7, yb } = this.cellOffsets(cell);

        return { x: x2, y: y7 + (yb - y7) * 0.5, width: (x6 - x2) * 0.5, height: (yb - y7) * 0.5 };
      }

      case 3: {
        const { x7, xb, y2, y6 } = this.cellOffsets(cell);

        return { x: x7 + (xb - x7) * 0.5, y: y2, width: (xb - x7) * 0.5, height: (y6 - y2) * 0.5 };
      }

      // no default
      default: {
        throw new Error(`Invalid kind: ${this.cellKind(cell)}`);
      }
    }
  }
}
