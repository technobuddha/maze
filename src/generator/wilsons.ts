import { type Cell, type CellFacing } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties } from './maze-generator.ts';

/**
 * Configuration properties for the Wilson's maze generator.
 *
 * @group Generator
 * @category Wilsons
 */
export type WilsonsProperties = MazeGeneratorProperties;

/**
 * Wilson's maze generator that creates mazes using loop-erased random walks.
 *
 * Wilson's algorithm generates mazes by performing loop-erased random walks:
 * 1. Marks one initial cell as visited (part of the maze)
 * 2. Selects a random unvisited cell and performs a random walk
 * 3. If the walk encounters itself, erases the loop and continues
 * 4. When the walk reaches a visited cell, carves the entire path
 * 5. Marks all cells in the path as visited
 * 6. Repeats until all cells are visited
 *
 * The loop-erasure property ensures that:
 * - No cycles are created in the final maze
 * - Each random walk contributes a simple path to the maze
 * - The algorithm produces a uniform spanning tree
 *
 * Key characteristics:
 * - Produces unbiased mazes with uniform distribution
 * - Guaranteed single solution with no cycles
 * - Can be slower than other algorithms due to loop erasure
 * - Creates natural, organic-looking maze structures
 * - Each generated maze has equal probability among all possible spanning trees
 *
 * @group Generator
 * @category Wilsons
 */
export class Wilsons extends MazeGenerator {
  /** List of cells that have not yet been incorporated into the maze */
  private readonly unvisited: Cell[];

  /**
   * Creates a new Wilson's generator with the specified configuration.
   *
   * Initializes the generator with all cells marked as unvisited except
   * for the starting cell which becomes the initial seed of the maze.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor(props: WilsonsProperties) {
    super(props);

    this.unvisited = this.maze.cellsInMaze();

    this.player = 0;
    this.createPlayer();

    this.markAsVisited(this.start);
  }

  /**
   * Marks a cell as visited and removes it from the unvisited list.
   *
   * Updates both the internal visitation tracking and the unvisited
   * cell list to reflect that the cell is now part of the maze.
   *
   * @param cell - Cell to mark as visited
   */
  private markAsVisited(cell: Cell): void {
    this.visit({ cell });

    const index = this.unvisited.findIndex((c) => c.x === cell.x && c.y === cell.y);
    if (index >= 0) {
      this.unvisited.splice(index, 1);
    }
  }

  /**
   * Generates the maze using Wilson's loop-erased random walk algorithm.
   *
   * Continues until all cells are visited:
   * 1. Selects a random unvisited cell as the starting point
   * 2. Performs a random walk, tracking the path
   * 3. If the walk encounters itself, erases the loop portion
   * 4. When the walk reaches a visited cell, carves the entire path
   * 5. Marks all path cells as visited
   * 6. Repeats with remaining unvisited cells
   *
   * The loop erasure ensures no cycles are created while the random
   * walk property produces unbiased, uniformly distributed mazes.
   *
   * @yields Control back to caller for animation after each wall removal
   */
  public async *generate(): AsyncGenerator<void> {
    while (this.unvisited.length > 0) {
      let currentCell = this.randomPick(this.unvisited)!;
      let path: (Cell | CellFacing)[] = [currentCell];

      while (!this.isVisited(currentCell)) {
        const { target } = this.randomPick(this.maze.moves(currentCell, { wall: true }))!;

        let cellVisited = false;
        let cellPreviousIndex = -1;
        for (const [index, pathCell] of path.entries()) {
          if (this.maze.isSame(pathCell, target)) {
            cellVisited = true;
            cellPreviousIndex = index;
          }
        }

        if (cellVisited) {
          currentCell = path[cellPreviousIndex];
          path = path.slice(0, cellPreviousIndex + 1);
        } else {
          path.push(target);
          currentCell = target;
        }
      }

      for (const cell of path) {
        if ('facing' in cell) {
          this.maze.removeWall(cell, this.maze.opposite(cell.facing));
          yield;
        }
        this.markAsVisited(cell);
      }
    }
  }
}
