import { create2dArray } from '@technobuddha/library';

import { Robot, type RobotProperties } from './robot.ts';
import { RobotError } from './robot-error.ts';

/**
 * Configuration properties for the Wall Walking robot.
 *
 * @group Robot
 * @category  Wall Walking
 */
export type WallWalkingRobotProperties = Omit<RobotProperties, 'program'> & {
  /** Direction preference for wall following (right-hand or left-hand rule) */
  turn: 'right' | 'left';
};

/**
 * Wall Walking maze-solving robot that follows walls using the hand-on-wall method.
 *
 * This robot implements the classic wall-following algorithm, also known as the "hand-on-wall"
 * or "wall follower" rule. The robot keeps one hand (left or right) on the wall and follows
 * it continuously until reaching the exit.
 *
 * Algorithm behavior:
 * - **Right-hand rule**: Keeps right hand on wall, turns right when possible
 * - **Left-hand rule**: Keeps left hand on wall, turns left when possible
 * - Guaranteed to solve any simply-connected maze (mazes without islands/holes)
 * - May not find solution in multiply-connected mazes with internal loops
 * - Detects infinite loops by counting visits per cell
 *
 * Key features:
 * - Simple and reliable for most maze types
 * - Loop detection prevents infinite execution
 * - Uses underlying robot decision system for wall-following logic
 * - Throws errors when stuck or unable to make decisions
 *
 * @group Robot
 * @category  Wall Walking
 */
export class WallWalkingRobot extends Robot {
  /** Algorithm identifier for this robot type */
  public readonly algorithm = 'wall-walking';
  /** 2D array tracking visit count for each cell to detect loops */
  private readonly visits: number[][];

  /**
   * Creates a new Wall Walking robot with specified turn preference.
   *
   * Sets up the robot with either right-wall or left-wall following program
   * and initializes visit tracking for loop detection.
   *
   * @param props - Configuration including turn direction and robot properties
   */
  public constructor({ turn = 'right', ...props }: WallWalkingRobotProperties) {
    const program = turn === 'right' ? 'right-wall' : 'left-wall';
    super({ program, ...props });
    this.visits = create2dArray(this.maze.width, this.maze.height, 0);
  }

  /**
   * Executes one step of the wall-walking algorithm.
   *
   * Increments the visit count for the current cell and checks for infinite loops
   * by comparing visits to the number of available directions. Uses the robot's
   * wall-following decision system to select the next move according to the
   * hand-on-wall rule.
   *
   * @throws {@link RobotError} When stuck in an infinite loop (too many visits to same cell)
   * @throws {@link RobotError} When unable to decide on a valid move
   */
  public execute(): void {
    const v = ++this.visits[this.location.x][this.location.y];
    if (v > Object.keys(this.maze.nexus(this.location).walls).length) {
      throw new RobotError(`${this.name} is stuck in a loop.`, this.color);
    }

    const next = this.decide(this.maze.moves(this.location, { wall: false }));
    if (next) {
      this.moveTo(next.target);
    } else {
      throw new RobotError(`${this.name} cannot decide on a move`, this.color);
    }
  }
}
