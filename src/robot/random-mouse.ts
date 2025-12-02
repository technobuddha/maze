import { Robot, type RobotProperties } from './robot.ts';

/**
 * Configuration properties for the Random Mouse robot.
 *
 * @group Robot
 * @category  Random Mouse
 */
export type RandomMouseRobotProperties = Omit<RobotProperties, 'program'>;

/**
 * Random Mouse maze-solving robot that avoids immediate backtracking.
 *
 * This robot implements a simple but more intelligent random movement strategy
 * than the drunkard's walk. At each step, it randomly selects from available
 * directions but excludes the direction it just came from, preventing immediate
 * backtracking to the previous position.
 *
 * Key behaviors:
 * - Random movement selection from available directions
 * - Avoids returning to the immediately previous position
 * - Uses the robot's decision-making system for move selection
 * - Falls back to previous position if no other moves are available
 * - More efficient than pure random walk due to backtracking prevention
 *
 * This algorithm represents a middle ground between pure randomness and
 * memory-based approaches, providing better performance than drunkard's walk
 * while maintaining simplicity.
 *
 * @group Robot
 * @category  Random Mouse
 */
export class RandomMouseRobot extends Robot {
  /** Algorithm identifier for this robot type */
  public readonly algorithm = 'random-mouse';

  /**
   * Creates a new Random Mouse robot with random program configuration.
   *
   * @param props - Configuration including maze and robot properties
   */
  public constructor({ maze, ...props }: RandomMouseRobotProperties) {
    super({ maze, program: 'random', ...props });
  }

  /**
   * Gets the display name for this robot.
   *
   * @returns The algorithm name as the robot identifier
   */
  public override get name(): string {
    return this.algorithm;
  }

  /**
   * Executes one step of the random mouse algorithm.
   *
   * Randomly selects from all available moves except the previous position
   * to avoid immediate backtracking. If no forward moves are available
   * (dead end with only the previous position accessible), moves back to
   * the previous position to continue exploration.
   */
  public execute(): void {
    const next =
      this.decide(
        this.maze
          .moves(this.location, { wall: false })
          .filter((move) => !this.maze.isSame(move.target, this.previous)),
      )?.target ?? this.previous;
    this.moveTo(next);
  }
}
