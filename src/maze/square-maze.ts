/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import { type Cartesian, type Rect } from '@technobuddha/library';

import { type Cell, type Direction, type Kind, type Pillar } from '../geometry/geometry.ts';
import { type DrawingSizes, Maze, type MazeProperties } from '../geometry/maze.ts';

import { squareMatrix } from './square-matrix.ts';

/**
 * Properties for configuring a square maze.
 * Inherits all standard maze properties for square tessellation geometry.
 *
 * @group Maze
 * @category Square
 */
export type SquareMazeProperties = MazeProperties;

/**
 * Square maze implementation using rectangular cells in a simple grid tessellation.
 *
 * Creates mazes where each cell is a square arranged in a regular orthogonal grid.
 * This is the most basic and widely used maze geometry, where each cell has 4
 * possible connections corresponding to the cardinal directions (north, east, west, south).
 *
 * Key features:
 * - Rectangular cells with 4 possible connections per cell
 * - Simple orthogonal grid layout with no rotations or offsets
 * - Single cell kind (orientation) covers the entire tessellation
 * - Direct neighbor connections in cardinal directions
 * - Compatible with all maze generation and solving algorithms
 *
 * The square tessellation is the foundation for most maze algorithms and provides
 * the simplest geometric calculations for rendering and navigation.
 *
 * @group Maze
 * @category Square
 */
export class SquareMaze extends Maze {
  /**
   * Creates a new square maze with the specified properties.
   *
   * Sets default values optimized for square geometry:
   * - cellSize: 28 (provides good visual proportions for squares)
   * - wallSize: 2 (maintains clear wall visibility)
   * - voidSize: 1 (minimal spacing for clean appearance)
   *
   * @param props - Configuration properties for the maze
   */
  public constructor({
    cellSize = 28,
    wallSize = 2,
    voidSize = 1,
    ...props
  }: SquareMazeProperties) {
    super({ cellSize, wallSize, voidSize, ...props }, squareMatrix);
  }

  /**
   * Calculates the drawing dimensions for the square grid layout.
   *
   * Square tessellation uses a simple 1×1 cell group pattern where each
   * cell occupies exactly one cellSize × cellSize area with no additional
   * grouping or padding required.
   *
   * @returns Drawing size configuration with uniform cell dimensions
   */
  protected drawingSize(): DrawingSizes {
    return {
      groupWidth: this.cellSize,
      groupHeight: this.cellSize,
    };
  }

  /**
   * Determines the square cell kind for any position.
   *
   * Square tessellation uses only a single cell kind (0) for all positions
   * since all squares have the same orientation and connection pattern.
   *
   * @param _cell - The cell to classify (unused in square geometry)
   * @returns Always returns 0 (standard square cell kind)
   */
  public cellKind(_cell: Cell): number {
    return 0;
  }

  /**
   * Calculates the origin point for drawing a square cell.
   *
   * Square cells are positioned on a simple orthogonal grid where each
   * cell's top-left corner is at (x × cellSize, y × cellSize).
   *
   * @param cell - The cell to position
   * @returns Cartesian coordinates of the cell's drawing origin
   */
  protected cellOrigin(cell: Cell): Cartesian {
    return { x: cell.x * this.cellSize, y: cell.y * this.cellSize };
  }

  /**
   * Calculates geometric offsets for rendering square cells.
   *
   * Computes coordinate offsets needed to draw squares, walls, and passages
   * accounting for cell, wall, and void sizes. The coordinate system uses
   * six key points (x0-x5, y0-y5) that define the cell boundaries, wall
   * positions, and interior areas.
   *
   * @param _kind - Cell kind (unused since squares have only one orientation)
   * @returns Object containing named coordinate offsets for square geometry
   */
  protected override offsets(_kind: Kind): Record<string, number> {
    const x0 = 0;
    const x1 = x0 + this.voidSize;
    const x2 = x1 + this.wallSize;
    const x5 = x0 + this.cellSize;
    const x4 = x5 - this.voidSize;
    const x3 = x4 - this.wallSize;

    const y0 = 0;
    const y1 = y0 + this.voidSize;
    const y2 = y1 + this.wallSize;
    const y5 = y0 + this.cellSize;
    const y4 = y5 - this.voidSize;
    const y3 = y4 - this.wallSize;

    return { x0, x1, x2, x3, x4, x5, y0, y1, y2, y3, y4, y5 };
  }

  /**
   * Erases a square cell by filling it with void color.
   *
   * Renders a rectangle covering the entire cell area from the top-left
   * corner (x0,y0) to the bottom-right corner (x5,y5).
   *
   * @param cell - The cell to erase
   * @param color - Fill color (defaults to void color)
   */
  public eraseCell(cell: Cell, color = this.color.void): void {
    if (this.drawing) {
      const { x0, x5, y0, y5 } = this.cellOffsets(cell);
      this.drawing.rect({ x: x0, y: y0 }, { x: x5, y: y5 }, color);
    }
  }

  /**
   * Draws the floor (interior) of a square cell.
   *
   * Renders the inner square area using coordinates that account for
   * wall thickness and void spacing. The floor area extends from
   * (x1,y1) to (x4,y4), leaving space for walls around the perimeter.
   *
   * @param cell - The cell to draw
   * @param color - Fill color (defaults to cell color)
   */
  public drawFloor(cell: Cell, color = this.color.cell): void {
    if (this.drawing) {
      const { x1, x4, y1, y4 } = this.cellOffsets(cell);
      this.drawing.rect({ x: x1, y: y1 }, { x: x4, y: y4 }, color);
    }
  }

  /**
   * Draws a wall segment for a specific square direction.
   *
   * Renders walls as rectangles positioned along the cell edges:
   * - North wall: top edge of the cell
   * - South wall: bottom edge of the cell
   * - East wall: right edge of the cell
   * - West wall: left edge of the cell
   *
   * @param cell - The cell containing the wall
   * @param direction - The direction of the wall to draw (n, s, e, w)
   * @param color - Wall color (defaults to wall color)
   */
  public drawWall(cell: Cell, direction: Direction, color = this.color.wall): void {
    if (this.drawing) {
      const { x1, x2, x3, x4, y1, y2, y3, y4 } = this.cellOffsets(cell);

      switch (direction) {
        case 'n': {
          this.drawing.rect({ x: x2, y: y1 }, { x: x3, y: y2 }, color);
          break;
        }
        case 's': {
          this.drawing.rect({ x: x2, y: y3 }, { x: x3, y: y4 }, color);
          break;
        }
        case 'e': {
          this.drawing.rect({ x: x3, y: y2 }, { x: x4, y: y3 }, color);
          break;
        }
        case 'w': {
          this.drawing.rect({ x: x1, y: y2 }, { x: x2, y: y3 }, color);
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws a passage (opening) through a square wall.
   *
   * Creates openings in square walls by rendering wall segments on either
   * side of the passage and filling the middle section with cell color.
   * The passage extends to the edge of the cell, creating a visual opening
   * while maintaining wall continuity.
   *
   * @param cell - The cell containing the passage
   * @param direction - The direction of the passage (n, s, e, w)
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
      const { x0, x1, x2, x3, x4, x5, y0, y1, y2, y3, y4, y5 } = this.cellOffsets(cell);

      switch (direction) {
        case 'n': {
          this.drawing.rect({ x: x1, y: y1 }, { x: x2, y: y0 }, wallColor);
          this.drawing.rect({ x: x2, y: y1 }, { x: x3, y: y0 }, cellColor);
          this.drawing.rect({ x: x3, y: y1 }, { x: x4, y: y0 }, wallColor);
          break;
        }
        case 's': {
          this.drawing.rect({ x: x1, y: y4 }, { x: x2, y: y5 }, wallColor);
          this.drawing.rect({ x: x2, y: y4 }, { x: x3, y: y5 }, cellColor);
          this.drawing.rect({ x: x3, y: y4 }, { x: x4, y: y5 }, wallColor);
          break;
        }
        case 'e': {
          this.drawing.rect({ x: x4, y: y1 }, { x: x5, y: y2 }, wallColor);
          this.drawing.rect({ x: x4, y: y2 }, { x: x5, y: y3 }, cellColor);
          this.drawing.rect({ x: x4, y: y3 }, { x: x5, y: y4 }, wallColor);
          break;
        }
        case 'w': {
          this.drawing.rect({ x: x0, y: y1 }, { x: x1, y: y2 }, wallColor);
          this.drawing.rect({ x: x0, y: y2 }, { x: x1, y: y3 }, cellColor);
          this.drawing.rect({ x: x0, y: y3 }, { x: x1, y: y4 }, wallColor);
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws a pillar (wall intersection) at square corners.
   *
   * Renders pillar segments at the corners where square walls meet.
   * Each pillar corresponds to a corner position (northwest, northeast,
   * southwest, southeast) and ensures visual continuity at cell vertices.
   *
   * @param cell - The cell containing the pillar
   * @param pillar - The pillar identifier (nw, ne, sw, se)
   * @param color - Pillar color (defaults to wall color)
   */
  public override drawPillar({ x, y }: Cell, pillar: Pillar, color = this.color.wall): void {
    if (this.drawing) {
      const { x1, x2, x3, x4, y1, y2, y3, y4 } = this.cellOffsets({ x, y });

      switch (pillar) {
        case 'nw': {
          this.drawing.rect({ x: x1, y: y1 }, { x: x2, y: y2 }, color);
          break;
        }

        case 'ne': {
          this.drawing.rect({ x: x3, y: y1 }, { x: x4, y: y2 }, color);
          break;
        }

        case 'sw': {
          this.drawing.rect({ x: x1, y: y3 }, { x: x2, y: y4 }, color);
          break;
        }

        case 'se': {
          this.drawing.rect({ x: x3, y: y3 }, { x: x4, y: y4 }, color);
          break;
        }
        // no default
      }
    }
  }

  /**
   * Draws an X mark on a square cell to indicate blocked status.
   *
   * Renders two diagonal lines from corner to corner of the cell's
   * interior area, creating an X pattern that clearly indicates the
   * cell is blocked or marked for special purposes during maze
   * generation or solving.
   *
   * @param cell - The cell to mark with an X
   * @param color - Line color (defaults to blocked color)
   */
  public override drawX(cell: Cell, color = this.color.blocked): void {
    if (this.drawing) {
      const { x2, x3, y2, y3 } = this.cellOffsets(cell);

      this.drawing.line({ x: x2, y: y2 }, { x: x3, y: y3 }, color);
      this.drawing.line({ x: x2, y: y3 }, { x: x3, y: y2 }, color);
    }
  }

  /**
   * Calculates the bounding rectangle for a square cell's interior area.
   *
   * Returns the rectangular bounds that encompass the square's floor area,
   * used for positioning text, symbols, or other content within the cell.
   * The bounds exclude wall thickness and void spacing.
   *
   * @param cell - The cell to calculate bounds for
   * @returns Rectangle defining the cell's interior bounds
   */
  protected drawingBox(cell: Cell): Rect {
    const { x1, x4, y1, y4 } = this.cellOffsets(cell);

    return { x: x1, y: y1, width: x4 - x1, height: y4 - y1 };
  }
}
