import { type Cartesian, modulo } from '@technobuddha/library';

import { type Cell } from '../geometry/geometry.ts';
import { type DrawingSizes } from '../geometry/maze.ts';

import { matrixSquare } from './octagon-matrix.ts';
import { OctagonMaze, type OctagonMazeProperties } from './octagon-maze.ts';

/**
 * Properties for configuring an octagon-square maze.
 * Inherits all standard octagon maze properties without additional configuration.
 *
 * @group Maze
 * @category Octagon
 */
export type OctagonSquareProperties = OctagonMazeProperties;

/**
 * A maze implementation that combines octagons and squares in a tessellating pattern.
 *
 * This creates a visually appealing maze where octagonal cells are interspersed with
 * square cells to form a complete tiling of the plane. The tessellation follows a
 * checkerboard pattern where:
 * - Octagonal cells (kind 0) occupy even grid positions in both x and y
 * - Square cells (kind 2) fill the gaps between octagons
 *
 * The squares are positioned at the intersections between octagonal cells and are
 * rotated 45° relative to the grid axes. This creates a more complex path structure
 * than pure octagonal mazes while maintaining geometric regularity.
 *
 * Key features:
 * - Two cell types: octagons (8 sides) and squares (4 sides)
 * - Checkerboard alternating pattern
 * - Seamless tessellation with no gaps
 * - Compatible with all standard maze generation algorithms
 *
 * @group Maze
 * @category Octagon
 */
export class OctagonSquare extends OctagonMaze {
  /**
   * Creates a new octagon-square tessellation maze.
   *
   * Uses the square matrix configuration to define the specific connection
   * patterns between octagonal and square cells in the tessellation.
   *
   * @param props - Configuration properties for the maze
   */
  public constructor(props: OctagonSquareProperties) {
    super(props, matrixSquare);
  }

  /**
   * Calculates the drawing dimensions for the octagon-square tessellation layout.
   *
   * Determines the group sizes and padding needed to properly render the tessellation.
   * The group size is based on the octagon side length, which is calculated from the
   * cell size using the relationship: side = cellSize / (1 + √2).
   *
   * @returns The drawing size configuration including:
   *   - groupWidth/Height: Size of each 2×2 cell group
   *   - padding: Adjustments for proper visual alignment
   */
  protected drawingSize(): DrawingSizes {
    // Calculate the length of an octagon side using the geometric relationship
    // where cellSize is the diameter of the octagon's circumscribed square
    const ao = this.cellSize / (1 + Math.SQRT2);

    return {
      groupWidth: this.cellSize + ao,
      horizontalCellsPerGroup: 2,
      groupHeight: this.cellSize + ao,
      verticalCellsPerGroup: 2,
      topPadding: this.wrapVertical ? this.cellSize * Math.SQRT1_2 * 0.5 : 0,
      bottomPadding:
        this.wrapVertical ? this.cellSize * Math.SQRT1_2 * 0.5 : -ao * 2 * Math.SQRT1_2,
    };
  }

  /**
   * Determines if a cell is within the maze boundaries for rendering.
   *
   * Excludes the last row and column of squares when not wrapping to improve
   * the visual appearance of the maze edges. This prevents incomplete square
   * cells from appearing at the maze borders.
   *
   * @param cell - The cell to check for inclusion
   * @returns True if the cell should be rendered, false if it should be excluded
   */
  // Don't render the last row of squares, the maze looks better
  public override inMaze(cell: Cell): boolean {
    return (
      super.inMaze(cell) &&
      (this.wrapHorizontal || cell.x < this.width - 1) &&
      (this.wrapVertical || cell.y < this.height - 1)
    );
  }

  /**
   * Determines the type of cell (octagon or square) based on grid position.
   *
   * Uses a checkerboard pattern to alternate between cell types:
   * - Even x,y coordinates → octagon (kind 0)
   * - Odd x,y coordinates → octagon (kind 0)
   * - Mixed parity coordinates → square (kind 2)
   *
   * This creates the characteristic alternating pattern of the octagon-square
   * tessellation where squares appear at the intersections between octagons.
   *
   * @param cell - The cell to classify
   * @returns The cell kind identifier:
   *   - 0: Octagonal cell (8-sided)
   *   - 2: Square cell (4-sided, rotated 45°)
   */
  public override cellKind(cell: Cell): number {
    return (
      modulo(cell.y, 2) === 0 ?
        modulo(cell.x, 2) === 0 ?
          0
        : 2
      : modulo(cell.x, 2) === 0 ? 2
      : 0
    );
  }

  /**
   * Calculates the origin point (top-left corner) for drawing a cell.
   *
   * Positions octagons and squares correctly within the tessellating pattern,
   * taking into account their different sizes and the geometric constraints
   * of the tessellation. The positioning ensures that:
   * - Octagons align on a regular grid
   * - Squares fit precisely in the gaps between octagons
   * - The overall pattern tiles seamlessly
   *
   * For odd rows (y % 2 === 1), both cell types are offset to maintain
   * the tessellation alignment.
   *
   * @param cell - The cell to position
   * @returns The Cartesian coordinates of the cell's drawing origin
   * @throws Error if an unknown cell kind is encountered
   */
  protected cellOrigin(cell: Cell): Cartesian {
    // Calculate the length of an octagon side
    const ao = this.cellSize / (1 + Math.SQRT2);

    let x = 0;
    let y = 0;

    switch (this.cellKind(cell)) {
      case 0: {
        // Octagonal cells
        x = Math.floor(cell.x / 2) * (this.cellSize + ao);
        y = Math.floor(cell.y / 2) * (this.cellSize + ao);
        break;
      }

      case 2: {
        // Square cells
        x =
          Math.floor(cell.x / 2) * (this.cellSize + ao) +
          (modulo(cell.y, 2) === 0 ? this.cellSize : -ao);
        y = Math.floor(cell.y / 2) * (this.cellSize + ao) + Math.SQRT1_2 * ao;
        break;
      }

      default: {
        throw new Error(`Unknown cell kind: ${this.cellKind(cell)}`);
      }
    }

    // Apply offset for odd rows to maintain tessellation alignment
    if (modulo(cell.y, 2) === 1) {
      x += ao * Math.SQRT1_2 + ao;
      y += ao * Math.SQRT1_2 + ao;
    }

    return { x, y };
  }
}
