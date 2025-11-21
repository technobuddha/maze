import { type CellFacing, type Facing } from '../geometry/index.ts';

import { Robot, type RobotProperties } from './robot.ts';

/**
 * Direction of rotation for the Pledge algorithm.
 *
 * @group Robot
 * @category Types
 */
export type Turn = 'right' | 'left';

/**
 * Configuration properties for the Pledge algorithm robot.
 *
 * @group Robot
 * @category Properties
 */
export type PledgeRobotProperties = RobotProperties & {
  /** Direction preference for turning when following walls */
  turn: Turn;
};

/**
 * Rotates a cell's facing direction 90 degrees to the right.
 *
 * @param cell - The cell with current facing direction
 * @returns New cell with facing rotated clockwise
 */
function rotateRight(cell: CellFacing): CellFacing {
  return {
    ...cell,
    facing: ({ N: 'E', E: 'S', S: 'W', W: 'N' } as Record<Facing, Facing>)[cell.facing],
  };
}

/**
 * Rotates a cell's facing direction 90 degrees to the left.
 *
 * @param cell - The cell with current facing direction
 * @returns New cell with facing rotated counter-clockwise
 */
function rotateLeft(cell: CellFacing): CellFacing {
  return {
    ...cell,
    facing: ({ N: 'W', E: 'N', S: 'E', W: 'S' } as Record<Facing, Facing>)[cell.facing],
  };
}

/**
 * Pledge algorithm maze-solving robot that combines straight-line movement with wall-following.
 *
 * The Pledge algorithm is a sophisticated maze-solving strategy that maintains a "turn counter"
 * to track orientation changes. It operates in two modes:
 *
 * **Straight Mode**: Attempts to move in a straight line toward the goal direction
 * **Wall Mode**: Follows walls while tracking turn counter until returning to original orientation
 *
 * Key behaviors:
 * - Maintains a turn counter that increments on left turns and decrements on right turns
 * - Switches to wall-following mode when blocked from going straight
 * - Returns to straight mode only when counter reaches zero and facing original direction
 * - Guarantees solution for simply-connected mazes (mazes without holes)
 * - More efficient than pure wall-following as it can cut across open areas
 *
 * The algorithm is named after Jon Pledge and provides a mathematically proven
 * solution method for maze navigation.
 *
 * @group Robot
 * @category Algorithms
 */
export class PledgeRobot extends Robot {
  /** Current operating mode: straight-line or wall-following */
  protected mode: 'straight' | 'wall' = 'straight';
  /** Turn counter tracking total orientation change (positive = left turns, negative = right turns) */
  public counter: number;
  /** Algorithm identifier for this robot type */
  public readonly algorithm = 'pledge';
  /** Original facing direction when algorithm started */
  public trueFacing: Facing;

  /**
   * Creates a new Pledge algorithm robot with specified turn preference.
   *
   * Initializes the robot facing a valid movement direction and sets up
   * the turn counter and original facing direction for the algorithm.
   *
   * @param props - Configuration including turn direction and robot properties
   */
  public constructor({ turn = 'right', ...props }: PledgeRobotProperties) {
    const program = turn === 'right' ? 'right-turn' : 'left-turn';
    super({ program, ...props });

    this.counter = 0;

    const moves = this.maze.moves(this.location, { wall: false });

    // Rotate to face a direction where movement is possible
    while (true) {
      const [straight] = this.maze.straight(this.location, this.bias);
      if (moves.some((m) => m.direction === straight)) {
        break;
      }
      this.location.facing = rotateLeft(this.location).facing;
    }

    this.trueFacing = this.location.facing;
  }

  /**
   * Executes one step of the Pledge algorithm.
   *
   * In straight mode, attempts to move forward. If blocked, rotates right,
   * decrements counter, and switches to wall mode.
   *
   * In wall mode, follows the left wall (or right wall based on configuration).
   * Increments counter for left turns, decrements for right turns. Returns to
   * straight mode only when counter reaches zero and facing original direction.
   *
   * This ensures the robot completes any wall-following loop before resuming
   * straight-line movement toward the goal.
   */
  public execute(): void {
    while (true) {
      const moves = this.maze.moves(this.location, { wall: false });

      if (this.mode === 'straight') {
        // Try to move straight
        const [straight] = this.maze.straight(this.location, this.bias);
        const move = moves.find((m) => m.direction === straight);
        if (move) {
          this.bias = !this.bias;
          this.moveTo(move.target);
          return;
        }

        // Blocked, start wall-following
        this.location.facing = rotateRight(this.location).facing;
        this.counter -= 90;
        this.mode = 'wall';
      }

      // Wall-following mode: try to turn left and move
      const [left] = this.maze.leftTurn(this.location);
      const move = moves.find((m) => m.direction === left);
      if (move) {
        this.moveTo(move.target);
        this.counter += 90;
        // Check if we've completed the wall loop and can return to straight mode
        if (this.counter === 0 && this.location.facing === this.trueFacing) {
          this.mode = 'straight';
        }
        return;
      }

      // Can't turn left, so turn right and continue wall-following
      this.location.facing = rotateRight(this.location).facing;
      this.counter -= 90;
    }
  }
}
