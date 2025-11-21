import { type Cartesian, modulo } from '@technobuddha/library';

import { type Cell } from '../geometry.ts';
import { type DrawingSizes } from '../maze.ts';

import { matrixDiamond } from './octagon-matrix.ts';
import { OctagonMaze, type OctagonMazeProperties } from './octagon-maze.ts';

/**
 * Properties for configuring an OctagonDiamond maze instance.
 *
 * @group Geometry
 * @category Mazes
 */
export type OctagonDiamondProperties = OctagonMazeProperties;

/**
 * A specialized octagon maze that renders cells in a diamond tessellation pattern.
 *
 * This maze implementation extends the standard octagon maze by arranging cells
 * in alternating diamond patterns where octagonal cells are interspersed with
 * smaller diamond-shaped cells. The layout creates a more complex visual pattern
 * with two distinct cell types arranged in a checkerboard-like formation.
 *
 * @group Geometry
 * @category Mazes
 */
export class OctagonDiamond extends OctagonMaze {
  /**
   * Creates a new OctagonDiamond maze instance.
   *
   * @param props - Configuration properties for the maze
   */
  public constructor(props: OctagonDiamondProperties) {
    super(props, matrixDiamond);
  }

  /**
   * Calculates the drawing dimensions for the diamond tessellation layout.
   *
   * Uses a compact grouping pattern where cells are arranged in pairs
   * horizontally to accommodate the alternating diamond pattern.
   *
   * @returns The sizing configuration for rendering the diamond pattern
   */
  protected drawingSize(): DrawingSizes {
    return {
      groupWidth: this.cellSize,
      horizontalCellsPerGroup: 2,
      groupHeight: this.cellSize,
    };
  }

  /**
   * Determines if a cell is within the maze boundaries.
   *
   * Overrides the base implementation to exclude the last row of square cells,
   * creating a cleaner visual appearance by preventing incomplete patterns
   * at the maze edges.
   *
   * @param cell - The cell to check
   * @returns True if the cell is within the valid maze area
   */
  public override inMaze(cell: Cell): boolean {
    return (
      super.inMaze(cell) &&
      cell.x < this.width - 1 &&
      (modulo(cell.x, 2) === 0 || cell.y < this.height - 1)
    );
  }

  /**
   * Determines the kind/type of a cell based on its column position.
   *
   * Uses column parity to alternate between octagonal cells (even columns)
   * and diamond cells (odd columns) in the tessellation pattern.
   *
   * @param cell - The cell to analyze
   * @returns 0 for octagonal cells (even columns), 1 for diamond cells (odd columns)
   */
  public override cellKind(cell: Cell): number {
    return modulo(cell.x, 2);
  }

  /**
   * Calculates the origin point for a cell in the diamond tessellation.
   *
   * Computes different positioning based on cell kind to create the proper
   * diamond pattern arrangement. Octagonal cells follow a regular grid,
   * while diamond cells are offset and positioned at the intersections.
   *
   * @param cell - The cell to locate
   * @returns The top-left corner coordinates of the cell's bounding area
   * @throws Error if an unknown cell kind is encountered
   */
  protected cellOrigin(cell: Cell): Cartesian {
    // Calculate the length of a an octagon side
    const ao = this.cellSize / (1 + Math.SQRT2);

    switch (this.cellKind(cell)) {
      case 0: {
        return { x: cell.x * this.cellSize * 0.5, y: cell.y * this.cellSize };
      }

      case 1: {
        return {
          x: ((cell.x - 1) * this.cellSize) / 2 + this.cellSize - Math.sqrt((ao * ao) / 2),
          y: cell.y * this.cellSize + this.cellSize - Math.sqrt((ao * ao) / 2),
        };
      }

      default: {
        throw new Error(`Unknown cell kind: ${this.cellKind(cell)}`);
      }
    }
  }
}
