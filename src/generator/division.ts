import { create2dArray } from '@technobuddha/library';

import { type Cell } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties } from './maze-generator.ts';

/**
 * Identifiers for subregions within a division region.
 *
 * @group Generator
 * @category Division
 * @internal
 */
type SubRegion = 'a' | 'b' | 'm';

/**
 * Configuration properties for creating a region.
 *
 * @group Generator
 * @category Division
 * @internal
 */
type RegionProperties = {
  /** Width of the region in cells */
  width: number;
  /** Height of the region in cells */
  height: number;
};

/**
 * Represents a rectangular region within the maze for division algorithm processing.
 *
 * A region maintains a 2D array tracking which subregion ('a', 'b', or 'm') each cell
 * belongs to during the division process. Regions can be split into smaller regions
 * based on the subregion assignments.
 *
 * @group Generator
 * @category Division
 * @internal
 */
class Region {
  private readonly width: number;
  private readonly height: number;
  public subregions: (SubRegion | null)[][];

  /**
   * Creates a new region with the specified dimensions.
   *
   * Initializes the subregion tracking array with all cells set to null,
   * indicating they haven't been assigned to any subregion yet.
   *
   * @param props - Region configuration properties
   */
  public constructor({ width, height }: RegionProperties) {
    this.width = width;
    this.height = height;
    this.subregions = create2dArray(width, height, null);
  }

  /**
   * Retrieves all cells belonging to a specific subregion.
   *
   * Scans the entire region and returns an array of cells that have been
   * assigned to the specified subregion during the division process.
   *
   * @param subregion - The subregion identifier to search for (defaults to 'm')
   * @returns Array of cells belonging to the specified subregion
   */
  public cells(subregion = 'm'): Cell[] {
    const cs: Cell[] = [];

    for (let x = 0; x < this.width; ++x) {
      for (let y = 0; y < this.height; ++y) {
        if (this.subregions[x][y] === subregion) {
          cs.push({ x, y });
        }
      }
    }

    return cs;
  }

  /**
   * Splits the region into separate regions based on subregion assignments.
   *
   * Creates new regions for subregions 'a' and 'b' if they contain enough cells
   * to meet the threshold requirement. This enables recursive division by creating
   * smaller regions for further processing.
   *
   * @param threshold - Minimum number of cells required for a subregion to become a new region
   * @returns Array of new regions created from qualifying subregions
   */
  public split(threshold: number): Region[] {
    const rs: Region[] = [];

    const a = this.cells('a');
    const b = this.cells('b');

    if (a.length >= threshold) {
      const r = new Region({ width: this.width, height: this.height });
      for (const c of a) {
        r.addCell(c);
      }
      rs.push(r);
    }

    if (b.length >= threshold) {
      const r = new Region({ width: this.width, height: this.height });
      for (const c of b) {
        r.addCell(c);
      }
      rs.push(r);
    }

    return rs;
  }

  /**
   * Adds a cell to the main subregion of this region.
   *
   * Marks the specified cell as belonging to the main subregion 'm',
   * indicating it's part of the region and available for division processing.
   *
   * @param cell - The cell to add to the region
   */
  public addCell(cell: Cell): void {
    this.subregions[cell.x][cell.y] = 'm';
  }
}

/**
 * Configuration properties for the Division maze generator.
 *
 * @group Generator
 * @category Division
 */
export type DivisionProperties = MazeGeneratorProperties & {
  /** Minimum number of cells required for a region to be further divided (defaults to 3) */
  threshold?: number;
};

/**
 * Division maze generator that creates mazes by recursively splitting regions.
 *
 * The division algorithm works by:
 * 1. Starting with the entire maze as one region
 * 2. Randomly selecting two seed cells in each region
 * 3. Growing these seeds into two subregions using random walk
 * 4. Creating walls along the boundary between subregions
 * 5. Leaving one random opening in the boundary wall
 * 6. Recursively dividing each subregion if it meets the threshold
 *
 * This approach creates mazes with a distinctive divided structure where large
 * chambers are connected by single passages. The threshold parameter controls
 * the minimum region size, affecting the granularity of the final maze structure.
 *
 * Key features:
 * - Configurable minimum region size through threshold parameter
 * - Guaranteed connectivity through mandatory boundary openings
 * - Recursive region subdivision for complex maze structures
 * - Random seed placement and growth for varied maze patterns
 *
 * @group Generator
 * @category Division
 */
export class Division extends MazeGenerator {
  private readonly threshold: number;

  /**
   * Creates a new Division generator with the specified configuration.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor({ threshold = 3, ...props }: DivisionProperties) {
    super({ ...props });

    this.threshold = threshold;
  }

  /**
   * Generates the maze using the recursive division algorithm.
   *
   * Implements the complete division process:
   * 1. Removes all interior walls to start with an open space
   * 2. Creates the initial region covering the entire maze
   * 3. Recursively processes regions from a stack
   * 4. For each region: places seeds, grows subregions, creates boundaries
   * 5. Leaves random openings in boundaries for connectivity
   * 6. Continues until all regions are smaller than the threshold
   *
   * @yields Control back to caller for animation between wall additions
   */
  public async *generate(): AsyncGenerator<void> {
    this.maze.removeInteriorWalls();
    this.maze.draw();

    const allRegion = new Region({ width: this.maze.width, height: this.maze.height });
    for (const cell of this.maze.cellsInMaze()) {
      allRegion.addCell(cell);
    }

    const stack = [allRegion];
    while (stack.length > 0) {
      const region = stack.pop()!;

      const [seedA, seedB] = this.randomShuffle(region.cells());
      region.subregions[seedA.x][seedA.y] = 'a';
      region.subregions[seedB.x][seedB.y] = 'b';

      const frontier = [seedA, seedB];

      while (frontier.length > 0) {
        const index = this.randomNumber(frontier.length);
        const cell = frontier[index];

        const neighbors = this.maze
          .moves(cell, { wall: false })
          .filter(({ target }) => region.subregions[target.x][target.y] === 'm');

        const neighbor = this.randomPick(neighbors);
        if (neighbor) {
          region.subregions[neighbor.target.x][neighbor.target.y] =
            region.subregions[cell.x][cell.y];
          frontier.push(neighbor.target);
        } else {
          frontier.splice(index, 1);
        }
      }

      const boundary = region
        .cells('a')
        .flatMap((cell) =>
          this.maze
            .moves(cell)
            .filter(({ target }) => region.subregions[target.x][target.y] === 'b'),
        );

      boundary.splice(this.randomNumber(boundary.length), 1);

      for (const cd of boundary) {
        this.maze.addWall(cd.target, this.maze.opposite(cd.target.facing));
        yield;
      }

      stack.push(...region.split(this.threshold));
    }
  }
}
