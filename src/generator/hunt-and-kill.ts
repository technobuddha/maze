import { type AllOrder, type CellDirection } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties } from './maze-generator.ts';

/**
 * Configuration properties for the Hunt and Kill maze generator.
 *
 * @group Generator
 * @category Hunt And Kill
 */
export type HuntAndKillProperties = MazeGeneratorProperties & {
  /** Order in which to scan cells during the hunt phase (defaults to 'top-left') */
  huntMethod?: AllOrder;
};

/**
 * Hunt and Kill maze generator that alternates between random walk and systematic hunting.
 *
 * The Hunt and Kill algorithm operates in two distinct phases:
 *
 * **Kill Phase:**
 * - Performs a random walk from the current position
 * - Carves passages to unvisited neighbors randomly
 * - Continues until no unvisited neighbors are available
 *
 * **Hunt Phase:**
 * - Systematically scans the maze in the specified order
 * - Looks for unvisited cells adjacent to visited cells
 * - Connects the first found unvisited cell to a visited neighbor
 * - Resumes the kill phase from the newly connected cell
 *
 * This approach creates mazes with long, winding passages (from the kill phase)
 * connected by strategic links (from the hunt phase). The hunt method determines
 * the scanning pattern, which can influence the overall maze structure and bias.
 *
 * Key features:
 * - Configurable hunt scanning order for different maze biases
 * - Single-path mazes with guaranteed connectivity
 * - Efficient generation with minimal backtracking
 * - Long passages characteristic of random walk algorithms
 *
 * @group Generator
 * @category Hunt And Kill
 */
export class HuntAndKill extends MazeGenerator {
  private readonly huntMethod: AllOrder;

  /**
   * Creates a new Hunt and Kill generator with the specified configuration.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor({ huntMethod = 'top-left', ...props }: HuntAndKillProperties) {
    super(props);

    this.huntMethod = huntMethod;

    // We are not supporting multiple hunters at this moment
    this.createPlayer();
    this.player = 0;
  }

  /**
   * Generates the maze using the Hunt and Kill algorithm.
   *
   * Alternates between kill and hunt phases until the entire maze is carved:
   *
   * 1. **Kill Phase**: Performs random walk, carving passages until stuck
   * 2. **Hunt Phase**: Scans for unvisited cells adjacent to visited areas
   * 3. Connects found cell to visited neighbor and resumes kill phase
   * 4. Continues until no unvisited cells remain
   *
   * @yields Control back to caller for animation after each wall removal
   */
  public async *generate(): AsyncGenerator<void> {
    while (true) {
      // kill
      this.visit();

      const next = this.step();

      if (next) {
        this.moveTo(next);
        this.maze.removeWall(next, this.maze.opposite(next.facing));
        yield;
      } else {
        // hunt
        let target: CellDirection | undefined = undefined;
        for (const cell of this.maze.cellsInMaze(this.huntMethod)) {
          if (!this.isVisited(cell)) {
            const hunted = this.randomPick(
              this.maze.moves(cell, { wall: true }).filter(({ target }) => this.isVisited(target)),
            );
            if (hunted) {
              target = { ...cell, direction: hunted.direction };
              break;
            }
          }
        }
        if (target) {
          yield this.maze.removeWall(target, target.direction);
          this.moveTo({ ...target, facing: this.maze.opposite(target.direction) });
        } else {
          return;
        }
      }
    }
  }
}
