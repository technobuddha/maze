import { type Cell } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties } from './maze-generator.ts';

/**
 * Configuration properties for the Prim's maze generator.
 *
 * @group Generator
 * @category Prims
 */
export type PrimsProperties = MazeGeneratorProperties;

/**
 * Prim's maze generator that grows the maze by expanding from a frontier of active cells.
 *
 * Prim's algorithm generates mazes using a minimum spanning tree approach:
 * 1. Starts with a single cell marked as visited
 * 2. Maintains a list of "active" cells that can potentially grow
 * 3. Randomly selects an active cell and attempts to connect to an unvisited neighbor
 * 4. If connection is made, the neighbor becomes active and visited
 * 5. If no unvisited neighbors exist, removes the cell from the active list
 * 6. Continues until no active cells remain
 *
 * This approach creates mazes with:
 * - Short, branching passages rather than long corridors
 * - More uniform distribution of dead ends
 * - Organic, tree-like growth patterns
 * - Guaranteed single solution with no cycles
 *
 * The algorithm tends to create mazes with many short branches and a more
 * "bushy" appearance compared to algorithms like recursive backtracking.
 *
 * @group Generator
 * @category Prims
 */
export class Prims extends MazeGenerator {
  /** List of cells that can potentially grow the maze further */
  public activeCells: Cell[];

  /**
   * Creates a new Prim's generator with the specified configuration.
   *
   * Initializes the generator with the starting cell as the first active cell
   * and marks it as visited to begin the growing process.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor(props: PrimsProperties) {
    super(props);

    this.activeCells = [this.start];

    this.player = 0;
    this.createPlayer({ start: this.start });
    this.visit();
  }

  /**
   * Generates the maze using Prim's minimum spanning tree algorithm.
   *
   * Continuously processes the active cell list:
   * 1. Randomly selects an active cell
   * 2. Attempts to connect to an unvisited neighbor
   * 3. If successful, adds the neighbor to visited and active lists
   * 4. If no neighbors available, removes the cell from active list
   * 5. Continues until no active cells remain
   *
   * @yields Control back to caller for animation after each wall removal
   */
  public override async *generate(): AsyncGenerator<void> {
    while (this.activeCells.length > 0) {
      const cellIndex = this.randomNumber(this.activeCells.length);
      const currentCell = this.activeCells[cellIndex];

      const next = this.randomPick(
        this.maze
          .moves(currentCell, { wall: true })
          .filter(({ target }) => !this.isVisited(target)),
      );
      if (next) {
        this.maze.removeWall(currentCell, next.direction);
        yield;
        this.visit({ cell: next.target });

        this.activeCells.push(next.target);
      } else {
        this.activeCells.splice(cellIndex, 1);
      }
    }
  }
}
