/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import {
  type Cartesian,
  largestInscribedRectangle,
  modulo,
  type Polygon,
  type Rect,
} from '@technobuddha/library';

import { type Cell, type Direction, type Kind, type Pillar } from '../geometry.ts';
import { type DrawingSizes, Maze, type MazeProperties } from '../maze.ts';

import { brickMatrix } from './brick-matrix.ts';

export type BrickMazeProperties = MazeProperties;

export class BrickMaze extends Maze {
  public constructor({ cellSize = 20, wallSize = 1, voidSize = 2, ...props }: BrickMazeProperties) {
    super({ cellSize, wallSize, voidSize, ...props }, brickMatrix);
  }

  protected drawingSize(): DrawingSizes {
    return {
      groupWidth: this.cellSize * 2,
      groupHeight: this.cellSize * 2,
      verticalCellsPerGroup: 2,
      rightPadding: this.cellSize,
    };
  }

  public cellKind(cell: Cell): Kind {
    return modulo(cell.y, 2);
  }

  protected cellOrigin(cell: Cell): Cartesian {
    return {
      x: cell.x * this.cellSize * 2 + (this.cellKind(cell) === 0 ? 0 : this.cellSize),
      y: cell.y * this.cellSize,
    };
  }

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
   * Covers the complete cell including walls and void spaces.
   * @param cell - The cell to erase
   * @param color - The color to fill with (defaults to void color)
   */
  public eraseCell(cell: Cell, color = this.color.void): void {
    if (this.drawing) {
      const { x0, x9, y0, y5 } = this.cellOffsets(cell);
      this.drawing.rect({ x: x0, y: y0 }, { x: x9, y: y5 }, color);
    }
  }

  /**
   * Draws the floor/interior area of a hexagonal cell.
   * Renders the walkable area within the cell boundaries.
   * @param cell - The cell to draw the floor for
   * @param color - The floor color (defaults to cell color)
   */
  public drawFloor(cell: Cell, color = this.color.cell): void {
    if (this.drawing) {
      const { x1, x8, y1, y4 } = this.cellOffsets(cell);

      this.drawing.rect({ x: x1, y: y1 }, { x: x8, y: y4 }, color);
    }
  }

  /**
   * Draws a wall on the specified side of a hexagonal cell.
   * Each side corresponds to one of the six directions in hexagonal coordinates.
   * @param cell - The cell to draw the wall for
   * @param direction - The side/direction of the wall (a=top-left, b=top-right, c=right, d=bottom-right, e=bottom-left, f=left)
   * @param color - The wall color (defaults to wall color)
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
   * Draws a passage (opening) in a wall by creating a walkable connection.
   * Renders wall sections with a cell-colored opening in the middle to show connectivity.
   * @param cell - The cell to draw the passage from
   * @param direction - The direction of the passage (a-f for hexagonal sides)
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
   * Draws a pillar (corner/intersection) where two walls meet in a hexagonal cell.
   * Pillars are rendered at the intersections between adjacent wall directions.
   * @param param0 - The cell coordinates (destructured as x, y)
   * @param pillar - The pillar identifier (two-letter combination like 'ab', 'bc', etc.)
   * @param color - The pillar color (defaults to wall color)
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
   * Calculates the drawing box (bounding rectangle) for content within a hexagonal cell.
   * Returns the largest inscribed rectangle that can fit inside the cell's walkable area.
   * Used for positioning text, symbols, or other content within the cell.
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
   * Draws an X mark across a hexagonal cell to indicate blocked or inaccessible areas.
   * Renders diagonal lines from corner to corner within the cell interior.
   * @param cell - The cell to mark with an X
   * @param color - The X mark color (defaults to blocked color)
   */
  public drawX(cell: Cell, color = this.color.blocked): void {
    if (this.drawing) {
      const { x2, x7, y2, y3 } = this.cellOffsets(cell);

      this.drawing.line({ x: x2, y: y2 }, { x: x7, y: y3 }, color);
      this.drawing.line({ x: x2, y: y3 }, { x: x7, y: y2 }, color);
    }
  }
}
