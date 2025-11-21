import { type CellFacing } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties, type Strategy } from './maze-generator.ts';

/**
 * Configuration properties for the Recursive Backtracker maze generator.
 *
 * @group Generator
 * @category RecursiveBacktracker
 */
export type RecursiveBacktrackerProperties = MazeGeneratorProperties & {
  /** Number of parallel players to use for generation (defaults to number of strategies or 1) */
  parallel?: number;
  /** Array of strategies for each player (defaults to single random strategy) */
  strategy?: Strategy[];
  /** Probability of forced backtracking (0-1, defaults to 0) */
  forced?: number;
};

/**
 * Recursive Backtracker maze generator with support for multiple parallel players.
 *
 * The Recursive Backtracker algorithm (also known as Depth-First Search) generates mazes by:
 * 1. Starting from a random cell and marking it as visited
 * 2. Randomly selecting an unvisited neighbor and carving a passage
 * 3. Moving to the neighbor and repeating the process
 * 4. When no unvisited neighbors exist, backtracking to the previous cell
 * 5. Continuing until all cells have been visited
 *
 * This implementation supports multiple parallel players, each with their own:
 * - Independent starting position and strategy
 * - Separate backtracking stack
 * - Turn-based generation with round-robin player switching
 *
 * When all players complete their individual paths, the algorithm connects
 * the separate segments by randomly linking visited areas to unvisited ones.
 *
 * Key features:
 * - Multi-player parallel generation for complex maze structures
 * - Configurable generation strategies per player
 * - Forced backtracking probability for varied passage patterns
 * - Automatic segment joining for complete maze connectivity
 * - Creates mazes with long, winding passages characteristic of DFS
 *
 * @group Generator
 * @category RecursiveBacktracker
 */
export class RecursiveBacktracker extends MazeGenerator {
  private readonly parallel: number;

  /**
   * Creates a new Recursive Backtracker generator with the specified configuration.
   *
   * Initializes multiple players at random starting positions, each with their own
   * strategy and backtracking stack. Players take turns generating passages until
   * all reachable cells are visited.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor({ parallel, strategy, forced = 0, ...props }: RecursiveBacktrackerProperties) {
    super(props);

    this.parallel = parallel ?? strategy?.length ?? 1;

    this.forced = forced;

    const all = this.maze.cellsInMaze();
    for (let i = 0; i < this.parallel; ++i) {
      const randomCell = this.randomPick(all)!;

      const start: CellFacing = {
        ...randomCell,
        facing: this.maze.opposite(this.randomPick(this.maze.nexus(randomCell).wallDirections())!),
      };

      this.createPlayer({ start, strategy: strategy?.[i] });
      this.player = i;
      this.visit();
    }

    this.player = 0;
  }

  /**
   * Generates the maze using the recursive backtracker algorithm with multiple players.
   *
   * Operates in two phases:
   *
   * **Generation Phase:**
   * - Players take turns in round-robin fashion
   * - Each player attempts to carve to an unvisited neighbor
   * - If successful, moves forward and adds current cell to stack
   * - If stuck, backtracks by popping from the stack
   * - Continues until all players exhaust their stacks
   *
   * **Joining Phase:**
   * - Randomly connects separate player territories
   * - Links visited areas to remaining unvisited cells
   * - Ensures complete maze connectivity
   *
   * @yields Control back to caller for animation after each wall removal
   */
  public async *generate(): AsyncGenerator<void> {
    while (true) {
      // If all players are at the end of their stack, we need to join the segments
      if (this.state.every((s) => s.current === undefined)) {
        this.player = 0;

        const borderCell = this.randomPick(
          this.maze
            .cellsInMaze()
            .filter((c) => this.isVisitedByMe(c) && !this.maze.nexus(c).bridge)
            .flatMap((c) =>
              this.maze
                .moves(c, { wall: true })
                .filter(
                  ({ target }) => !this.isVisitedByMe(target) && !this.maze.nexus(target).bridge,
                ),
            ),
        )?.target;

        if (borderCell) {
          this.maze.removeWall(borderCell, this.maze.opposite(borderCell.facing));
          yield;
          this.visit({ cell: borderCell });
        } else {
          return;
        }
      } else {
        // Find the next player
        while (this.state[this.player].current === undefined) {
          this.player = (this.player + 1) % this.parallel;
        }

        const next = this.step();
        if (next) {
          this.maze.removeWall(next, this.maze.opposite(next.facing));
          yield;

          this.state[this.player].stack.push(this.state[this.player].current!);
          this.moveTo(next);
          this.visit();

          this.player = (this.player + 1) % this.parallel;
        } else {
          this.state[this.player].current = this.state[this.player].stack.pop();
        }
      }
    }
  }
}
