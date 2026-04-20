import { type Cell } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties } from './maze-generator.ts';

/**
 * Cell selection methods for the Growing Tree algorithm.
 *
 * Defines different strategies for choosing which cell to grow from next:
 * - 'newest': Always select the most recently added cell (stack-like behavior)
 * - 'oldest': Always select the oldest unprocessed cell (queue-like behavior)
 * - 'middle': Select the cell from the middle of the list
 * - 'random': Randomly select any cell from the active list
 *
 * @group Generator
 * @category Growing Tree
 */
export type Method = 'newest' | 'oldest' | 'middle' | 'random';

/**
 * Configuration properties for the Growing Tree maze generator.
 *
 * @group Generator
 * @category Growing Tree
 */
export type GrowingTreeProperties = MazeGeneratorProperties & {
  /** Cell selection method - either a single method or weighted combination of methods */
  method?: Method | Record<Method, number>;
};

/**
 * Growing Tree maze generator with configurable cell selection strategies.
 *
 * The Growing Tree algorithm maintains a list of active cells and repeatedly:
 * 1. Selects a cell from the active list using the configured method
 * 2. Attempts to carve a passage to an unvisited neighbor
 * 3. If successful, adds the new cell to the active list
 * 4. If no neighbors are available, removes the cell from the active list
 *
 * The algorithm's behavior depends entirely on the selection method:
 * - 'newest': Creates long, winding passages (like recursive backtracker)
 * - 'oldest': Creates short, branching passages (like Prim's algorithm)
 * - 'middle': Balances between the two extremes
 * - 'random': Creates varied maze structures
 *
 * Multiple methods can be combined with weights to create hybrid behaviors.
 *
 * Key features:
 * - Configurable cell selection strategies
 * - Support for weighted method combinations
 * - Guaranteed maze completion with single solution
 * - Flexible maze structure control through method selection
 *
 * @group Generator
 * @category Growing Tree
 */
export class GrowingTree extends MazeGenerator {
  private readonly list: Cell[];
  private readonly method: Method | Record<Method, number>;

  /**
   * Creates a new Growing Tree generator with the specified configuration.
   *
   * Initializes the generator with the starting cell in the active list
   * and sets up the configured selection method strategy.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor({ method = 'random', ...props }: GrowingTreeProperties) {
    super(props);

    this.method = method;
    this.list = [this.start];

    this.player = 0;
    this.createPlayer({ start: this.start });
    this.visit();
  }

  /**
   * Selects a cell selection method based on the configured strategy.
   *
   * For single method configurations, returns that method directly.
   * For weighted method combinations, uses random selection based on
   * the relative weights of each method.
   *
   * @returns The selected method for this iteration
   */
  private selectMethod(): Method {
    if (typeof this.method === 'string') {
      return this.method;
    }

    const total = Object.values(this.method).reduce((a, b) => a + b, 0);
    let rand = this.random() * total;
    for (const key of Object.keys(this.method) as Method[]) {
      rand -= this.method[key];
      if (rand <= 0) {
        return key;
      }
    }

    return 'random';
  }

  /**
   * Selects a cell index from the active list using the specified method.
   *
   * Implements the core cell selection logic that determines which
   * active cell will be used for the next carving attempt.
   *
   * @param selectionMethod - The method to use for cell selection
   * @returns Index of the selected cell in the active list
   */
  public selectCell(selectionMethod: Method): number {
    switch (selectionMethod) {
      case 'newest': {
        return this.list.length - 1;
      }
      case 'oldest': {
        return 0;
      }
      case 'middle': {
        return Math.floor(this.list.length / 2);
      }
      case 'random':
      default: {
        return this.randomIndex(this.list)!;
      }
    }
  }

  /**
   * Generates the maze using the Growing Tree algorithm.
   *
   * Continues processing the active cell list until no cells remain:
   * 1. Selects a cell using the configured method
   * 2. Attempts to carve to an unvisited neighbor
   * 3. If successful, adds the neighbor to the active list
   * 4. If no neighbors available, removes the cell from the list
   *
   * @yields Control back to caller for animation after each wall removal
   */
  public async *generate(): AsyncGenerator<void> {
    while (this.list.length > 0) {
      const index = this.selectCell(this.selectMethod());
      const currentCell = this.list[index];

      const next = this.randomPick(
        this.maze
          .moves(currentCell, { wall: true })
          .filter(({ target }) => !this.isVisited(target)),
      );

      if (next) {
        this.maze.removeWall(currentCell, next.direction);
        yield;

        this.visit({ cell: next.target });
        this.list.push(next.target);
      } else {
        this.list.splice(index, 1);
      }
    }
  }
}
