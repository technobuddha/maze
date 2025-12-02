import { Robot, type RobotProperties } from './robot.ts';
import { RobotError } from './robot-error.ts';

/**
 * Configuration properties for the Drunkard's Walk robot.
 *
 * @group Robot
 * @category  Drunkards Walk
 */
export type DrunkenRobotProperties = Omit<RobotProperties, 'program'>;

/**
 * Drunkard's Walk maze-solving robot that moves randomly through the maze.
 *
 * This robot implements the simplest possible maze-solving strategy: random movement.
 * At each step, it randomly selects from all available directions and moves there.
 * While not guaranteed to find the shortest path (or any path quickly), it will
 * eventually solve any solvable maze given enough time.
 *
 * Key behaviors:
 * - Purely random movement selection from available directions
 * - No memory of previous moves or visited locations
 * - Uses the robot's decision-making system for move selection
 * - May revisit the same locations multiple times
 * - Simple but mathematically guaranteed to eventually find a solution
 *
 * This algorithm is useful for comparison with more sophisticated approaches
 * and demonstrates the baseline random walk behavior in maze solving.
 *
 * @group Robot
 * @category  Drunkards Walk
 */
export class DrunkenRobot extends Robot {
  /** Algorithm identifier for this robot type */
  public readonly algorithm = 'drunkards-walk';

  /**
   * Creates a new Drunkard's Walk robot with random program configuration.
   *
   * @param props - Configuration including maze and robot properties
   */
  public constructor({ maze, ...props }: DrunkenRobotProperties) {
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
   * Executes one step of the drunkard's walk algorithm.
   *
   * Randomly selects from all available moves (directions without walls)
   * and moves to that location. If no moves are available (completely
   * surrounded by walls), throws an error indicating the robot is stuck.
   *
   * @throws {@link RobotError} When no valid moves are available
   */
  public execute(): void {
    const next = this.decide(this.maze.moves(this.location, { wall: false }));
    if (next) {
      this.moveTo(next.target);
    } else {
      throw new RobotError(`${this.name} cannot move`, this.color);
    }
  }
}
