/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import {
  type Cartesian,
  largestInscribedRectangle,
  modulo,
  type Polygon,
  type Rect,
} from '@technobuddha/library';

import { type Cell, type Direction, type Kind, type Pillar } from '../geometry/geometry.ts';
import { type DrawingSizes, Maze, type MazeProperties } from '../geometry/maze.ts';

import { brickMatrix } from './brick-matrix.ts';

/**
 * Configuration properties for brick maze construction.
 *
 * Inherits all standard maze properties for creating a brick-pattern maze where
 * cells are arranged in alternating rows like bricks in a wall.
 *
 * @group Maze
 * @category Brick
 */
export type BrickMazeProperties = MazeProperties;

/**
 * Brick-pattern maze with alternating row offsets.
 *
 * Creates mazes where cells are arranged in a brick-like pattern with alternating
 * rows offset by half a cell width. Each cell has six potential connections (two
 * horizontal and four diagonal). The offset creates a distinctive brick wall appearance
 * while maintaining rectangular grid coordinates.
 *
 * @group Maze
 * @category Brick
 */
export class BrickMaze extends Maze {
  public constructor({ cellSize = 20, wallSize = 1, voidSize = 2, ...props }: BrickMazeProperties) {
    super({ cellSize, wallSize, voidSize, ...props }, brickMatrix);
  }

  /**
   * Calculates drawing dimensions for the brick maze layout.
   *
   * Returns size parameters that account for the brick pattern's horizontal offset,
   * where cells are grouped in pairs with appropriate padding for the offset rows.
   *
   * @returns Drawing size configuration with group dimensions and padding
   */
  protected drawingSize(): DrawingSizes {
    return {
      groupWidth: this.cellSize * 2,
      groupHeight: this.cellSize * 2,
      verticalCellsPerGroup: 2,
      rightPadding: this.cellSize,
    };
  }

  /**
   * Determines the kind/type of a cell based on its row position.
   *
   * Returns 0 for even rows and 1 for odd rows, which determines the horizontal
   * offset in the brick pattern.
   *
   * @param cell - Cell to determine the kind for
   * @returns Cell kind (0 for even rows, 1 for odd rows)
   */
  public cellKind(cell: Cell): Kind {
    return modulo(cell.y, 2);
  }

  /**
   * Calculates the top-left origin point for drawing a cell.
   *
   * Computes the pixel coordinates where the cell starts, accounting for the
   * horizontal offset in odd rows to create the brick pattern.
   *
   * @param cell - Cell to get the origin for
   * @returns Cartesian coordinates of the cell's top-left corner
   */
  protected cellOrigin(cell: Cell): Cartesian {
    return {
      x: cell.x * this.cellSize * 2 + (this.cellKind(cell) === 0 ? 0 : this.cellSize),
      y: cell.y * this.cellSize,
    };
  }

  /**
   * Calculates coordinate offsets for drawing cell elements.
   *
   * Returns a set of named x and y coordinates that define the positions of walls,
   * voids, and interior spaces within the cell's drawing area.
   *
   * @param _kind - Cell kind (unused in brick mazes)
   * @returns Record of named offset coordinates for drawing
   */
  protected offsets(_kind: Kind): Record<string, number> {
    const x0 = 0;
    const x1 = x0 + this.voidSize;
    const x2 = x1 + this.wallSize;
    const cx = x0 + this.cellSize;
    const x4 = cx - this.voidSize;
    const x3 = x4 - this.wallSize;
    const x5 = cx + this.voidSize;
    const x6 = x5 + this.wallSize;
    const x9 = x0 + this.cellSize * 2;
    const x8 = x9 - this.voidSize;
    const x7 = x8 - this.wallSize;

    const y0 = 0;
    const y1 = y0 + this.voidSize;
    const y2 = y1 + this.wallSize;
    const y5 = y0 + this.cellSize;
    const y4 = y5 - this.voidSize;
    const y3 = y4 - this.wallSize;

    return { x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, y0, y1, y2, y3, y4, y5 };
  }

  /**
   * Erases a cell by drawing over its entire area with the specified color.
   *
   * Fills the complete cell area including walls and void spaces, effectively
   * clearing the cell from the drawing.
   *
   * @param cell - The cell to erase
   * @param color - The color to fill with
   */
  public eraseCell(cell: Cell, color = this.color.void): void {
    if (this.drawing) {
      const { x0, x9, y0, y5 } = this.cellOffsets(cell);
      this.drawing.rect({ x: x0, y: y0 }, { x: x9, y: y5 }, color);
    }
  }

  /**
   * Draws the floor/interior area of a brick cell.
   *
   * Renders the walkable area within the cell boundaries, filling the space
   * between the walls and void areas.
   *
   * @param cell - The cell to draw the floor for
   * @param color - The floor color
   */
  public drawFloor(cell: Cell, color = this.color.cell): void {
    if (this.drawing) {
      const { x1, x8, y1, y4 } = this.cellOffsets(cell);

      this.drawing.rect({ x: x1, y: y1 }, { x: x8, y: y4 }, color);
    }
  }

  /**
   * Draws a wall on the specified side of a brick cell.
   *
   * Renders a wall segment in one of six directions. Brick cells have walls in
   * six directions: a (top-left), b (top-right), c (right), d (bottom-right),
   * e (bottom-left), and f (left).
   *
   * @param cell - The cell to draw the wall for
   * @param direction - The side/direction of the wall
   * @param color - The wall color
   */
  public drawWall(cell: Cell, direction: Direction, color = this.color.wall): void {
    if (this.drawing) {
      switch (direction) {
        case 'a': {
          const { x2, x3, y1, y2 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x2, y: y1 }, { x: x3, y: y2 }, color);
          break;
        }
        case 'b': {
          const { x6, x7, y1, y2 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x6, y: y1 }, { x: x7, y: y2 }, color);
          break;
        }
        case 'c': {
          const { x7, x8, y2, y3 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x7, y: y2 }, { x: x8, y: y3 }, color);
          break;
        }
        case 'd': {
          const { x6, x7, y3, y4 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x6, y: y3 }, { x: x7, y: y4 }, color);
          break;
        }
        case 'e': {
          const { x2, x3, y3, y4 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x2, y: y3 }, { x: x3, y: y4 }, color);
          break;
        }
        case 'f': {
          const { x1, x2, y2, y3 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y2 }, { x: x2, y: y3 }, color);
          break;
        }

        // no default
      }
    }
  }

  /**
   * Draws a passage (opening) in a wall to show a connection between cells.
   *
   * Renders wall sections with a cell-colored opening in the middle to indicate
   * a walkable connection. The wall areas on either side of the passage remain visible
   * to maintain the maze structure.
   *
   * @param cell - The cell to draw the passage from
   * @param direction - The direction of the passage
   * @param wallColor - Color for wall sections flanking the passage
   * @param cellColor - Color for the passage opening itself
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
          const { x1, x2, x3, x4, y0, y1 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y0 }, { x: x2, y: y1 }, wallColor);
          this.drawing.rect({ x: x2, y: y0 }, { x: x3, y: y1 }, cellColor);
          this.drawing.rect({ x: x3, y: y0 }, { x: x4, y: y1 }, wallColor);
          break;
        }

        case 'b': {
          const { x5, x6, x7, x8, y0, y1 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x5, y: y0 }, { x: x6, y: y1 }, wallColor);
          this.drawing.rect({ x: x6, y: y0 }, { x: x7, y: y1 }, cellColor);
          this.drawing.rect({ x: x7, y: y0 }, { x: x8, y: y1 }, wallColor);
          break;
        }

        case 'c': {
          const { x8, x9, y1, y2, y3, y4 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x8, y: y1 }, { x: x9, y: y2 }, wallColor);
          this.drawing.rect({ x: x8, y: y2 }, { x: x9, y: y3 }, cellColor);
          this.drawing.rect({ x: x8, y: y3 }, { x: x9, y: y4 }, wallColor);
          break;
        }

        case 'd': {
          const { x5, x6, x7, x8, y4, y5 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x5, y: y4 }, { x: x6, y: y5 }, wallColor);
          this.drawing.rect({ x: x6, y: y4 }, { x: x7, y: y5 }, cellColor);
          this.drawing.rect({ x: x7, y: y4 }, { x: x8, y: y5 }, wallColor);
          break;
        }

        case 'e': {
          const { x1, x2, x3, x4, y4, y5 } = this.cellOffsets(cell);
          this.drawing.rect({ x: x1, y: y4 }, { x: x2, y: y5 }, wallColor);
          this.drawing.rect({ x: x2, y: y4 }, { x: x3, y: y5 }, cellColor);
          this.drawing.rect({ x: x3, y: y4 }, { x: x4, y: y5 }, wallColor);
          break;
        }

        case 'f': {
          const { x0, x1, y1, y2, y3, y4 } = this.cellOffsets(cell);
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
   * Draws a pillar at the intersection where two walls meet.
   *
   * Renders corner pieces at wall intersections, identified by two-letter combinations
   * of adjacent directions (e.g., 'ab' for the corner between walls a and b).
   *
   * @param param0 - The cell coordinates
   * @param pillar - The pillar identifier (two adjacent directions)
   * @param color - The pillar color
   */
  public drawPillar({ x, y }: Cell, pillar: Pillar, color = this.color.wall): void {
    if (this.drawing) {
      switch (pillar) {
        case 'ab': {
          const { x3, x6, y1, y2 } = this.cellOffsets({ x, y });
          this.drawing.rect({ x: x3, y: y1 }, { x: x6, y: y2 }, color);
          break;
        }
        case 'bc': {
          const { x7, x8, y1, y2 } = this.cellOffsets({ x, y });
          this.drawing.rect({ x: x7, y: y1 }, { x: x8, y: y2 }, color);
          break;
        }
        case 'cd': {
          const { x7, x8, y3, y4 } = this.cellOffsets({ x, y });
          this.drawing.rect({ x: x7, y: y3 }, { x: x8, y: y4 }, color);
          break;
        }
        case 'de': {
          const { x3, x6, y3, y4 } = this.cellOffsets({ x, y });
          this.drawing.rect({ x: x3, y: y3 }, { x: x6, y: y4 }, color);
          break;
        }
        case 'ef': {
          const { x1, x2, y3, y4 } = this.cellOffsets({ x, y });
          this.drawing.rect({ x: x1, y: y3 }, { x: x2, y: y4 }, color);
          break;
        }
        case 'fa': {
          const { x1, x2, y1, y2 } = this.cellOffsets({ x, y });
          this.drawing.rect({ x: x1, y: y1 }, { x: x2, y: y2 }, color);
          break;
        }
        // no default
      }
    }
  }

  /**
   * Calculates the drawing box for content within a brick cell.
   *
   * Returns the largest inscribed rectangle that can fit inside the cell's walkable
   * area, used for positioning text, symbols, or other content centered in the cell.
   *
   * @param cell - The cell to calculate the drawing box for
   * @returns Rectangle defining the usable drawing area within the cell
   */
  protected drawingBox(cell: Cell): Rect {
    const { x2, x7, y2, y3 } = this.cellOffsets(cell);

    const interior: Polygon = [
      { x: x2, y: y2 },
      { x: x7, y: y2 },
      { x: x7, y: y3 },
      { x: x2, y: y3 },
    ];

    return largestInscribedRectangle(interior);
  }

  /**
   * Draws an X mark across a brick cell to indicate blocked or inaccessible areas.
   *
   * Renders diagonal lines from corner to corner within the cell interior to visually
   * mark the cell as blocked, masked, or otherwise special.
   *
   * @param cell - The cell to mark with an X
   * @param color - The X mark color
   */
  public drawX(cell: Cell, color = this.color.blocked): void {
    if (this.drawing) {
      const { x2, x7, y2, y3 } = this.cellOffsets(cell);

      this.drawing.line({ x: x2, y: y2 }, { x: x7, y: y3 }, color);
      this.drawing.line({ x: x2, y: y3 }, { x: x7, y: y2 }, color);
    }
  }
}
